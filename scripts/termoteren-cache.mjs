// Po buildu: v dist/termoteren/index.html dobi vsaka skripta in slog oznako vsebine (?v=…).
// GitHub Pages datoteke pusti v predpomnilniku 10 minut; brez oznake bi brskalnik po objavi
// lahko združil novo stran s staro skripto in pokazal napol staro igro.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DIR = path.resolve('dist', 'termoteren');
const page = path.join(DIR, 'index.html');
if (!fs.existsSync(page)) process.exit(0);

let html = fs.readFileSync(page, 'utf8');
let n = 0;
html = html.replace(/(src|href)="([a-z0-9._-]+\.(?:js|css))"/gi, (m, attr, file) => {
  const f = path.join(DIR, file);
  if (!fs.existsSync(f)) return m;
  const v = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 10);
  n++;
  return `${attr}="${file}?v=${v}"`;
});
fs.writeFileSync(page, html);
console.log(`✓ termoteren: ${n} datotek z oznako različice`);
