import type { APIRoute } from 'astro';
import { getPropiedades, cerrada } from '../../lib/propiedades';
import { SITE } from '../../site';

/**
 * Arriendos disponibles, para el portal de postulación en línea (postula.activacorredores.cl).
 * El screening crea y actualiza sus propiedades a partir de esta lista, con el mismo código
 * que la ficha del sitio. No aparece en el menú ni en el sitemap.
 */
export const GET: APIRoute = async () => {
  const arriendos = (await getPropiedades())
    .filter((p) => p.data.operacion === 'arriendo' && !cerrada(p.data.estado))
    .map((p) => ({
      id: p.id,
      url: new URL(`/propiedades/${p.id}`, SITE.url).href,
      titulo: p.data.titulo,
      tipo: p.data.tipo,
      comuna: p.data.comuna,
      sector: p.data.sector ?? null,
      precio: p.data.precio,
      gastosComunes: p.data.gastosComunes ?? null,
    }));
  return new Response(JSON.stringify({ actualizado: new Date().toISOString(), arriendos }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
};
