export const SITE = {
  name: 'Akademija toplotnih črpalk',
  short: 'Akademija TČ',
  repo: 'https://github.com/khrastnik/akademija-tc',
  branch: 'main',
};

/** Pot znotraj strani, z upoštevanjem `base` (GitHub Pages podmapa). */
export function url(p = '') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${p.replace(/^\//, '')}`;
}

export const sourceUrl = (file) => `${SITE.repo}/blob/${SITE.branch}/${file}`;

export function issueUrl(where) {
  const q = new URLSearchParams({ title: `Napaka: ${where}`, body: `Kje: ${where}\n\nKaj je narobe:\n\nKaj bi moralo pisati:\n` });
  return `${SITE.repo}/issues/new?${q}`;
}
