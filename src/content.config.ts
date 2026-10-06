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
      codigo: z.string(),
      titulo: z.string(),
      operacion: z.enum(['venta', 'arriendo']),
      tipo: z.enum(['casa', 'departamento', 'parcela', 'terreno', 'oficina', 'local']),
      comuna: z.string(),
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
        })
        .default({}),
      dormitorios: z.number().int().nonnegative().optional(),
      banos: z.number().int().nonnegative().optional(),
      estacionamientos: z.number().int().nonnegative().optional(),
      bodegas: z.number().int().nonnegative().optional(),
      caracteristicas: z.array(z.string()).default([]),
      estado: z.enum(['disponible', 'reservada', 'vendida', 'arrendada']).default('disponible'),
      destacada: z.boolean().default(false),
      publicada: z.coerce.date(),
      fotos: z.array(image()).min(1),
      // Solo para pruebas: nunca se incluye en el sitio compilado.
      borrador: z.boolean().default(false),
    }),
});

export const collections = { propiedades };
