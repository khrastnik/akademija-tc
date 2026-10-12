// Enkratno: ustvari ikone aplikacije in sliko za predogled pri deljenju v public/.
// Zaženi z `node scripts/assets.mjs`, ko se spremeni logotip ali naslov.
import sharp from 'sharp';

const COPPER = '#a4502a';
const PAPER = '#f7f3ec';
const INK = '#221d17';
const OCHRE = '#a86b12';

const waves = (s) =>
  `<path d="M${9 * s} ${21 * s}c0-${4 * s} ${3 * s}-${5 * s} ${3 * s}-${9 * s}m${4 * s} ${9 * s}c0-${4 * s} ${3 * s}-${5 * s} ${3 * s}-${9 * s}m${4 * s} ${9 * s}c0-${4 * s}-${3 * s}-${5 * s}-${3 * s}-${9 * s}" stroke="#fff" stroke-width="${2.4 * s}" fill="none" stroke-linecap="round"/>`;

function icon(size, maskable = false) {
  const s = size / 32;
  // Maskable ikone potrebujejo varen rob (Android jih obreže v krog).
  const inner = maskable ? `<g transform="translate(${size * 0.1} ${size * 0.1}) scale(0.8)">${waves(s)}</g>` : waves(s);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${maskable ? 0 : 8 * s}" fill="${COPPER}"/>${inner}</svg>`;
}

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <rect x="0" y="0" width="1200" height="14" fill="${COPPER}"/>
  <g transform="translate(80 92)"><rect width="112" height="112" rx="28" fill="${COPPER}"/><g transform="scale(3.5)">${waves(1)}</g></g>
  <text x="80" y="300" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="4" fill="${OCHRE}">BREZPLAČNO · ODPRTO · NA TELEFONU</text>
  <text x="80" y="388" font-family="Segoe UI, Arial, sans-serif" font-size="76" font-weight="800" fill="${INK}">Akademija toplotnih črpalk</text>
  <text x="80" y="470" font-family="Segoe UI, Arial, sans-serif" font-size="40" fill="#5b5246">Od nič do serviserja – kratke lekcije s kvizi.</text>
  <text x="80" y="560" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="600" fill="${COPPER}">khrastnik.github.io/akademija-tc</text>
</svg>`;

await sharp(Buffer.from(icon(192))).png().toFile('public/icon-192.png');
await sharp(Buffer.from(icon(512))).png().toFile('public/icon-512.png');
await sharp(Buffer.from(icon(512, true))).png().toFile('public/icon-maskable-512.png');
await sharp(Buffer.from(og)).png({ compressionLevel: 9, palette: true }).toFile('public/og.png');
console.log('✓ ikone in og.png ustvarjene v public/');
