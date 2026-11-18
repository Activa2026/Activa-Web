// Catálogo de propiedades. Cada propiedad es una carpeta en src/content/propiedades/<nombre>/
// con un index.md (datos + descripción) y sus fotos. Ver src/content/propiedades/LEEME.md.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const propiedades = defineCollection({
  loader: glob({
    pattern: '*/index.md',
    base: './src/content/propiedades',
    // La dirección de la ficha es el nombre de la carpeta
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) =>
    z.object({
      // Referencia legible para citar la propiedad, p. ej. "Casa La Reina · Francisco de Villagra"
      codigo: z.string(),
      titulo: z.string(),
      // Frase destacada bajo el título (el titular del aviso)
      bajada: z.string().optional(),
      operacion: z.enum(['venta', 'arriendo']),
      tipo: z.enum(['casa', 'departamento', 'parcela', 'terreno', 'oficina', 'local']),
      comuna: z.string(),
      // Calle o barrio, sin número
      sector: z.string().optional(),
      precio: z.object({
        moneda: z.enum(['UF', 'CLP']),
        valor: z.number().positive(),
      }),
      gastosComunes: z.number().nonnegative().optional(),
      superficie: z
        .object({
          construida: z.number().positive().optional(),
          util: z.number().positive().optional(),
          terraza: z.number().positive().optional(),
          terreno: z.number().positive().optional(),
          total: z.number().positive().optional(),
        })
        .default({}),
      dormitorios: z.number().int().nonnegative().optional(),
      banos: z.number().int().nonnegative().optional(),
      estacionamientos: z.number().int().nonnegative().optional(),
      bodegas: z.number().int().nonnegative().optional(),
      antiguedad: z.number().int().nonnegative().optional(),
      orientacion: z.string().optional(),
      caracteristicas: z.array(z.string()).default([]),
      estado: z.enum(['disponible', 'reservada', 'vendida', 'arrendada']).default('disponible'),
      destacada: z.boolean().default(false),
      publicada: z.coerce.date(),
      fotos: z.array(image()).min(1),
      // Propiedades importadas desde la tienda de Dataprop (tools/importar-dataprop.mjs)
      dataprop: z
        .object({
          id: z.string(),
          url: z.url(),
          // Fecha en que dejó de aparecer en Dataprop (se marca vendida/arrendada)
          retirada: z.coerce.date().optional(),
        })
        .optional(),
      // Solo para pruebas: nunca se incluye en el sitio compilado.
      borrador: z.boolean().default(false),
    }),
});

// Guías: artículos del blog. Cada guía es un archivo src/content/guias/<nombre>.md (ver LEEME.md ahí).
const guias = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/guias' }),
  schema: z.object({
    // Título en dos partes: la segunda va en cursiva oliva (como en todo el sitio)
    titulo: z.string(),
    acento: z.string().optional(),
    // Resumen de 1 o 2 frases: se usa en la lista, en Google y al compartir
    resumen: z.string().max(200),
    fecha: z.coerce.date(),
    actualizada: z.coerce.date().optional(),
    tema: z.enum(['Comunas', 'Mercado', 'Consejos', 'Sistema Activa']),
    comunas: z.array(z.enum(['La Florida', 'Macul', 'Peñalolén', 'La Reina'])).default([]),
    // Fuentes públicas citadas en el texto (nunca proveedores de datos)
    fuentes: z.array(z.object({ nombre: z.string(), url: z.url() })).default([]),
    // Botón final: qué servicio ofrecer
    cta: z.enum(['vender', 'arrendar', 'administrar']).default('vender'),
    // Solo se ve en el computador (vista previa), nunca en el sitio publicado
    borrador: z.boolean().default(false),
  }),
});

export const collections = { propiedades, guias };
