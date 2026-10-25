// Markdown kartice -> HTML. Pojmi [[id]] / [[id|besedilo]] postanejo gumb z oknom razlage
// (native popover: odpre se z dotikom, klikom ali tipkovnico, Esc ga zapre).
import { marked } from 'marked';
import { url } from './site.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let counter = 0;

export function termPopover(term, label) {
  const pid = `pojem-${term.id}-${++counter}`;
  return (
    `<button type="button" class="term" popovertarget="${pid}">${esc(label)}</button>` +
    `<span popover id="${pid}" class="term-pop" role="dialog" aria-label="${esc(term.sl)}">` +
    `<strong>${esc(term.sl)}</strong> <span class="en">· ${esc(term.en)}${term.abbr ? `, ${esc(term.abbr)}` : ''}</span>` +
    `<span style="display:block;margin:8px 0">${esc(term.kratkaRazlaga)}</span>` +
    `<a href="${url('slovar')}#${term.id}">Več v slovarju →</a>` +
    `</span>`
  );
}

/** @param {string} md @param {Map<string, any>} terms */
export function renderCard(md, terms) {
  const withTerms = md.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, id, label) => {
    const term = terms.get(id.trim());
    return term ? termPopover(term, label ?? term.sl) : esc(label ?? id);
  });
  // Številka in enota ostaneta skupaj v isti vrstici (34 °C, 5 K, 8 bar).
  const units = withTerms.replace(/(\d) (°C|K|bar|V)(?=[\s.,;:)–-]|$)/g, '$1 $2');
  return marked.parse(units, { async: false });
}
