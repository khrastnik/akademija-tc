import { describe, expect, it } from 'vitest';
import { validateContent, parseCards, wordCount, tables, loadLessons, loadFgasExam } from '../src/lib/content.js';

describe('vsebina v repozitoriju', () => {
  it('je skladna z vsemi pravili PRD', () => {
    expect(validateContent()).toEqual([]);
  });
  it('vsaka lekcija ima 12 kartic', () => {
    for (const l of loadLessons()) expect(l.cards).toHaveLength(12);
  });
  it('simulacija izpita F-plini ima obliko pisnega izpita iz kataloga A (51 vprašanj, 12/16/3/3/3/6/3/5)', () => {
    const { topics, questions } = loadFgasExam();
    const n = Object.fromEntries(topics.map((t) => [t.id, t.exam]));
    expect(n).toMatchObject({ termo: 12, okolje: 16, zagon: 0, tesnost: 3, ravnanje: 3, kompresor: 3, prenosniki: 6, ventili: 3, cevi: 0, gorljiva: 5 });
    expect(topics.reduce((s, t) => s + t.exam, 0)).toBe(51);
    // brez vprašanj z več pravilnimi odgovori bi kandidat ugibal, da je pravilen vedno samo eden
    expect(questions.filter((q) => q.options.filter((o) => o.correct).length > 1).length).toBeGreaterThanOrEqual(10);
  });
});

describe('pravila validatorja', () => {
  it('razreže lekcijo na kartice', () => {
    const cards = parseCards('::card{type=goal}\nA\n\n::card{type=widget id=x}\nB\n::quiz{ref=q}\n');
    expect(cards.map((c) => c.type)).toEqual(['goal', 'widget', 'quiz']);
    expect(cards[1].attrs.id).toBe('x');
    expect(cards[2].attrs.ref).toBe('q');
  });
  it('zavrne besedilo pred prvo kartico', () => {
    expect(() => parseCards('uvod\n::card{type=goal}\nA')).toThrow();
  });
  it('šteje besede brez oznak slovarja', () => {
    expect(wordCount('**[[vzrok|Vzrok]]** je to')).toBe(3);
  });
  it('izmeri tabelo', () => {
    expect(tables('| a | b |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |')).toEqual([{ rows: 2, cols: 2 }]);
  });
});
