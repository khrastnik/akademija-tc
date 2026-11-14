import { describe, expect, it } from 'vitest';
import { satTemp, superheat, subcooling, gaugeToAbs, check, type PTPoint } from '../packages/engine/src/ptcalc';
import { loadRefrigerants } from '../src/lib/content.js';

// Umetna tabela s točno eksponentno odvisnostjo: p = 2^(t/10) bar → interpolacija v ln(p) mora biti točna.
const T: PTPoint[] = [-20, -10, 0, 10, 20, 30].map((t) => ({ tC: t, pBarAbs: 2 ** (t / 10) }));

describe('P-T kalkulator', () => {
  it('na točki tabele vrne točno temperaturo', () => {
    expect(satTemp(T, 1, 'bubble')).toBeCloseTo(0, 6);
    expect(satTemp(T, 4, 'bubble')).toBeCloseTo(20, 6);
  });
  it('med točkami interpolira v logaritmu tlaka', () => {
    expect(satTemp(T, 2 ** 0.55, 'bubble')).toBeCloseTo(5.5, 6);
  });
  it('zunaj tabele ne ugiba', () => {
    expect(satTemp(T, 100, 'bubble')).toBeNull();
    expect(satTemp(T, 0.01, 'bubble')).toBeNull();
    expect(satTemp(T, -1, 'bubble')).toBeNull();
  });
  it('rosišče uporabi tlak pare, če obstaja', () => {
    const glide: PTPoint[] = [
      { tC: 0, pBarAbs: 5, pDewBarAbs: 4 },
      { tC: 10, pBarAbs: 7, pDewBarAbs: 6 },
    ];
    expect(satTemp(glide, 4, 'dew')).toBeCloseTo(0, 6);
    expect(satTemp(glide, 5, 'bubble')).toBeCloseTo(0, 6);
  });
  it('nadtlak manometra se pretvori v absolutni tlak', () => {
    expect(gaugeToAbs(9)).toBeCloseTo(10.01325, 5);
  });
  it('SH in SC po definiciji', () => {
    expect(superheat(2, -4)).toBe(6);
    expect(subcooling(38, 34)).toBe(4);
  });
  it('negativen rezultat je napaka meritve, blizu nič je opozorilo', () => {
    expect(check(-2)).toBe('negative');
    expect(check(0.3)).toBe('zero');
    expect(check(5)).toBe('ok');
  });
  it('prave tabele: nadtlak pri 0 °C da 0 °C, primer SH za R32', () => {
    const tab = (id: string) => loadRefrigerants().find((r) => r.id === id)!.points;
    // referenčni nadtlaki pri 0 °C (NIST, zaokroženo): R32 ≈ 7,12 bar, R410A ≈ 6,99 bar, R290 ≈ 3,73 bar
    expect(satTemp(tab('R32'), gaugeToAbs(7.12), 'bubble')!).toBeCloseTo(0, 0);
    expect(satTemp(tab('R410A'), gaugeToAbs(6.99), 'bubble')!).toBeCloseTo(0, 0);
    expect(satTemp(tab('R290'), gaugeToAbs(3.73), 'bubble')!).toBeCloseTo(0, 0);
    // R410A: rosišče je pri istem tlaku malo toplejše od vrelišča (majhno drsenje)
    const p = gaugeToAbs(7);
    expect(satTemp(tab('R410A'), p, 'dew')!).toBeGreaterThan(satTemp(tab('R410A'), p, 'bubble')!);
    // R32, NT 7,12 bar, sesalni vod +6 °C → SH ≈ 6 K
    expect(superheat(6, satTemp(tab('R32'), gaugeToAbs(7.12), 'dew')!)).toBeCloseTo(6, 0);
  });
  it('R407C: rosišče je pri istem tlaku nekaj K toplejše od vrelišča', () => {
    const t = loadRefrigerants().find((r) => r.id === 'R407C')!.points;
    const p = gaugeToAbs(4);
    const glide = satTemp(t, p, 'dew')! - satTemp(t, p, 'bubble')!;
    expect(glide).toBeGreaterThan(3);
    expect(glide).toBeLessThan(9);
  });
  it('R744: 0 °C pri okoli 33,8 bar nadtlaka, kritična točka okoli 31 °C in 73,8 bar', () => {
    const r = loadRefrigerants().find((x) => x.id === 'R744')!;
    expect(satTemp(r.points, gaugeToAbs(33.84), 'bubble')!).toBeCloseTo(0, 0);
    expect(r.tCritC!).toBeCloseTo(31, 0);
    expect(r.pCritBarAbs!).toBeCloseTo(73.8, 0);
    // tabela se konča pod kritično točko – nad njo ni kondenzacije
    expect(r.points.at(-1)!.tC).toBeLessThan(r.tCritC!);
  });
  it('R454B: ujemanje s Honeywellovo tabelo pri 40 psig (vrelišče −20,3 °C, rosišče −19,2 °C)', () => {
    const t = loadRefrigerants().find((r) => r.id === 'R454B')!.points;
    const p = 3.771; // 40 psig = 377,1 kPa abs
    expect(Math.abs(satTemp(t, p, 'bubble')! - -20.3)).toBeLessThan(0.3);
    expect(Math.abs(satTemp(t, p, 'dew')! - -19.2)).toBeLessThan(0.3);
  });
  it('R452B: pri 0 °C nekoliko nižji tlak kot R410A, z majhnim drsenjem', () => {
    const all = loadRefrigerants();
    const at0 = (id: string) => all.find((r) => r.id === id)!.points.find((p) => p.tC === 0)!;
    expect(at0('R452B').pBarAbs).toBeLessThan(at0('R410A').pBarAbs);
    expect(at0('R452B').pBarAbs - at0('R452B').pDewBarAbs!).toBeGreaterThan(0);
  });
  it('objavljene tabele hladiv so naraščajoče in imajo vir', () => {
    for (const r of loadRefrigerants()) {
      expect(r.source.length).toBeGreaterThan(10);
      for (let i = 1; i < r.points.length; i++) {
        expect(r.points[i].tC).toBeGreaterThan(r.points[i - 1].tC);
        expect(r.points[i].pBarAbs).toBeGreaterThan(r.points[i - 1].pBarAbs);
      }
    }
  });
});
