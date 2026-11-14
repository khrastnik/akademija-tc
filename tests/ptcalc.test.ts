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
