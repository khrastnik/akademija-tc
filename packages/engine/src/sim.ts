// Učni model toplotne črpalke zrak–voda v načinu ogrevanja.
// POENOSTAVLJEN MODEL: vrednosti ponazarjajo smer odstopanj (višje / nižje / normalno),
// niso podatki proizvajalca in niso za uporabo na terenu. Pravilno je, da to stran tudi pove.

export type Zone = 'low' | 'ok' | 'high' | 'info';
export type MeasureKind = 'easy' | 'visual' | 'water' | 'refrigerant';

export type FaultId =
  | 'nastavitev'
  | 'ovira-zraka'
  | 'filter'
  | 'premalo-hladiva'
  | 'prevec-hladiva'
  | 'zrak-v-vodi'
  | 'eev'
  | 'senzor'
  | 'tripotni'
  | 'odtajevanje'
  | 'filter-susilnik';

export interface Measurement {
  id: string;
  label: string;
  /** Kje v napravi se meri (id dela v 3D modelu). */
  at: string;
  minutes: number;
  kind: MeasureKind;
  /** Kratko, kaj meritev pove. */
  tells: string;
}

export interface Reading {
  id: string;
  label: string;
  value?: number;
  unit?: string;
  text?: string;
  zone: Zone;
  /** Normalno območje v učnem modelu, za prikaz na skali. */
  range?: [number, number];
}

/** Meritve v vrstnem redu »najlažje najprej«. */
export const MEASUREMENTS: Measurement[] = [
  { id: 'zaslon', label: 'Zaslon krmilnika', at: 'krmilnik', minutes: 2, kind: 'easy', tells: 'Koda napake, nastavitve, želena temperatura.' },
  { id: 'tlak-vode', label: 'Tlak vode (manometer)', at: 'raztezna', minutes: 1, kind: 'easy', tells: 'Ali je v vodnem krogu dovolj vode.' },
  { id: 'zunanja', label: 'Pregled zunanje enote', at: 'uparjalnik', minutes: 3, kind: 'visual', tells: 'Listje, led, umazanija, madeži olja.' },
  { id: 'poslusaj', label: 'Poslušaj napravo', at: 'obtocna', minutes: 2, kind: 'visual', tells: 'Šumenje, klokotanje, ropot, preklop ventilov.' },
  { id: 'ventil-3p', label: 'Položaj 3-potnega ventila', at: 'tripotni', minutes: 1, kind: 'visual', tells: 'Ali voda gre v radiatorje ali v bojler.' },
  { id: 'bojler', label: 'T sanitarne vode v bojlerju', at: 'bojler', minutes: 2, kind: 'water', tells: 'Kako topla je voda za tuš.' },
  { id: 't-dvizni', label: 'T dvižnega voda', at: 'dvizni', minutes: 3, kind: 'water', tells: 'Kako topla voda gre v radiatorje.' },
  { id: 'dt-voda', label: 'ΔT dvižni–povratni', at: 'povratni', minutes: 4, kind: 'water', tells: 'Koliko toplote voda odnese. Velika ΔT = premalo pretoka.' },
  { id: 'filter', label: 'Odpri filter vode', at: 'filter', minutes: 8, kind: 'water', tells: 'Ali je lovilec nečistoč zamašen.' },
  { id: 'nt-stran', label: 'NT manometer + sesalni vod', at: 'sesalni', minutes: 10, kind: 'refrigerant', tells: 'Temperatura uparjanja in pregrevanje (SH).' },
  { id: 'vt-stran', label: 'VT manometer + tekočinski vod', at: 'tekocinski', minutes: 10, kind: 'refrigerant', tells: 'Temperatura kondenzacije in podhlajevanje (SC).' },
  { id: 't-tlacni', label: 'T tlačnega voda', at: 'tlacni', minutes: 3, kind: 'refrigerant', tells: 'Kako vroč je plin za kompresorjem.' },
  { id: 'dt-susilnik', label: 'ΔT na filtru sušilniku', at: 'susilnik', minutes: 4, kind: 'refrigerant', tells: 'Razlika temperatur pred in za filtrom. Velika = zamašen. Brez manometrov.' },
  { id: 'tok', label: 'Tok kompresorja (klešče)', at: 'kompresor', minutes: 4, kind: 'refrigerant', tells: 'Koliko dela kompresor.' },
];

export const measurementById = (id: string) => MEASUREMENTS.find((m) => m.id === id);

// Normalno stanje učnega modela: ogrevanje, zunaj okoli +2 °C, radiatorji 35/30 °C.
const RANGES = {
  'tlak-vode': [1.0, 2.0],
  't-dvizni': [33, 40],
  'dt-voda': [4, 7],
  t0: [-9, -3],
  sh: [3, 9],
  tc: [35, 42],
  sc: [2, 6],
  't-tlacni': [55, 75],
  tok: [4, 6],
  't-bojler': [45, 55],
  'dt-susilnik': [0, 2],
} as const satisfies Record<string, [number, number]>;

type Numbers = { tlakVode: number; tDvizni: number; dt: number; t0: number; sh: number; tc: number; sc: number; tTlacni: number; tok: number; tBojler: number; dtSusilnik: number };
type Texts = { zaslon: string; zunanja: string; poslusaj: string; filter: string; ventil3p: string };

const BASE_N: Numbers = { tlakVode: 1.5, tDvizni: 35, dt: 5, t0: -6, sh: 5, tc: 38, sc: 4, tTlacni: 65, tok: 5, tBojler: 50, dtSusilnik: 0.5 };
const BASE_T: Texts = {
  zaslon: 'Brez kode napake. Želena T dvižnega voda 35 °C. Način: ogrevanje.',
  zunanja: 'Lamele čiste, ventilator se vrti, odtok kondenzata prost.',
  poslusaj: 'Enakomerno brnenje kompresorja, brez šumenja v ceveh.',
  filter: 'Mrežica je čista.',
  ventil3p: 'Kazalec na ventilu: OGREVANJE. Motor se ob preklopu na sanitarno vodo premakne in vrne.',
};

/** Kako vsaka napaka spremeni stanje učnega modela. */
export const FAULTS: Record<FaultId, { n?: Partial<Numbers>; t?: Partial<Texts>; side: 'nastavitve' | 'zrak' | 'voda' | 'hladivo' | 'elektronika' | 'krmiljenje'; evidence: string[] }> = {
  nastavitev: {
    side: 'nastavitve',
    n: { tDvizni: 27, dt: 4, tc: 31, tTlacni: 55 },
    t: { zaslon: 'Brez kode napake. Želena T dvižnega voda 27 °C (ogrevalna krivulja zamaknjena navzdol). Način: ogrevanje.' },
    evidence: ['zaslon'],
  },
  'ovira-zraka': {
    side: 'zrak',
    n: { t0: -15, sh: 3, tDvizni: 31, tc: 34, tok: 4.6 },
    t: { zunanja: 'Lamele so do polovice prekrite z listjem, na spodnjem delu se nabira led.' },
    evidence: ['zunanja'],
  },
  filter: {
    side: 'voda',
    n: { dt: 12, tc: 50, tTlacni: 92, tDvizni: 41, tok: 6.6 },
    t: { zaslon: 'Občasno koda »visok tlak«, naprava se sama ponovno zažene.', filter: 'Mrežica je zamašena z rjo in blatom.' },
    evidence: ['dt-voda', 'filter'],
  },
  'premalo-hladiva': {
    side: 'hladivo',
    n: { t0: -13, sh: 15, tc: 33, sc: 1, tTlacni: 88, tok: 3.9, tDvizni: 30 },
    t: { zunanja: 'Lamele čiste. Na spoju cevi pod pokrovom je temen oljni madež.' },
    evidence: ['nt-stran', 'vt-stran'],
  },
  'prevec-hladiva': {
    side: 'hladivo',
    n: { tc: 46, sc: 11, sh: 4, tTlacni: 76, tok: 6.8 },
    t: { zaslon: 'Brez kode napake. V servisni knjigi: »jeseni dolito hladivo«.' },
    evidence: ['vt-stran'],
  },
  'zrak-v-vodi': {
    side: 'voda',
    n: { tlakVode: 0.4, dt: 10, tc: 47, tTlacni: 84, tDvizni: 38 },
    t: { zaslon: 'Koda »premajhen pretok vode«.', poslusaj: 'Šumenje in klokotanje v ceveh, obtočna črpalka občasno zaropota.' },
    evidence: ['tlak-vode'],
  },
  eev: {
    side: 'hladivo',
    n: { t0: -15, sh: 17, tc: 39, sc: 9, tTlacni: 86, tok: 4.4, tDvizni: 31 },
    evidence: ['nt-stran', 'vt-stran'],
  },
  senzor: {
    side: 'elektronika',
    n: { tDvizni: 29 },
    t: { zaslon: 'Brez kode napake. Krmilnik kaže povratno vodo 40 °C – termometer na cevi kaže 24 °C.' },
    evidence: ['zaslon', 't-dvizni'],
  },
  // 3-potni ventil obtiči v položaju za sanitarno vodo: vsa toplota gre v bojler.
  tripotni: {
    side: 'voda',
    n: { tDvizni: 24, dt: 2, tBojler: 61, tc: 46, tTlacni: 78 },
    t: {
      ventil3p: 'Kazalec na ventilu: SANITARNA VODA – tudi ko krmilnik zahteva ogrevanje. Motor ob preklopu brni, gred se ne premakne.',
      poslusaj: 'Kompresor teče ves čas. Ob ukazu za preklop se pri ventilu sliši brnenje, klika ni.',
    },
    evidence: ['ventil-3p', 'bojler'],
  },
  // 4-potni ventil se ne preklopi: odtajevanje ne steče, led se nabira.
  odtajevanje: {
    side: 'krmiljenje',
    n: { t0: -18, sh: 4, tDvizni: 28, tc: 33, tok: 4.2 },
    t: {
      zaslon: 'Koda »odtajevanje neuspešno«. Zadnjih 6 poskusov odtajevanja prekinjenih.',
      zunanja: 'Lamele v celoti v ledu. Listja ni, odtok kondenzata je prost.',
      poslusaj: 'Ko krmilnik začne odtajevanje, ni značilnega »šššš« preklopa 4-potnega ventila. Ventilator se ustavi, led ostane.',
    },
    evidence: ['zaslon', 'zunanja'],
  },
  // Zamašen filter sušilnik: zožitev na tekočinskem vodu, pred ekspanzijskim ventilom.
  'filter-susilnik': {
    side: 'hladivo',
    n: { t0: -14, sh: 14, tc: 40, sc: 8, tTlacni: 84, tok: 4.3, tDvizni: 31, dtSusilnik: 7 },
    t: { zunanja: 'Lamele čiste. Filter sušilnik na izstopu orošen in hladen na otip.' },
    evidence: ['nt-stran', 'dt-susilnik'],
  },
};

export const FAULT_IDS = Object.keys(FAULTS) as FaultId[];

const zoneOf = (v: number, [lo, hi]: readonly [number, number]): Zone => (v < lo ? 'low' : v > hi ? 'high' : 'ok');

/** Majhen, ponovljiv »šum«, da dva primera iste napake nista do decimalke enaka. */
function jitter(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (key: string) => {
    let x = h;
    for (const c of key) x = Math.imul(x ^ c.charCodeAt(0), 16777619);
    return (((x >>> 0) % 7) - 3) / 10; // −0,3 … +0,3
  };
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/** Vse odčitke za izbrano napako (ali normalno stanje, če fault manjka). */
export function readingsFor(fault?: FaultId, seed = 'x'): Record<string, Reading> {
  const f = fault ? FAULTS[fault] : undefined;
  const n = { ...BASE_N, ...f?.n };
  const t = { ...BASE_T, ...f?.t };
  const j = jitter(seed + (fault ?? ''));
  const num = (key: string, v: number) => r1(v + j(key));

  const tDv = num('td', n.tDvizni);
  const dt = num('dt', n.dt);
  const t0 = num('t0', n.t0);
  const sh = num('sh', n.sh);
  const tc = num('tc', n.tc);
  const sc = Math.max(0, num('sc', n.sc));
  const tTl = num('tt', n.tTlacni);
  const tok = num('tok', n.tok);
  const tBo = num('tbo', n.tBojler);
  const dtS = Math.max(0, num('dts', n.dtSusilnik));

  const out: Record<string, Reading> = {
    zaslon: { id: 'zaslon', label: 'Zaslon krmilnika', text: t.zaslon, zone: 'info' },
    'tlak-vode': { id: 'tlak-vode', label: 'Tlak vode', value: r1(n.tlakVode), unit: 'bar', zone: zoneOf(n.tlakVode, RANGES['tlak-vode']), range: [...RANGES['tlak-vode']] },
    zunanja: { id: 'zunanja', label: 'Zunanja enota', text: t.zunanja, zone: 'info' },
    poslusaj: { id: 'poslusaj', label: 'Zvok', text: t.poslusaj, zone: 'info' },
    't-dvizni': { id: 't-dvizni', label: 'T dvižnega voda', value: tDv, unit: '°C', zone: zoneOf(tDv, RANGES['t-dvizni']), range: [...RANGES['t-dvizni']] },
    'dt-voda': { id: 'dt-voda', label: 'ΔT voda', value: dt, unit: 'K', zone: zoneOf(dt, RANGES['dt-voda']), range: [...RANGES['dt-voda']] },
    filter: { id: 'filter', label: 'Filter vode', text: t.filter, zone: 'info' },
    't0': { id: 't0', label: 'T uparjanja (iz NT tlaka)', value: t0, unit: '°C', zone: zoneOf(t0, RANGES.t0), range: [...RANGES.t0] },
    sh: { id: 'sh', label: 'Pregrevanje SH', value: sh, unit: 'K', zone: zoneOf(sh, RANGES.sh), range: [...RANGES.sh] },
    tc: { id: 'tc', label: 'T kondenzacije (iz VT tlaka)', value: tc, unit: '°C', zone: zoneOf(tc, RANGES.tc), range: [...RANGES.tc] },
    sc: { id: 'sc', label: 'Podhlajevanje SC', value: sc, unit: 'K', zone: zoneOf(sc, RANGES.sc), range: [...RANGES.sc] },
    't-tlacni': { id: 't-tlacni', label: 'T tlačnega voda', value: tTl, unit: '°C', zone: zoneOf(tTl, RANGES['t-tlacni']), range: [...RANGES['t-tlacni']] },
    tok: { id: 'tok', label: 'Tok kompresorja', value: tok, unit: 'A', zone: zoneOf(tok, RANGES.tok), range: [...RANGES.tok] },
    'ventil-3p': { id: 'ventil-3p', label: '3-potni ventil', text: t.ventil3p, zone: 'info' },
    't-bojler': { id: 't-bojler', label: 'T sanitarne vode', value: tBo, unit: '°C', zone: zoneOf(tBo, RANGES['t-bojler']), range: [...RANGES['t-bojler']] },
    'dt-susilnik': { id: 'dt-susilnik', label: 'ΔT na filtru sušilniku', value: dtS, unit: 'K', zone: zoneOf(dtS, RANGES['dt-susilnik']), range: [...RANGES['dt-susilnik']] },
  };
  return out;
}

/** Katere odčitke prikaže posamezna meritev (manometer na NT strani da T uparjanja in SH). */
export const MEASUREMENT_READINGS: Record<string, string[]> = {
  zaslon: ['zaslon'],
  'tlak-vode': ['tlak-vode'],
  zunanja: ['zunanja'],
  poslusaj: ['poslusaj'],
  'ventil-3p': ['ventil-3p'],
  bojler: ['t-bojler'],
  'dt-susilnik': ['dt-susilnik'],
  't-dvizni': ['t-dvizni'],
  'dt-voda': ['dt-voda'],
  filter: ['filter'],
  'nt-stran': ['t0', 'sh'],
  'vt-stran': ['tc', 'sc'],
  't-tlacni': ['t-tlacni'],
  tok: ['tok'],
};

export interface CaseResult {
  fault: FaultId;
  measured: string[]; // v vrstnem redu
  guesses: FaultId[]; // zadnja je končna
  par: number; // minute, ki jih rabi dober serviser
}

export interface Score {
  points: number;
  stars: 0 | 1 | 2 | 3;
  minutes: number;
  solved: boolean;
  notes: { text: string; points: number }[];
}

/** Točkovanje enega klica. Nagrajuje dokaz in »najlažje najprej«, kaznuje ugibanje in nepotreben poseg v hladivo. */
export function scoreCase(r: CaseResult): Score {
  const f = FAULTS[r.fault];
  const minutes = r.measured.reduce((s, id) => s + (measurementById(id)?.minutes ?? 0), 0);
  const solved = r.guesses[r.guesses.length - 1] === r.fault;
  const notes: Score['notes'] = [];
  let points = 0;

  if (solved) {
    points += 100;
    notes.push({ text: 'Pravilna diagnoza', points: 100 });
  } else {
    notes.push({ text: 'Diagnoza ni pravilna', points: 0 });
  }
  const wrong = r.guesses.filter((g) => g !== r.fault).length;
  if (wrong) {
    points -= 30 * wrong;
    notes.push({ text: `Napačna domneva ×${wrong}`, points: -30 * wrong });
  }
  const proved = f.evidence.every((e) => r.measured.includes(e));
  if (solved && !proved) {
    points -= 25;
    notes.push({ text: 'Ugibanje: ključne meritve manjkajo', points: -25 });
  }
  const firstTwo = r.measured.slice(0, 2).map((id) => measurementById(id)?.kind);
  if (firstTwo.length && firstTwo.every((k) => k === 'easy' || k === 'visual')) {
    points += 10;
    notes.push({ text: 'Najlažje najprej', points: 10 });
  }
  const touchedRefrigerant = r.measured.some((id) => id === 'nt-stran' || id === 'vt-stran');
  if (f.side !== 'hladivo' && !touchedRefrigerant) {
    points += 15;
    notes.push({ text: 'Brez nepotrebnega priklopa manometrov', points: 15 });
  }
  const over = Math.max(0, minutes - r.par);
  if (over) {
    const p = -Math.min(30, over);
    points += p;
    notes.push({ text: `${over} min več od dobrega serviserja`, points: p });
  }
  points = Math.max(0, points);
  const stars = !solved ? 0 : points >= 110 ? 3 : points >= 80 ? 2 : 1;
  return { points, stars, minutes, solved, notes };
}
