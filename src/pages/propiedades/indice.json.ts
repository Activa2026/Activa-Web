import type { APIRoute } from 'astro';
import { getPropiedades, cerrada } from '../../lib/propiedades';
import { SITE } from '../../site';

/**
 * Índice de las propiedades importadas desde Dataprop: número de Dataprop → página en el sitio.
 * Lo usa la Intranet Activa para incluir el enlace a la publicación en el WhatsApp de los leads de portales
 * (los correos de Dataprop traen el número, no la página del sitio). No aparece en el menú ni en el sitemap.
 */
export const GET: APIRoute = async () => {
  const propiedades = (await getPropiedades())
    .filter((p) => p.data.dataprop)
    .map((p) => ({
      dataprop: p.data.dataprop!.id,
      url: new URL(`/propiedades/${p.id}`, SITE.url).href,
      titulo: p.data.titulo,
      operacion: p.data.operacion,
      comuna: p.data.comuna,
      estado: p.data.estado,
      disponible: !cerrada(p.data.estado),
    }));
  return new Response(JSON.stringify({ actualizado: new Date().toISOString(), propiedades }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
