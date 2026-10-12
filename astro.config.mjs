import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// GitHub Pages: https://khrastnik.github.io/akademija-tc/
// Lastna domena kasneje: nastavi `site` na domeno, `base` na '/' in dodaj public/CNAME.
export default defineConfig({
  site: 'https://khrastnik.github.io',
  base: '/akademija-tc',
  trailingSlash: 'ignore',
  integrations: [preact()],
  build: {
    // CSS je majhen (~6 kB): vgrajen v HTML prihrani en krog po omrežju pred prvim izrisom.
    inlineStylesheets: 'always',
  },
});
