import { describe, expect, it } from 'vitest';
import { saturationTemp, superheat, subcooling, withinTolerance, scoreSort, ATM_BAR } from '../packages/engine/src/index';

// Izmišljena, linearna testna tabela – NI podatek o resničnem hladivu.
const table = [
  { tC: 0, pBarAbs: 5 },
  { tC: 10, pBarAbs: 7 },
  { tC: 40, pBarAbs: 13 },
];

describe('saturationTemp', () => {
  it('vrne točno vrednost na točki tabele', () => {
    expect(saturationTemp(table, 7)).toBe(10);
  });
  it('linearno interpolira med točkama', () => {
    expect(saturationTemp(table, 6)).toBeCloseTo(5);
    expect(saturationTemp(table, 10)).toBeCloseTo(25);
  });
  it('zunaj tabele vrne null namesto ugibanja', () => {
    expect(saturationTemp(table, 4.9)).toBeNull();
    expect(saturationTemp(table, 20)).toBeNull();
    expect(saturationTemp([], 6)).toBeNull();
  });
});

describe('SH in SC', () => {
  it('pregrevanje = sesalni vod − temperatura uparjanja (manometer kaže nadtlak)', () => {
    expect(superheat(table, 6 - ATM_BAR, 12)).toBeCloseTo(7);
  });
  it('podhlajevanje = temperatura kondenzacije − tekočinski vod', () => {
    expect(subcooling(table, 10 - ATM_BAR, 20)).toBeCloseTo(5);
  });
  it('dovoljena napaka ±1 K', () => {
    expect(withinTolerance(7.9, 7)).toBe(true);
    expect(withinTolerance(8.2, 7)).toBe(false);
  });
});

describe('scoreSort', () => {
  it('šteje pravilne in vrne napačne', () => {
    const r = scoreSort({ a: 'simptom', b: 'vzrok' }, { a: 'simptom', b: 'meritev', c: 'vzrok' });
    expect(r).toEqual({ correct: 1, total: 3, wrong: ['b', 'c'], done: false });
  });
});
