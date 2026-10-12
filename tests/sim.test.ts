import { describe, expect, it } from 'vitest';
import { readingsFor, scoreCase, FAULTS, FAULT_IDS, MEASUREMENTS, MEASUREMENT_READINGS } from '../packages/engine/src/sim';

const zone = (f: any, id: string) => readingsFor(f, 's')[id].zone;

describe('učni model – normalno stanje', () => {
  it('vse številčne meritve so v normalnem območju', () => {
    for (const r of Object.values(readingsFor(undefined, 's'))) if (r.value !== undefined) expect([r.id, r.zone]).toEqual([r.id, 'ok']);
  });
  it('vsaka meritev ima odčitke', () => {
    for (const m of MEASUREMENTS) expect(MEASUREMENT_READINGS[m.id]?.length).toBeGreaterThan(0);
  });
});

describe('vzorci napak (to, kar igra uči)', () => {
  it('premalo hladiva: nizka T uparjanja, visoko SH, nizko SC', () => {
    expect([zone('premalo-hladiva', 't0'), zone('premalo-hladiva', 'sh'), zone('premalo-hladiva', 'sc')]).toEqual(['low', 'high', 'low']);
  });
  it('zatikajoč ekspanzijski ventil: visoko SH, a VISOKO SC – tako ga ločiš od premalo hladiva', () => {
    expect([zone('eev', 'sh'), zone('eev', 'sc')]).toEqual(['high', 'high']);
  });
  it('preveč hladiva: visoka T kondenzacije in visoko SC, SH normalno', () => {
    expect([zone('prevec-hladiva', 'tc'), zone('prevec-hladiva', 'sc'), zone('prevec-hladiva', 'sh')]).toEqual(['high', 'high', 'ok']);
  });
  it('zamašen filter: velika ΔT vode in visoka T kondenzacije, hladivo v redu', () => {
    expect([zone('filter', 'dt-voda'), zone('filter', 'tc'), zone('filter', 'sc')]).toEqual(['high', 'high', 'ok']);
  });
  it('ovira zraka na uparjalniku: nizka T uparjanja, SH ni visoko', () => {
    expect(zone('ovira-zraka', 't0')).toBe('low');
    expect(zone('ovira-zraka', 'sh')).not.toBe('high');
  });
  it('zrak v vodi: nizek tlak vode', () => {
    expect(zone('zrak-v-vodi', 'tlak-vode')).toBe('low');
  });
  it('napačna nastavitev: hladivo normalno, voda prehladna', () => {
    expect([zone('nastavitev', 't-dvizni'), zone('nastavitev', 'sh'), zone('nastavitev', 'sc')]).toEqual(['low', 'ok', 'ok']);
  });
  it('vsaka napaka ima dokaz, ki obstaja kot meritev', () => {
    for (const id of FAULT_IDS) for (const e of FAULTS[id].evidence) expect(MEASUREMENTS.some((m) => m.id === e)).toBe(true);
  });
});

describe('točkovanje', () => {
  it('dokazana diagnoza, najlažje najprej, brez manometrov = 3 zvezdice', () => {
    const s = scoreCase({ fault: 'filter', measured: ['zaslon', 'tlak-vode', 'dt-voda', 'filter'], guesses: ['filter'], par: 15 });
    expect(s.solved).toBe(true);
    expect(s.stars).toBe(3);
  });
  it('pravilno ugibanje brez dokaza je kaznovano', () => {
    const proved = scoreCase({ fault: 'filter', measured: ['zaslon', 'dt-voda', 'filter'], guesses: ['filter'], par: 15 });
    const guessed = scoreCase({ fault: 'filter', measured: ['zaslon'], guesses: ['filter'], par: 15 });
    expect(guessed.points).toBeLessThan(proved.points);
  });
  it('nepotreben priklop manometrov stane bonus', () => {
    const a = scoreCase({ fault: 'nastavitev', measured: ['zaslon'], guesses: ['nastavitev'], par: 5 });
    const b = scoreCase({ fault: 'nastavitev', measured: ['zaslon', 'nt-stran'], guesses: ['nastavitev'], par: 5 });
    expect(b.points).toBeLessThan(a.points);
  });
  it('napačna končna diagnoza = 0 zvezdic', () => {
    expect(scoreCase({ fault: 'eev', measured: ['nt-stran'], guesses: ['premalo-hladiva'], par: 20 }).stars).toBe(0);
  });
});

describe('vsebina simulatorja', async () => {
  const { loadSim } = await import('../src/lib/content.js');
  const sim = loadSim();
  it('diagnoze v faults.yaml = napake v modelu', () => {
    expect(sim.faults.map((f: any) => f.id).sort()).toEqual([...FAULT_IDS].sort());
  });
  it('par vsakega klica je dosegljiv z dokaznimi meritvami', () => {
    for (const d of sim.days)
      for (const c of d.calls) {
        const need = FAULTS[c.fault as keyof typeof FAULTS].evidence.reduce((s, e) => s + (MEASUREMENTS.find((m) => m.id === e)?.minutes ?? 0), 0);
        expect([c.fault, need <= c.par]).toEqual([c.fault, true]);
      }
  });
});

describe('novi deli: 3-potni ventil, 4-potni ventil, filter sušilnik', () => {
  it('obtičan 3-potni ventil: radiatorji hladni, bojler prevroč', () => {
    expect([zone('tripotni', 't-dvizni'), zone('tripotni', 't-bojler')]).toEqual(['low', 'high']);
  });
  it('odtajevanje ne deluje: zelo nizka T uparjanja, a SH ni visoko in listja ni', () => {
    expect(zone('odtajevanje', 't0')).toBe('low');
    expect(zone('odtajevanje', 'sh')).toBe('ok');
    expect(readingsFor('odtajevanje', 's').zunanja.text).not.toMatch(/listjem/);
  });
  it('filter sušilnik vs EEV: oba visok SH in SC – loči ju ΔT na filtru sušilniku', () => {
    expect([zone('filter-susilnik', 'sh'), zone('filter-susilnik', 'sc'), zone('filter-susilnik', 'dt-susilnik')]).toEqual(['high', 'high', 'high']);
    expect(zone('eev', 'dt-susilnik')).toBe('ok');
  });
  it('odtajevanje se dokaže brez manometrov (bonus)', () => {
    const s = scoreCase({ fault: 'odtajevanje', measured: ['zaslon', 'zunanja'], guesses: ['odtajevanje'], par: 9 });
    expect(s.stars).toBe(3);
  });
});
