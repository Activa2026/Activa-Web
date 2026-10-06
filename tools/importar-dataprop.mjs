// Importa las propiedades publicadas en la tienda de Dataprop y genera las fichas del sitio
// en src/content/propiedades/<nombre>/ (index.md + fotos).
//
// Uso: node tools/importar-dataprop.mjs
//
// - Propiedades nuevas o modificadas en Dataprop: se crean o actualizan.
// - Propiedades que ya no aparecen en Dataprop: quedan publicadas como vendidas o arrendadas.
// - Correcciones manuales: tools/dataprop-ajustes.json (por id de Dataprop), se aplican en cada importación.
// - Las fichas creadas a mano (sin bloque `dataprop`) nunca se tocan.

import { mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const TIENDA = 'https://app.dataprop.cl/tienda-oficial/activa-corredores-1869';
const BASE = 'https://app.dataprop.cl';
const DESTINO = 'src/content/propiedades';
const AJUSTES = 'tools/dataprop-ajustes.json';
const SIDECAR = '.dataprop.json';
const MAX_FOTOS = 20;
const ANCHO_FOTO = 1600;
const HEADERS = { 'User-Agent': 'ActivaCorredores-sitio/1.0 (+https://activacorredores.cl)' };

const avisos = [];
const aviso = (msg) => {
  avisos.push(msg);
  console.warn(`⚠️  ${msg}`);
};

// ---------- Utilidades de texto ----------

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

/** HTML → líneas de texto visibles. */
function lineas(html) {
  const sinCodigo = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '');
  return decodeEntities(sinCodigo.replace(/<[^>]+>/g, '\n'))
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** Respuesta "text/javascript" de Rails con HTML escapado dentro de $('…').html('…'). */
function desescaparJs(js) {
  return js
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/\\u0026/g, '&')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\//g, '/')
    .replace(/\\n/g, '\n');
}

const MINUSCULAS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'en', 'a', 'al', 'con', 'para', 'por']);

/** "Francisco De Villagra" → "Francisco de Villagra" */
function nombrePropio(s) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i > 0 && MINUSCULAS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

function slugify(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** "79 m²" → 79 ; "7.000 m²" → 7000 ; "1.234,5" → 1234.5 */
function numero(s) {
  if (s == null) return undefined;
  const m = String(s).match(/[\d.]+(?:,\d+)?/);
  if (!m) return undefined;
  const n = Number(m[0].replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

/** Titular en "Title Case" de Dataprop → oración, conservando nombres propios conocidos. */
function oracion(titulo, propios) {
  let t = titulo.trim().toLowerCase();
  t = t.charAt(0).toUpperCase() + t.slice(1);
  for (const p of propios.filter(Boolean).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${p.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'giu');
    t = t.replace(re, p);
  }
  // Nombres tras "plaza", "metro", "avenida", "parque", "mall"
  t = t.replace(/\b(plaza|metro|avenida|av\.|parque|mall|mallplaza)\s+(\p{L}+)/giu, (_, a, b) => {
    const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
    return `${cap(a)} ${cap(b)}`;
  });
  return t.replace(/[.\s]+$/, '');
}

// ---------- Lectura de Dataprop ----------

const TIPOS = {
  casa: 'casa',
  departamento: 'departamento',
  parcela: 'parcela',
  terreno: 'terreno',
  sitio: 'terreno',
  oficina: 'oficina',
  'local comercial': 'local',
  local: 'local',
};

async function obtener(url, xhr = false) {
  const res = await fetch(url, {
    headers: xhr
      ? { ...HEADERS, 'X-Requested-With': 'XMLHttpRequest', Accept: 'text/javascript, application/javascript' }
      : HEADERS,
  });
  if (!res.ok) throw new Error(`${res.status} al leer ${url}`);
  return res.text();
}

/** Tarjetas del listado de la tienda: id, enlace, comuna, estado y operación. */
async function leerListado() {
  const js = desescaparJs(await obtener(`${TIENDA}?filters%5Bproperty_type%5D=`, true));
  const tarjetas = js.split('card-search-properties').slice(1);
  return tarjetas.map((t) => {
    const href = t.match(/href="(\/propiedades\/[^"]+)"/)?.[1];
    const txt = lineas(t);
    const ubic = txt.find((l) => / - /.test(l)) ?? '';
    const estado = (txt.find((l) => /^(DISPONIBLE|RESERVADA|VENDIDA|ARRENDADA)$/i.test(l)) ?? 'DISPONIBLE').toLowerCase();
    return {
      href,
      slugDataprop: href?.split('/').pop(),
      id: href?.match(/\/propiedades\/(\d+)/)?.[1],
      comuna: ubic.split(' - ')[0].trim(),
      estado,
    };
  });
}

/** Descripción de la ficha (div.property-description) → párrafos en Markdown. */
function descripcionHtml(html) {
  const m = html.match(/class="[^"]*property-description[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  if (!m) return [];
  const texto = decodeEntities(
    m[1]
      .replace(/<sup>\s*2\s*<\/sup>/gi, '²')
      .replace(/<sup>\s*3\s*<\/sup>/gi, '³')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n- ')
      .replace(/<\/(p|div|h\d|li|ul|ol)>/gi, '\n\n')
      .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**')
      .replace(/<[^>]+>/g, ''),
  );
  return texto
    .split(/\n{2,}/)
    .map((p) => p.replace(/[ \t]+/g, ' ').replace(/\n /g, '\n').trim())
    .map((p) => p.replace(/\*\*\s*\*\*/g, ''))
    // "79 m construidos" → "79 m² construidos" (solo cuando es superficie)
    .map((p) => p.replace(/(\d)\s?(m|mts|mt)\.?(?=\s+(construidos|edificados|útiles|utiles|totales|de terreno|de superficie|cuadrados)\b)/gi, '$1 m²'))
    .filter(Boolean);
}

/** Pares clave → valor entre dos encabezados de la ficha. */
function pares(ls, desde, hasta) {
  const i = ls.indexOf(desde);
  if (i < 0) return {};
  const j = ls.indexOf(hasta, i + 1);
  const tramo = ls.slice(i + 1, j < 0 ? undefined : j);
  const out = {};
  for (let k = 0; k + 1 < tramo.length; k += 2) out[tramo[k]] = tramo[k + 1];
  return out;
}

async function leerFicha(item) {
  const html = await obtener(`${BASE}${item.href}`);
  const ls = lineas(html);
  const ogTitulo = decodeEntities(html.match(/property="og:title" content="([^"]*)"/)?.[1] ?? '');

  // El nombre de la ficha trae operación y tipo: 1782489201-venta-casa-3hab-2ba-la-reina
  const [, opSlug, tipoSlug] = item.slugDataprop.split('-');
  // Respaldo: el texto "Casa / en / VENTA" (ojo: "EN" en mayúsculas es el selector de idioma)
  const iOp = ls.findIndex((l, i) => l === 'en' && /^(VENTA|ARRIENDO)$/i.test(ls[i + 1] ?? ''));
  const tipoTxt = (TIPOS[tipoSlug] ? tipoSlug : (ls[iOp - 1] ?? '')).toLowerCase();
  const operacion = /arriendo/i.test(opSlug) || /arriendo/i.test(ls[iOp + 1] ?? '') ? 'arriendo' : 'venta';
  const precioTxt = ls.slice(Math.max(iOp, 0)).find((l) => /^(UF|\$)\s?[\d.,]+$/.test(l)) ?? '';
  const direccion = ls[ls.indexOf('Ubicación') + 1] ?? '';

  const carac = pares(ls, 'Principales características', 'Descripción');
  // Resumen bajo el precio: dormitorios, baños y m² (útil cuando no hay "Principales características")
  const iClp = ls.indexOf('CLP');
  const iCod = ls.indexOf('Código de Propiedad');
  const resumen = iClp >= 0 && iCod > iClp ? ls.slice(iClp + 1, iCod) : [];
  const resumenM2 = resumen.find((l) => /m²$/.test(l));
  const resumenNums = resumen.filter((l) => /^\d+$/.test(l));

  const parrafos = descripcionHtml(html);
  const adic = pares(ls, 'Características Adicionales', 'Inmueble cercano a');
  const seccion = (titulo) => {
    const i = ls.indexOf(titulo);
    if (i < 0) return [];
    const out = [];
    for (const l of ls.slice(i + 1)) {
      if (/^(características|cerrar$|estimado postulante)/i.test(l) || l === 'Inmueble cercano a') break;
      if (l.length < 40) out.push(l);
    }
    return out;
  };
  const cercanias = seccion('Inmueble cercano a').filter((l) => !/sin informaci/i.test(l));
  const condominio = seccion('Características Condominio').filter((l) => !/sin informaci|no posee/i.test(l));

  // Fotos (galería pública)
  const galeria = desescaparJs(await obtener(`${BASE}/mis-propiedades/${item.slugDataprop}/photos/gallery`, true));
  const fotos = [...new Set([...galeria.matchAll(/src="(https:\/\/cdn\.dataprop\.cl\/photos\/images\/[^"]+\/original\/[^"]+)"/g)].map((m) => m[1]))];

  return {
    ogTitulo, tipoTxt, operacion, precioTxt, direccion, carac, parrafos, adic, cercanias, condominio, fotos,
    resumenM2: numero(resumenM2), resumenDorm: numero(resumenNums[0]), resumenBanos: numero(resumenNums[1]),
  };
}

// ---------- Transformación al formato del sitio ----------


const TIPO_NOMBRE = { casa: 'Casa', departamento: 'Departamento', parcela: 'Parcela', terreno: 'Terreno', oficina: 'Oficina', local: 'Local' };
const NOTA_INTERNA = /a verificar con|te recomiendo confirmar|antes de publicar|nota interna/i;

function transformar(item, f, ajuste = {}) {
  const tipo = TIPOS[f.tipoTxt] ?? 'casa';
  const comuna = item.comuna || nombrePropio(f.direccion.split(',').at(-3) ?? '').replace(/^\d+\s*/, '');
  const calle = nombrePropio(
    (f.direccion.split(',')[0] ?? '')
      .replace(/\s+(n[°º.]?\s*)?\d+[a-z]?\b.*$/i, '')
      .trim(),
  );
  const c = (k) => f.carac[k];
  const dormitorios = numero(c('Dormitorios')) ?? (f.resumenDorm || undefined);
  const banos = numero(c('Baños')) ?? (f.resumenBanos || undefined);
  const total = numero(c('Métros Totales') ?? c('Metros Totales')) ?? f.resumenM2;
  const util = numero(c('Métros Utiles') ?? c('Metros Utiles') ?? c('Métros Útiles'));

  const superficie = {};
  if (tipo === 'parcela' || tipo === 'terreno') {
    if (total) superficie.terreno = total;
  } else {
    if (util) superficie.util = util;
    if (total && total !== util) superficie.total = total;
  }

  const precio = {
    moneda: /^UF/.test(f.precioTxt) ? 'UF' : 'CLP',
    valor: numero(f.precioTxt),
  };

  const parrafos = f.parrafos.filter((p) => {
    if (NOTA_INTERNA.test(p)) {
      aviso(`"${calle}, ${comuna}": se omitió un párrafo que parece una nota interna (revísalo en Dataprop): «${p.slice(0, 90)}…»`);
      return false;
    }
    return true;
  });

  const caracteristicas = [];
  for (const [k, v] of Object.entries(f.adic)) {
    if (/^s[ií]$/i.test(v)) caracteristicas.push(k.replace(/^Tiene\s+/i, '').replace(/^\p{L}/u, (x) => x.toUpperCase()));
  }
  const cocina = c('Tipo de cocina');
  if (cocina && !/sin info/i.test(cocina)) caracteristicas.push(cocina.charAt(0).toUpperCase() + cocina.slice(1).toLowerCase());
  const calef = c('Tipo de calefacción');
  if (calef && !/sin calefacci|sin info/i.test(calef)) caracteristicas.push(`Calefacción: ${calef.toLowerCase()}`);
  const pisos = numero(c('Pisos'));
  if (tipo === 'casa' && pisos) caracteristicas.push(pisos === 1 ? 'Un piso' : `${pisos} pisos`);
  for (const extra of f.condominio) caracteristicas.push(extra);
  for (const lugar of f.cercanias) caracteristicas.push(`Cerca de ${lugar.toLowerCase()}`);

  const titulo =
    tipo === 'parcela' || tipo === 'terreno'
      ? `${TIPO_NOMBRE[tipo]}${superficie.terreno ? ` de ${superficie.terreno.toLocaleString('es-CL')} m²` : ''} en ${comuna}`
      : `${TIPO_NOMBRE[tipo]}${dormitorios ? ` de ${dormitorios} dormitorio${dormitorios === 1 ? '' : 's'}` : ''} en ${comuna}`;

  const data = {
    codigo: `${TIPO_NOMBRE[tipo]} ${comuna}${calle ? ` · ${calle}` : ''}`,
    titulo,
    // Se omiten titulares tipo aviso ("Venta parcela 7000 mts…")
    bajada:
      f.ogTitulo && !/^(venta|arriendo)\b|\b\d+\s*(hab|ba|mts?)\b/i.test(f.ogTitulo)
        ? oracion(f.ogTitulo, [comuna, calle, ...comuna.split(' ')])
        : undefined,
    operacion: f.operacion,
    tipo,
    comuna,
    sector: calle || undefined,
    precio,
    superficie,
    dormitorios,
    banos,
    estacionamientos: numero(c('Estacionamientos')),
    bodegas: numero(c('Bodegas')),
    antiguedad: numero(c('Antigüedad (Años)')),
    orientacion: c('Orientación') ? nombrePropio(c('Orientación')) : undefined,
    caracteristicas,
    estado: ['disponible', 'reservada', 'vendida', 'arrendada'].includes(item.estado) ? item.estado : 'disponible',
    destacada: false,
    publicada: new Date(Number(item.id) * 1000 > Date.UTC(2015) ? Number(item.id) * 1000 : Date.now())
      .toISOString()
      .slice(0, 10),
    dataprop: { id: item.id, url: `${BASE}${item.href}` },
    descripcion: parrafos.join('\n\n'),
  };
  return { ...data, ...ajuste };
}

// ---------- Escritura ----------

function yaml(valor, indent = '') {
  if (Array.isArray(valor)) {
    if (valor.length === 0) return ' []';
    return valor.map((v) => `\n${indent}  - ${typeof v === 'object' ? yaml(v, indent + '    ').trimStart() : JSON.stringify(v)}`).join('');
  }
  if (valor && typeof valor === 'object') {
    const filas = Object.entries(valor).filter(([, v]) => v !== undefined && v !== null);
    if (filas.length === 0) return ' {}';
    return filas
      .map(([k, v]) => `\n${indent}  ${k}:${typeof v === 'object' ? yaml(v, indent + '  ') : ` ${typeof v === 'string' ? JSON.stringify(v) : v}`}`)
      .join('');
  }
  return ` ${typeof valor === 'string' ? JSON.stringify(valor) : valor}`;
}

function frontmatter(data, fotos) {
  const { descripcion, ...rest } = data;
  const campos = { ...rest, fotos };
  const cuerpo = Object.entries(campos)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}:${typeof v === 'object' ? yaml(v) : ` ${typeof v === 'string' ? JSON.stringify(v) : v}`}`)
    .join('\n');
  return `---\n# Generado por tools/importar-dataprop.mjs desde Dataprop. No editar a mano:\n# se sobrescribe en cada importación. Para corregir algo, usa tools/dataprop-ajustes.json.\n${cuerpo}\n---\n\n${descripcion}\n`;
}

async function descargarFotos(carpeta, urls) {
  const urlsUsadas = urls.slice(0, MAX_FOTOS);
  const previo = existsSync(path.join(carpeta, SIDECAR))
    ? JSON.parse(await readFile(path.join(carpeta, SIDECAR), 'utf8'))
    : null;
  const nombres = urlsUsadas.map((_, i) => `${String(i + 1).padStart(2, '0')}.jpg`);
  const iguales =
    previo &&
    JSON.stringify(previo.fotosOrigen) === JSON.stringify(urlsUsadas) &&
    nombres.every((n) => existsSync(path.join(carpeta, n)));
  if (!iguales) {
    // Borra fotos anteriores y descarga las actuales
    for (const f of await readdir(carpeta)) if (/^\d+\.jpg$/.test(f)) await rm(path.join(carpeta, f));
    for (const [i, url] of urlsUsadas.entries()) {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`${res.status} al descargar ${url}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await sharp(buf)
        .rotate()
        .resize({ width: ANCHO_FOTO, withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(path.join(carpeta, nombres[i]));
    }
  }
  return { fotos: nombres.map((n) => `./${n}`), fotosOrigen: urlsUsadas, descargadas: !iguales };
}

/** Fichas importadas que ya existen: id de Dataprop → { carpeta, sidecar }. */
async function existentes() {
  const out = new Map();
  if (!existsSync(DESTINO)) return out;
  for (const d of await readdir(DESTINO, { withFileTypes: true })) {
    const s = path.join(DESTINO, d.name, SIDECAR);
    if (d.isDirectory() && existsSync(s)) {
      const side = JSON.parse(await readFile(s, 'utf8'));
      out.set(side.data.dataprop.id, { carpeta: path.join(DESTINO, d.name), side });
    }
  }
  return out;
}

async function guardar(carpeta, data, fotosInfo) {
  await writeFile(path.join(carpeta, 'index.md'), frontmatter(data, fotosInfo.fotos));
  await writeFile(
    path.join(carpeta, SIDECAR),
    JSON.stringify({ data, fotos: fotosInfo.fotos, fotosOrigen: fotosInfo.fotosOrigen }, null, 2) + '\n',
  );
}

// ---------- Principal ----------

async function main() {
  const ajustes = existsSync(AJUSTES) ? JSON.parse(await readFile(AJUSTES, 'utf8')) : {};
  const listado = (await leerListado()).filter((i) => i.id && i.href);
  if (listado.length === 0) {
    // Nunca marcar todo como vendido por una falla de lectura
    throw new Error('La tienda de Dataprop no devolvió propiedades; no se hizo ningún cambio.');
  }
  console.log(`Dataprop: ${listado.length} propiedades publicadas.`);

  const previas = await existentes();
  const usadas = new Set([...previas.values()].map((p) => path.basename(p.carpeta)));
  const vistos = new Set();
  const resumen = { nuevas: [], actualizadas: [], retiradas: [] };

  for (const item of listado) {
    vistos.add(item.id);
    let ficha;
    try {
      ficha = await leerFicha(item);
    } catch (e) {
      aviso(`No se pudo leer ${item.href}: ${e.message}. Se mantiene la ficha anterior, si existe.`);
      continue;
    }
    const data = transformar(item, ficha, ajustes[item.id]);
    if (!data.precio.valor) aviso(`"${data.codigo}": no se encontró el precio.`);
    if (ficha.fotos.length === 0) {
      aviso(`"${data.codigo}": no tiene fotos públicas; se omite.`);
      continue;
    }

    let carpeta = previas.get(item.id)?.carpeta;
    if (!carpeta) {
      let nombre = slugify(`${data.tipo} ${data.comuna} ${data.sector ?? ''}`) || `propiedad-${item.id}`;
      for (let n = 2; usadas.has(nombre) || existsSync(path.join(DESTINO, nombre)); n++) nombre = `${nombre.replace(/-\d+$/, '')}-${n}`;
      usadas.add(nombre);
      carpeta = path.join(DESTINO, nombre);
      await mkdir(carpeta, { recursive: true });
      resumen.nuevas.push(data.codigo);
    } else {
      resumen.actualizadas.push(data.codigo);
    }
    const fotosInfo = await descargarFotos(carpeta, ficha.fotos);
    await guardar(carpeta, data, fotosInfo);
  }

  // Las que ya no están en Dataprop quedan como vendidas o arrendadas
  for (const [id, { carpeta, side }] of previas) {
    if (vistos.has(id)) continue;
    const data = side.data;
    if (data.estado !== 'vendida' && data.estado !== 'arrendada') {
      data.estado = data.operacion === 'arriendo' ? 'arrendada' : 'vendida';
      data.dataprop.retirada = new Date().toISOString().slice(0, 10);
      await guardar(carpeta, data, { fotos: side.fotos, fotosOrigen: side.fotosOrigen });
      resumen.retiradas.push(`${data.codigo} → ${data.estado}`);
    }
  }

  console.log(`Nuevas: ${resumen.nuevas.length ? resumen.nuevas.join('; ') : '—'}`);
  console.log(`Actualizadas: ${resumen.actualizadas.length}`);
  console.log(`Marcadas como cerradas: ${resumen.retiradas.length ? resumen.retiradas.join('; ') : '—'}`);
  if (avisos.length) console.log(`\n${avisos.length} aviso(s), revisar arriba.`);
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
