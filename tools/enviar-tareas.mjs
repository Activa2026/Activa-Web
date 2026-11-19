// Envía tareas a la bandeja del Planificador de la intranet (intranet.activacorredores.cl).
// La Agenda las muestra como "· Sitio web" y su asistente las ubica en los huecos libres.
//
// Uso: node tools/enviar-tareas.mjs <archivo.json>
//   El archivo es una lista de tareas: [{ titulo, seccion, duracion_min, detalle, enlace, fecha_limite, referencia }]
//   - seccion: captacion | administracion | marketing | gestion | foco
//   - referencia: única por tarea (p. ej. "web:perfil-google"); si ya llegó, no se duplica.
//
// La clave TAREAS_TOKEN NO va en el repositorio: se lee de la variable de entorno TAREAS_TOKEN
// o del archivo ~/.config/activa/tareas-token (una sola línea).

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const URL_API = 'https://intranet.activacorredores.cl/api/tareas';
const EMAIL = process.env.TAREAS_EMAIL || 'andres@activacorredores.cl';
const ARCHIVO_CLAVE = path.join(os.homedir(), '.config', 'activa', 'tareas-token');

async function clave() {
  if (process.env.TAREAS_TOKEN) return process.env.TAREAS_TOKEN.trim();
  if (existsSync(ARCHIVO_CLAVE)) return (await readFile(ARCHIVO_CLAVE, 'utf8')).trim();
  throw new Error(`Falta la clave: guárdala en ${ARCHIVO_CLAVE} (una sola línea).`);
}

async function main() {
  const archivo = process.argv[2];
  if (!archivo) throw new Error('Indica el archivo JSON con las tareas.');
  const tareas = JSON.parse(await readFile(archivo, 'utf8'));
  if (!Array.isArray(tareas) || tareas.length === 0) throw new Error('El archivo debe ser una lista con al menos una tarea.');
  const token = await clave();

  let total = { creadas: 0, repetidas: 0, errores: [] };
  // La API acepta hasta 50 por envío
  for (let i = 0; i < tareas.length; i += 50) {
    const res = await fetch(URL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: EMAIL, origen: 'web', tareas: tareas.slice(i, i + 50) }),
    });
    const cuerpo = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`La intranet respondió ${res.status}: ${cuerpo.error || 'sin detalle'}`);
    total = {
      creadas: total.creadas + cuerpo.creadas,
      repetidas: total.repetidas + cuerpo.repetidas,
      errores: [...total.errores, ...cuerpo.errores],
    };
  }
  console.log(`Creadas: ${total.creadas} · ya existían: ${total.repetidas}`);
  for (const e of total.errores) console.log(`⚠️  ${e}`);
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
