import { describe, expect, it } from 'vitest';
import { makeEnv, reading, scoreJob, shuffledDeck, supportEliminate, FAULT_IDS, TOOLS, type FaultId, type Level } from '../packages/engine/src/teren';
import { loadRefrigerants } from '../src/lib/content.js';

const pts = loadRefrigerants().find((r) => r.id === 'R32')!.points;
const LEVELS: Level[] = ['vajenec', 'serviser', 'mojster'];
/** Za vsako okvaro, stopnjo in 40 semen preveri, da meritev pokaže pričakovano. */
function each(f: FaultId, fn: (e: ReturnType<typeof makeEnv>) => void) {
  for (const l of LEVELS) for (let s = 1; s <= 40; s++) fn(makeEnv(f, s * 7919, l));
}
const zone = (t: string, e: ReturnType<typeof makeEnv>) => reading(t, e, pts).zone;

describe('teren – zdravo izhodišče (PRD)', () => {
  it('brez okvare so ključne meritve v normalnem območju', () => {
    // »krivulja« pusti hladivo in vodo normalno – uporabimo jo za izhodišče
    each('krivulja', (e) => {
      expect([zone('sh', e), zone('sc', e), zone('dt-vode', e), zone('pretok', e), zone('tlak-vode', e), zone('nt', e)]).toEqual(['ok', 'ok', 'ok', 'ok', 'ok', 'ok']);
    });
  });
  it('tlak iz T nasičenja R32 (0 °C ≈ 7,1 bar g)', () => {
    const e = makeEnv('krivulja', 1);
    e.tEvap = 0;
    expect(reading('nt', e, pts).text).toContain('7,1 bar');
  });
});

describe('teren – podpisi okvar iz PRD', () => {
  it('premalo hladiva: SH visoko, SC ≈ 0, detektor najde puščanje', () =>
    each('premalo-hladiva', (e) => expect([zone('sh', e), zone('sc', e), zone('detektor', e)]).toEqual(['high', 'low', 'high'])));
  it('zamašen lovilec: pretok < 0,45, ΔT > 10 K, tlak vode normalen', () =>
    each('lovilec', (e) => {
      expect(e.flow).toBeLessThan(0.5);
      expect(e.dtWater).toBeGreaterThan(10);
      expect(zone('tlak-vode', e)).toBe('ok');
    }));
  it('ventilator: led, nizka T uparjanja, ventilator stoji', () => each('ventilator', (e) => expect([zone('zunanja', e), zone('nt', e), zone('ventilator', e)]).toEqual(['high', 'low', 'high'])));
  it('EEV zaprt: visoko SH IN visoko SC', () => each('eev-zaprt', (e) => expect([zone('sh', e), zone('sc', e), zone('eev', e)]).toEqual(['high', 'high', 'high'])));
  it('EEV odprt: SH ≈ 0, zaledenel sesalni vod', () => each('eev-odprt', (e) => expect([zone('sh', e), zone('zunanja', e)]).toEqual(['low', 'high'])));
  it('preveč hladiva: SC > 10 K, voda v redu', () => each('prevec-hladiva', (e) => expect([zone('sc', e), zone('dt-vode', e), zone('pretok', e)]).toEqual(['high', 'ok', 'ok'])));
  it('zrak v vodi: tlak < 0,6 bar, črpalka grgra', () => each('zrak-v-vodi', (e) => expect([zone('tlak-vode', e), zone('poslusaj', e)]).toEqual(['low', 'high'])));
  it('obtočna črpalka: pretok 0, kompresor stoji', () => each('crpalka', (e) => expect([e.flow, zone('tok', e), zone('crpalka-pregled', e)]).toEqual([0, 'low', 'high'])));
  it('senzor zunanje T: krmilnik bere −40 °C, NTC ∞', () => each('senzor-zunanji', (e) => expect([e.ctrlTOut, zone('ntc', e)]).toEqual([-40, 'high'])));
  it('odtajevanje: ves uparjalnik v ledu, tuljava ∞ Ω', () => each('odtajevanje', (e) => expect([zone('zunanja', e), zone('tuljava4', e), zone('ventilator', e)]).toEqual(['high', 'high', 'ok'])));
  it('krivulja: hladivo in voda normalno, sobna T nizka', () => each('krivulja', (e) => expect([zone('sh', e), zone('dt-vode', e), zone('radiatorji', e)]).toEqual(['ok', 'ok', 'low'])));
  it('3-potni: bojler prevroč, sobe hladne', () => each('tripotni', (e) => expect([zone('tripotni', e), zone('radiatorji', e)]).toEqual(['high', 'low'])));
  it('filter sušilnik: kot EEV zaprt, a ΔT na filtru velika in EEV v redu', () =>
    each('filter-susilnik', (e) => expect([zone('sh', e), zone('sc', e), zone('susilnik', e), zone('eev', e)]).toEqual(['high', 'high', 'high', 'ok'])));
  it('raztezna: visok tlak vode, predtlak ≈ 0', () => each('raztezna', (e) => expect([zone('tlak-vode', e), zone('raztezna', e)]).toEqual(['high', 'low'])));
  it('dogrevalnik: vse normalno, poraba visoka', () => each('dogrevalnik', (e) => expect([zone('sh', e), zone('dt-vode', e), zone('poraba', e)]).toEqual(['ok', 'ok', 'high'])));
  it('VT senzor: krmilnik in manometer se ne ujemata, hladivo normalno', () => each('vt-senzor', (e) => expect([zone('vt-senzor', e), zone('sc', e)]).toEqual(['high', 'ok'])));
  it('vsaka okvara ima vsaj eno meritev zunaj normale (rešljivo)', () => {
    for (const f of FAULT_IDS) {
      const e = makeEnv(f, 99);
      expect([f, TOOLS.some((t) => ['high', 'low'].includes(reading(t.id, e, pts).zone))]).toEqual([f, true]);
    }
  });
});

describe('teren – vsebina', () => {
  it('vsaka okvara v modelu ima besedila in obratno', async () => {
    const { loadTeren } = await import('../src/lib/content.js');
    expect(loadTeren().faults.map((f) => f.id).sort()).toEqual([...FAULT_IDS].sort());
  });
  it('splošne prijave veljajo za več okvar (prijava sama ne izda vzroka)', async () => {
    const { loadTeren } = await import('../src/lib/content.js');
    const g = loadTeren().generic;
    for (const f of g.faults) expect(FAULT_IDS).toContain(f);
    expect(g.faults.length).toBeGreaterThanOrEqual(8);
  });
});

describe('teren – točkovanje in dan (PRD)', () => {
  it('formula plačila', () => {
    expect(scoreJob(true, 20, 4, 3).pay).toBe(Math.round(140 * 0.9));
    expect(scoreJob(true, 50, 4, 5).pay).toBe(Math.round((140 - 36) * 1.1));
    expect(scoreJob(true, 200, 4, 0).pay).toBe(40); // najmanj 40 €
    expect(scoreJob(true, 20, 1, 3).pay).toBe(Math.round(140 * 0.9 * 0.7)); // ugibanje
  });
  it('ugled: pravilno v ≤ 35 min +1, napaka −1 in −30 €', () => {
    expect(scoreJob(true, 35, 3, 3).repDelta).toBe(1);
    expect(scoreJob(true, 36, 3, 3).repDelta).toBe(0);
    expect(scoreJob(false, 10, 3, 3)).toMatchObject({ pay: -30, repDelta: -1 });
  });
  it('kupček vsebuje vsako okvaro enkrat', () => expect([...shuffledDeck(5)].sort()).toEqual([...FAULT_IDS].sort()));
  it('podpora izključi 5 napačnih, nikoli pravilne', () => {
    for (const f of FAULT_IDS) {
      const ex = supportEliminate(f, 42);
      expect(ex.length).toBe(5);
      expect(ex).not.toContain(f);
    }
  });
  it('isti seme da isti nalog', () => expect(makeEnv('lovilec', 7)).toEqual(makeEnv('lovilec', 7)));
  it('orodja s predpogojem kažejo na obstoječe orodje', () => {
    for (const t of TOOLS) if (t.needs) expect(TOOLS.some((x) => x.id === t.needs)).toBe(true);
  });
});
