// Čiste funkcije brez DOM. Isti izračuni poganjajo lekcije, simulator, diagnostiko in kvize,
// zato se številke med njimi ne morejo razhajati.

/** Točka tabele nasičenja: temperatura v °C, absolutni tlak v bar. */
export interface PTPoint {
  tC: number;
  pBarAbs: number;
}

export interface Refrigerant {
  id: string;
  name: string;
  source: string;
  points: PTPoint[];
}

/** Atmosferski tlak, s katerim pretvarjamo nadtlak z manometra v absolutni tlak. */
export const ATM_BAR = 1.01325;

export const gaugeToAbs = (pGaugeBar: number) => pGaugeBar + ATM_BAR;

/**
 * Temperatura nasičenja pri danem absolutnem tlaku – linearna interpolacija po tabeli.
 * Zunaj tabele vrne null: raje nič kot izmišljena številka.
 */
export function saturationTemp(points: PTPoint[], pBarAbs: number): number | null {
  const sorted = [...points].sort((a, b) => a.pBarAbs - b.pBarAbs);
  if (sorted.length < 2) return null;
  if (pBarAbs < sorted[0].pBarAbs || pBarAbs > sorted[sorted.length - 1].pBarAbs) return null;
  for (let i = 1; i < sorted.length; i++) {
    const lo = sorted[i - 1];
    const hi = sorted[i];
    if (pBarAbs <= hi.pBarAbs) {
      const f = (pBarAbs - lo.pBarAbs) / (hi.pBarAbs - lo.pBarAbs);
      return lo.tC + f * (hi.tC - lo.tC);
    }
  }
  return null;
}

/** Pregrevanje SH [K] = temperatura sesalnega voda − temperatura uparjanja. */
export function superheat(points: PTPoint[], suctionGaugeBar: number, suctionLineC: number): number | null {
  const tEvap = saturationTemp(points, gaugeToAbs(suctionGaugeBar));
  return tEvap === null ? null : suctionLineC - tEvap;
}

/** Podhlajevanje SC [K] = temperatura kondenzacije − temperatura tekočinskega voda. */
export function subcooling(points: PTPoint[], liquidGaugeBar: number, liquidLineC: number): number | null {
  const tCond = saturationTemp(points, gaugeToAbs(liquidGaugeBar));
  return tCond === null ? null : tCond - liquidLineC;
}

/** Ali je izračun znotraj dovoljene napake (PRD: ±1 K pri izračunu SH/SC). */
export const withinTolerance = (answer: number, expected: number, tolK = 1) => Math.abs(answer - expected) <= tolK;

/** Razvrščanje v skupine (igra »simptom / meritev / vzrok«): koliko je pravilnih. */
export function scoreSort<G extends string>(answers: Record<string, G | undefined>, key: Record<string, G>) {
  const ids = Object.keys(key);
  const wrong = ids.filter((id) => answers[id] !== key[id]);
  return { correct: ids.length - wrong.length, total: ids.length, wrong, done: wrong.length === 0 };
}
export * from './sim';
