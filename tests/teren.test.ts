import { describe, expect, it } from 'vitest';
import { makeEnv, reading, scoreJob, scoreDiagnosis, shuffledDeck, seasonDeck, seasonForDay, supportEliminate, practiceGroup, pickPractice, FAULT_IDS, TOOLS, COMBOS, SEASONS, SEASON_ORDER, type FaultId, type Level } from '../packages/engine/src/teren';
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

// potrditvena meritev za vsako okvaro – mora ostati vidna tudi v kombinaciji z drugo okvaro
const PROOF: Record<FaultId, (e: ReturnType<typeof makeEnv>) => boolean> = {
  'premalo-hladiva': (e) => zone('detektor', e) === 'high',
  lovilec: (e) => zone('lovilec', e) === 'high',
  ventilator: (e) => zone('ventilator', e) === 'high',
  'eev-zaprt': (e) => zone('eev', e) === 'high',
  'eev-odprt': (e) => zone('eev', e) === 'high',
  'prevec-hladiva': (e) => zone('sc', e) === 'high',
  'zrak-v-vodi': (e) => zone('tlak-vode', e) === 'low',
  crpalka: (e) => zone('crpalka-pregled', e) === 'high',
  'senzor-zunanji': (e) => zone('ntc', e) === 'high',
  odtajevanje: (e) => zone('tuljava4', e) === 'high',
  krivulja: (e) => e.tFlowSet < 30 && zone('radiatorji', e) === 'low',
  tripotni: (e) => zone('tripotni', e) === 'high',
  'filter-susilnik': (e) => zone('susilnik', e) === 'high',
  raztezna: (e) => zone('raztezna', e) === 'low',
  dogrevalnik: (e) => zone('poraba', e) === 'high',
  'vt-senzor': (e) => zone('vt-senzor', e) === 'high',
};

describe('teren – kombinirane okvare', () => {
  it('v vsaki kombinaciji sta obe okvari dokazljivi', () => {
    for (const [a, b] of COMBOS)
      for (const l of LEVELS)
        for (let s = 1; s <= 30; s++) {
          const e = makeEnv([a, b], s * 104729, l);
          expect([a, b, l, PROOF[a](e), PROOF[b](e)]).toEqual([a, b, l, true, true]);
        }
  });
  it('vsaka okvara ima potrditveno meritev, ki deluje tudi sama', () => {
    for (const f of FAULT_IDS) each(f, (e) => expect([f, PROOF[f](e)]).toEqual([f, true]));
  });
  it('diagnoza z dvema okvarama: vse, delno, nič', () => {
    const both = scoreDiagnosis(['lovilec', 'krivulja'], ['krivulja', 'lovilec'], 25, 5, 3);
    expect(both.level).toBe('ok');
    expect(both.pay).toBe(Math.round(Math.round((140 - 6) * 0.9) * 1.25));
    const half = scoreDiagnosis(['lovilec', 'krivulja'], ['lovilec'], 25, 5, 3);
    expect([half.level, half.repDelta, half.pay]).toEqual(['partial', 0, Math.round(Math.round((140 - 6) * 0.9) * 0.5)]);
    expect(scoreDiagnosis(['lovilec'], ['lovilec', 'krivulja'], 25, 5, 3).level).toBe('partial');
    expect(scoreDiagnosis(['lovilec', 'krivulja'], ['crpalka'], 25, 5, 3)).toMatchObject({ level: 'wrong', pay: -30, repDelta: -1 });
  });
  it('podpora nikoli ne izloči nobene od dejanskih okvar', () => {
    for (const [a, b] of COMBOS) expect(supportEliminate([a, b], 7).some((x) => x === a || x === b)).toBe(false);
  });
});

describe('teren – letni časi', () => {
  it('zunanja T je v območju letnega časa', () => {
    for (const s of SEASON_ORDER)
      for (let i = 1; i <= 50; i++) {
        const e = makeEnv('krivulja', i * 31, 'serviser', SEASONS[s].tOut);
        expect(e.tOut).toBeGreaterThanOrEqual(SEASONS[s].tOut[0]);
        expect(e.tOut).toBeLessThanOrEqual(SEASONS[s].tOut[1]);
      }
  });
  it('kupček letnega časa ima tipične okvare dvakrat', () => {
    for (const s of SEASON_ORDER) {
      const d = seasonDeck(s, 3);
      for (const f of SEASONS[s].typical) expect(d.filter((x) => x === f).length).toBe(2);
      expect(d.length).toBe(FAULT_IDS.length + SEASONS[s].typical.length);
    }
  });
  it('kampanja: jesen, zima, pomlad po 2 dni, nato znova', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(seasonForDay)).toEqual(['jesen', 'jesen', 'zima', 'zima', 'pomlad', 'pomlad', 'jesen']);
  });
  it('pri mrazu ostane izhodišče zdravo (T uparjanja = T zunaj − 6…8 K)', () => {
    for (let i = 1; i <= 30; i++) expect(zone('nt', makeEnv('krivulja', i * 17, 'vajenec', SEASONS.zima.tOut))).toBe('ok');
  });
});

describe('teren – učni del', () => {
  it('vsaka okvara ima pot do diagnoze, zamenjavo in potrditvene meritve, ki obstajajo', async () => {
    const { loadTerenUcenje } = await import('../src/lib/content.js');
    const u = loadTerenUcenje();
    expect(Object.keys(u.faults).sort()).toEqual([...FAULT_IDS].sort());
    for (const [f, x] of Object.entries(u.faults)) {
      expect([f, FAULT_IDS.includes(x.confuse.with as FaultId), x.confuse.with !== f]).toEqual([f, true, true]);
      for (const p of x.proof) expect([f, p, TOOLS.some((t) => t.id === p)]).toEqual([f, p, true]);
    }
    for (const t of Object.keys(u.meanings)) expect([t, TOOLS.some((x) => x.id === t)]).toEqual([t, true]);
  });
  it('povezave rezultata kažejo na obstoječe lekcije in dele na strani okvar', async () => {
    const { loadTerenUcenje, loadLessons, loadRepairs } = await import('../src/lib/content.js');
    const lessons = new Set(loadLessons().map((l) => l.id));
    const parts = new Set(loadRepairs().map((r) => r.part));
    for (const [f, x] of Object.entries(loadTerenUcenje().faults)) {
      for (const l of x.lessons) expect([f, l, lessons.has(l)]).toEqual([f, l, true]);
      for (const p of x.parts) expect([f, p, parts.has(p)]).toEqual([f, p, true]);
    }
    // dodatni lekciji v rezultatu: dve okvari hkrati, napačna diagnoza
    expect(lessons.has('m17-l01') && lessons.has('m16-l01')).toBe(true);
  });
  it('vaja s strani okvar: skupina zamenljivih ima vsaj 2 okvari, izbrana je prva, žreb ne ponovi zadnje', async () => {
    const { loadTerenUcenje } = await import('../src/lib/content.js');
    const confuse = Object.fromEntries(Object.entries(loadTerenUcenje().faults).map(([k, v]) => [k, v.confuse.with as FaultId]));
    for (const f of FAULT_IDS) {
      const g = practiceGroup(f, confuse);
      expect([f, g[0], g.length >= 2, new Set(g).size === g.length]).toEqual([f, f, true, true]);
      const seen = new Set<FaultId>();
      let last: FaultId | null = null;
      for (let s = 1; s <= 60; s++) {
        const p = pickPractice(g, last, s);
        expect([f, p !== last, g.includes(p)]).toEqual([f, true, true]);
        seen.add(p);
        last = p;
      }
      expect([f, seen.size]).toEqual([f, g.length]);
    }
    expect(practiceGroup('eev-zaprt', confuse).sort()).toEqual(['eev-zaprt', 'filter-susilnik', 'premalo-hladiva'].sort());
  });
  it('potrditvene meritve res pokažejo okvaro (vsaj ena odstopa)', async () => {
    const { loadTerenUcenje } = await import('../src/lib/content.js');
    const u = loadTerenUcenje();
    for (const f of FAULT_IDS)
      each(f, (e) => {
        const z = u.faults[f].proof.map((p) => zone(p, e));
        expect([f, z.some((x) => x === 'high' || x === 'low')]).toEqual([f, true]);
      });
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
