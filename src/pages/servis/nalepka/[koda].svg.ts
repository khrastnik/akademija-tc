import type { APIRoute } from 'astro';
import { loadServis } from '../../../lib/content.js';
import { nalepkaSvg } from '../../../lib/nalepka.js';

/** Nalepka za tisk za vsako kodo iz primera servisne mape: /servis/nalepka/K7F3Q.svg */
export function getStaticPaths() {
  return loadServis().stranke.map((s) => ({ params: { koda: s.koda } }));
}

export const GET: APIRoute = async ({ params }) =>
  new Response(await nalepkaSvg(String(params.koda)), { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } });
