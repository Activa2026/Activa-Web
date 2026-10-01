// Genera versiones livianas del logo, favicons e imagen Open Graph de respaldo.
// Uso: node tools/brand-assets.mjs
import sharp from 'sharp';
import { existsSync } from 'node:fs';

const brand = 'public/brand';
const iso = `${brand}/isotipo-activa.png`;
const logo = `${brand}/logo-activa.png`;

// Isotipo del menú: 44 px de alto (x2 para pantallas retina)
await sharp(iso).resize({ height: 88 }).webp({ quality: 90 }).toFile(`${brand}/isotipo-88.webp`);
await sharp(iso).resize({ height: 88 }).png({ compressionLevel: 9, palette: true }).toFile(`${brand}/isotipo-88.png`);

// Logo del footer: 200 px de ancho (x2)
await sharp(logo).resize({ width: 400 }).webp({ quality: 90 }).toFile(`${brand}/logo-400.webp`);
await sharp(logo).resize({ width: 400 }).png({ compressionLevel: 9, palette: true }).toFile(`${brand}/logo-400.png`);

// Favicons sobre fondo blanco
const square = (size) =>
  sharp(iso)
    .resize({ width: Math.round(size * 0.82), height: Math.round(size * 0.82), fit: 'contain', background: '#ffffff00' })
    .extend({
      top: Math.round(size * 0.09), bottom: Math.round(size * 0.09),
      left: Math.round(size * 0.09), right: Math.round(size * 0.09),
      background: '#ffffff',
    })
    .flatten({ background: '#ffffff' })
    .resize(size, size);
await square(32).png().toFile(`${brand}/favicon-32.png`);
await square(180).png().toFile(`${brand}/apple-touch-icon.png`);

// Imagen para compartir (respaldo mientras no exista public/images/og-image.jpg)
const og = 'public/images/og-image.jpg';
if (!existsSync(og)) {
  const logoBuf = await sharp(logo).resize({ height: 440 }).toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#F3EEE6' } })
    .composite([{ input: logoBuf, gravity: 'center' }])
    .jpeg({ quality: 86 })
    .toFile(og);
}
console.log('Listo');
