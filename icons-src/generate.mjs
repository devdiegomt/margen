import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('icons-src/icon.svg');

// íconos normales
for (const size of [192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(`public/pwa-${size}.png`);
}

// maskable: el contenido debe caber en el 80% central (safe zone)
const padded = await sharp(svg).resize(410, 410).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#fbf9f3' },
})
  .composite([{ input: padded, gravity: 'center' }])
  .png()
  .toFile('public/pwa-maskable-512.png');

// favicon + apple touch
await sharp(svg).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(svg).resize(64, 64).png().toFile('public/favicon.png');
console.log('íconos generados');
