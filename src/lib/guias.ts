import { getCollection, type CollectionEntry } from 'astro:content';

export type Guia = CollectionEntry<'guias'>;

/** Guías visibles, de la más nueva a la más antigua. Los borradores solo aparecen en desarrollo. */
export async function getGuias(): Promise<Guia[]> {
  const all = await getCollection('guias', ({ data }) => import.meta.env.DEV || !data.borrador);
  return all.sort((a, b) => b.data.fecha.getTime() - a.data.fecha.getTime());
}

const df = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function formatFecha(d: Date): string {
  return df.format(d);
}

/** Minutos de lectura aproximados (200 palabras por minuto). */
export function minutosLectura(texto: string | undefined): number {
  const palabras = (texto ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palabras / 200));
}

export const CTA: Record<Guia['data']['cta'], { titulo: string; acento: string; texto: string; label: string; op: string }> = {
  vender: {
    titulo: '¿Estás pensando en vender?',
    acento: 'Parte por el precio correcto.',
    texto: 'Te entregamos una Valorización 360° sin costo, con ventas reales inscritas en el CBR y tres precios para decidir.',
    label: 'Solicitar Valorización 360°',
    op: 'vender',
  },
  arrendar: {
    titulo: '¿Quieres arrendar tu propiedad?',
    acento: 'Te ayudamos a hacerlo bien.',
    texto: 'Te decimos en cuánto arrendarla y buscamos un arrendatario evaluado.',
    label: 'Quiero arrendar',
    op: 'arrendar',
  },
  administrar: {
    titulo: '¿Prefieres no preocuparte',
    acento: 'de tu arriendo?',
    texto: 'Administramos cerca de 60 propiedades: cobro, mantenciones, reajustes y un resumen claro cada mes.',
    label: 'Quiero que la administren',
    op: 'administrar',
  },
};
