import { describe, expect, it } from 'vitest';
import { loadTools } from '../src/lib/content.js';
import { TOOL_IDS } from '../src/components/tool-ids';

describe('merilna oprema', () => {
  it('vsaka naprava v oprema.yaml ima delujočo napravo in obratno', () => {
    expect(loadTools().map((t) => t.id).sort()).toEqual([...TOOL_IDS].sort());
  });
  it('naprave za krog hladiva so označene s spričevalom', () => {
    for (const t of loadTools()) if (t.cat === 'hladivo') expect([t.id, t.who.includes('spricevalo')]).toEqual([t.id, true]);
  });
  it('električne meritve so označene za usposobljeno osebo', () => {
    for (const t of loadTools()) if (t.cat === 'elektrika') expect([t.id, t.who.includes('elektro')]).toEqual([t.id, true]);
  });
});
