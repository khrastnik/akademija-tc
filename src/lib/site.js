export const SITE = {
  name: 'Akademija toplotnih črpalk',
  short: 'Akademija TČ',
  repo: 'https://github.com/khrastnik/akademija-tc',
  branch: 'main',
};

/**
 * Pot znotraj strani, z upoštevanjem `base` (GitHub Pages podmapa).
 * Strani dobijo končno poševnico: brez nje GitHub Pages vrne 301 (en krog po omrežju več),
 * service worker pa strani hrani pod »/pot/«, zato bi »/pot« brez povezave odpovedal.
 */
export function url(p = '') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  let path = p.replace(/^\//, '');
  const [pathname, rest = ''] = path.split(/(?=[#?])/);
  const isFile = /\.[a-z0-9]+$/i.test(pathname);
  const withSlash = pathname && !isFile && !pathname.endsWith('/') ? `${pathname}/` : pathname;
  return `${base}/${withSlash}${rest}`;
}

export const sourceUrl = (file) => `${SITE.repo}/blob/${SITE.branch}/${file}`;

export function issueUrl(where) {
  const q = new URLSearchParams({ title: `Napaka: ${where}`, body: `Kje: ${where}\n\nKaj je narobe:\n\nKaj bi moralo pisati:\n` });
  return `${SITE.repo}/issues/new?${q}`;
}
