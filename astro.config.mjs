import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync, existsSync } from 'node:fs';

// ¿Hay alguna propiedad publicada (carpeta con index.md que no sea borrador)?
const dir = './src/content/propiedades';
const hayPropiedades = readdirSync(dir, { withFileTypes: true }).some((d) => {
  const file = `${dir}/${d.name}/index.md`;
  return d.isDirectory() && existsSync(file) && !/^borrador:\s*true\s*$/m.test(readFileSync(file, 'utf8'));
});

export default defineConfig({
  site: 'https://activacorredores.cl',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404') && (hayPropiedades || !page.endsWith('/propiedades')),
    }),
  ],
});
