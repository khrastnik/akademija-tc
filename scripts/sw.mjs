// Po buildu ustvari dist/sw.js s seznamom vseh strani in datotek.
// Različica je hash vsebine: nova objava = nov predpomnilnik, stari se pobriše.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DIST = path.resolve('dist');
const BASE = '/akademija-tc/';
// Velikih slik za deljenje (og.png) brskalnik ne potrebuje za delovanje strani.
const SKIP = new Set(['sw.js', 'og.png']);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const files = walk(DIST)
  .map((f) => path.relative(DIST, f).split(path.sep).join('/'))
  .filter((f) => !SKIP.has(f))
  // Veliki paketi (three.js za simulator) se shranijo šele, ko jih kdo res odpre – ne vsem obiskovalcem.
  .filter((f) => fs.statSync(path.join(DIST, f)).size < 150 * 1024)
  .sort();

const hash = crypto.createHash('sha256');
for (const f of files) hash.update(f).update(fs.readFileSync(path.join(DIST, f)));
const version = hash.digest('hex').slice(0, 12);

// Strani kot jih odpira brskalnik: "pot/index.html" -> "/akademija-tc/pot/"
const urls = files.map((f) => BASE + f.replace(/(^|\/)index\.html$/, '$1'));

const sw = `// Ustvari scripts/sw.mjs – ne urejaj ročno.
const VERSION = ${JSON.stringify(version)};
const CACHE = 'akademija-tc-' + VERSION;
const PRECACHE = ${JSON.stringify(urls)};
const OFFLINE = ${JSON.stringify(BASE + '404.html')};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const old = (await caches.keys()).filter((k) => k.startsWith('akademija-tc-') && k !== CACHE);
      await Promise.all(old.map((k) => caches.delete(k)));
      await self.clients.claim();
      // Nova različica namesto stare: odprte zavihke enkrat osveži, da nihče ne obtiči na stari strani.
      // Osvežitev SAMO sprožimo, ne čakamo nanjo: čaka namreč na konec aktivacije (sicer zastoj).
      if (old.length) {
        const tabs = await self.clients.matchAll({ type: 'window' });
        for (const t of tabs) t.navigate(t.url).catch(() => {});
      }
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith(${JSON.stringify(BASE)})) return;

  // Datoteke z zgoščeno vsebino v imenu se ne spreminjajo: najprej predpomnilnik.
  if (url.pathname.includes('/_astro/')) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => put(req, res))));
    return;
  }

  // Strani: najprej omrežje (vedno zadnja različica), predpomnilnik le brez povezave
  // ali ko omrežje ne odgovori v 4 s (slab signal na terenu).
  event.respondWith(
    (async () => {
      const fresh = fetch(req).then((res) => put(req, res));
      event.waitUntil(fresh.catch(() => {}));
      const timeout = new Promise((r) => setTimeout(() => r(null), 4000));
      try {
        const res = await Promise.race([fresh, timeout]);
        if (res) return res;
      } catch {
        /* brez povezave */
      }
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        return await fresh;
      } catch {
        return (await caches.match(OFFLINE)) || Response.error();
      }
    })(),
  );
});

function put(req, res) {
  if (res.ok && res.type === 'basic') {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
}
`;

fs.writeFileSync(path.join(DIST, 'sw.js'), sw);
console.log(`✓ sw.js: ${urls.length} datotek v predpomnilniku, različica ${version}`);
