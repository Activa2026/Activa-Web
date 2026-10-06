import { getCollection, type CollectionEntry } from 'astro:content';

export type Propiedad = CollectionEntry<'propiedades'>;

/** Propiedades visibles: los borradores solo aparecen en desarrollo. */
export async function getPropiedades(): Promise<Propiedad[]> {
  const all = await getCollection('propiedades', ({ data }) => import.meta.env.DEV || !data.borrador);
  const order = { disponible: 0, reservada: 1, vendida: 2, arrendada: 2 } as const;
  return all.sort(
    (a, b) =>
      order[a.data.estado] - order[b.data.estado] ||
      Number(b.data.destacada) - Number(a.data.destacada) ||
      b.data.publicada.getTime() - a.data.publicada.getTime(),
  );
}

const nf = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });

export function formatPrecio(p: Propiedad['data']['precio']): string {
  return p.moneda === 'UF' ? `UF ${nf.format(p.valor)}` : `$${nf.format(p.valor)}`;
}

export function formatNumero(n: number): string {
  return nf.format(n);
}

export const TIPO_LABEL: Record<Propiedad['data']['tipo'], string> = {
  casa: 'Casa',
  departamento: 'Departamento',
  parcela: 'Parcela',
  terreno: 'Terreno',
  oficina: 'Oficina',
  local: 'Local comercial',
};

export const OPERACION_LABEL: Record<Propiedad['data']['operacion'], string> = {
  venta: 'En venta',
  arriendo: 'En arriendo',
};

/** Texto del cartel; null si está disponible. */
export function cartel(estado: Propiedad['data']['estado']): string | null {
  return { disponible: null, reservada: 'Reservada', vendida: 'Vendida', arrendada: 'Arrendada' }[estado];
}

export function cerrada(estado: Propiedad['data']['estado']): boolean {
  return estado === 'vendida' || estado === 'arrendada';
}

/** Superficie principal para mostrar en tarjetas. */
export function superficiePrincipal(d: Propiedad['data']): string | null {
  const s = d.superficie;
  if (s.construida) return `${formatNumero(s.construida)} m² const.`;
  if (s.util) return `${formatNumero(s.util)} m² útiles`;
  if (s.terreno) return `${formatNumero(s.terreno)} m² terreno`;
  return null;
}

/** Enlace de "Propiedades": el catálogo si hay propiedades publicadas; si no, la sección de Inicio. */
export async function enlacePropiedades(): Promise<string> {
  return (await getPropiedades()).length > 0 ? '/propiedades' : '/#propiedades';
}
