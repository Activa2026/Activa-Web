// Imagen para compartir el link (1200×630): foto de portada + panel arena con el logo.
// Uso: node tools/og-image.mjs
import sharp from 'sharp';

const W = 1200, H = 630, PANEL = 440;
const photo = await sharp('src/assets/images/hero.jpg')
  .resize(W - PANEL + 40, H, { fit: 'cover', position: 'centre' })
  .toBuffer();
const logo = await sharp('public/brand/logo-activa.png').resize({ width: 340 }).toBuffer();
const logoMeta = await sharp(logo).metadata();

await sharp({ create: { width: W, height: H, channels: 3, background: '#F3EEE6' } })
  .composite([
    { input: photo, left: PANEL - 40, top: 0 },
    // borde suave entre el panel y la foto
    {
      input: Buffer.from(
        `<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" x2="1">
           <stop offset="0" stop-color="#F3EEE6" stop-opacity="1"/>
           <stop offset="1" stop-color="#F3EEE6" stop-opacity="0"/></linearGradient></defs>
           <rect x="${PANEL - 40}" y="0" width="80" height="${H}" fill="url(#g)"/></svg>`,
      ),
      left: 0,
      top: 0,
    },
    { input: logo, left: Math.round((PANEL - 340) / 2), top: Math.round((H - logoMeta.height) / 2) },
  ])
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile('public/images/og-image.jpg');
console.log('og-image.jpg listo');
