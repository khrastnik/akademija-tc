// Pregrevanje (SH) in podhlajevanje (SC) iz meritev z manometri.
// Temperatura nasičenja se dobi iz P-T tabele (data/refrigerants.json) ali jo serviser odčita s skale manometra.

export interface PTPoint {
  tC: number;
  /** Absolutni tlak vrelišča (tekočina, Q=0) v bar. */
  pBarAbs: number;
  /** Absolutni tlak rosišča (para, Q=1) v bar – samo pri mešanicah s temperaturnim drsenjem. */
  pDewBarAbs?: number;
}

/** Standardni atmosferski tlak v bar – manometer kaže nadtlak glede nanj. */
export const ATM_BAR = 1.01325;

export const gaugeToAbs = (pGaugeBar: number, atmBar = ATM_BAR) => pGaugeBar + atmBar;

/**
 * Temperatura nasičenja pri danem absolutnem tlaku.
 * Za pregrevanje se uporabi rosišče (para), za podhlajevanje vrelišče (tekočina).
 * Interpolacija poteka v ln(p), ker je odvisnost tlaka od temperature skoraj eksponentna.
 * Vrne null, če je tlak zunaj tabele – ekstrapolacije ni.
 */
export function satTemp(points: PTPoint[], pBarAbs: number, phase: 'bubble' | 'dew'): number | null {
  if (!(pBarAbs > 0) || points.length < 2) return null;
  const p = (pt: PTPoint) => (phase === 'dew' ? (pt.pDewBarAbs ?? pt.pBarAbs) : pt.pBarAbs);
  const lp = Math.log(pBarAbs);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const la = Math.log(p(a));
    const lb = Math.log(p(b));
    if (lp >= la && lp <= lb) return a.tC + ((lp - la) / (lb - la)) * (b.tC - a.tC);
  }
  return null;
}

/** Absolutni tlak nasičenja pri temperaturi (obratno od satTemp). Vrne null zunaj tabele. */
export function satPressure(points: PTPoint[], tC: number, phase: 'bubble' | 'dew'): number | null {
  const p = (pt: PTPoint) => (phase === 'dew' ? (pt.pDewBarAbs ?? pt.pBarAbs) : pt.pBarAbs);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (tC >= a.tC && tC <= b.tC) {
      const k = (tC - a.tC) / (b.tC - a.tC);
      return Math.exp(Math.log(p(a)) + k * (Math.log(p(b)) - Math.log(p(a))));
    }
  }
  return null;
}

/** Pregrevanje = T sesalnega voda − T uparjanja (rosišče). */
export const superheat = (tSuctionC: number, tSatC: number) => tSuctionC - tSatC;
/** Podhlajevanje = T kondenzacije (vrelišče) − T tekočinskega voda. */
export const subcooling = (tSatC: number, tLiquidC: number) => tSatC - tLiquidC;

export type Verdict = 'negative' | 'zero' | 'ok';
/**
 * Fizikalno preverjanje rezultata (ne normalno območje – to določi proizvajalec).
 * Negativna vrednost pomeni napako meritve ali napačno hladivo; blizu 0 K pri SH pomeni nevarnost kapljevine v kompresorju.
 */
export function check(value: number): Verdict {
  if (value < -0.5) return 'negative';
  if (value < 1) return 'zero';
  return 'ok';
}
