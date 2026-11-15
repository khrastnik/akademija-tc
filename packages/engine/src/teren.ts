// Igra »Teren« – model po PRD »Serviser TČ«. Toplotna črpalka zrak–voda z R32 v ogrevanju.
// Vrednosti so parametrični učni model (ne simulacija termodinamike in ne podatki proizvajalca).
import { satPressure, type PTPoint } from './ptcalc';

export type Level = 'vajenec' | 'serviser' | 'mojster';
export type Zone = 'ok' | 'low' | 'high' | 'info';

/** Ponovljiv generator naključnih števil (mulberry32) – isti seme = isti nalog. */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (lo: number, hi: number) => lo + next() * (hi - lo),
    int: (lo: number, hi: number) => Math.floor(lo + next() * (hi - lo + 1)),
    pick: <T>(arr: readonly T[]) => arr[Math.floor(next() * arr.length)],
    chance: (p: number) => next() < p,
  };
}
export type Rng = ReturnType<typeof rng>;

export interface Env {
  heating: 'radiatorji' | 'talno';
  tOut: number;
  tRoom: number;
  ctrlTOut: number; // kaj bere krmilnik
  tFlowSet: number; // zahtevana T dovoda po krivulji
  tFlow: number; // dejanska T dovoda iz naprave
  tRadIn: number; // T vode, ki pride v radiatorje
  dtWater: number;
  flow: number; // m³/h
  flowSwing: boolean;
  pWater: number; // bar
  preCharge: number; // predtlak raztezne posode, bar
  tEvap: number;
  tCond: number;
  sh: number;
  sc: number;
  tDis: number;
  iComp: number;
  compRunning: boolean;
  starts24h: number;
  fanOn: boolean;
  ice: 'ni' | 'delno' | 'polno' | 'sesalni';
  pumpRunning: boolean;
  pumpSound: 'enakomerno' | 'grgra' | 'tiho';
  strainer: 'cist' | 'zamasen';
  eev: 'ok' | 'zaprt' | 'odprt';
  coil4: number; // Ω, Infinity = prekinjena
  ntcOhm: number; // upornost zunanjega senzorja
  ntcExpected: number;
  valve3: 'ogrevanje' | 'bojler';
  tDhw: number;
  dtDrier: number;
  leak: boolean;
  backupOn: boolean;
  backupLimit: number;
  energyRatio: number; // poraba glede na lani pri podobnem vremenu
  ctrlHp: number; // tlak, ki ga bere krmilnikov senzor VT (bar g)
  code: string | null;
  staleCode: string | null;
}

export type FaultId =
  | 'premalo-hladiva'
  | 'lovilec'
  | 'ventilator'
  | 'eev-zaprt'
  | 'eev-odprt'
  | 'prevec-hladiva'
  | 'zrak-v-vodi'
  | 'crpalka'
  | 'senzor-zunanji'
  | 'odtajevanje'
  | 'krivulja'
  | 'tripotni'
  | 'filter-susilnik'
  | 'raztezna'
  | 'dogrevalnik'
  | 'vt-senzor';

type Mod = (e: Env, r: Rng) => void;
/** Kako vsaka okvara spremeni zdravo stanje. code = generična koda (brez pravih znamk), p = verjetnost, da jo krmilnik pokaže. */
export const FAULT_MODS: Record<FaultId, { mod: Mod; code?: string; p?: number }> = {
  'premalo-hladiva': {
    code: 'E-LP nizek tlak',
    p: 0.5,
    mod: (e, r) => {
      e.sh = r.range(15, 23);
      e.sc = r.range(0, 1);
      e.tEvap -= r.range(3, 5);
      e.tDis += r.range(18, 25);
      e.iComp -= 1;
      e.tFlow -= 3;
      e.leak = true;
    },
  },
  lovilec: {
    code: 'E-FL premajhen pretok',
    p: 0.7,
    mod: (e, r) => {
      e.flow = r.range(0.3, 0.45);
      e.dtWater = r.range(11, 15);
      e.tCond += r.range(7, 10);
      e.tDis += 15;
      e.iComp += 1;
      e.strainer = 'zamasen';
    },
  },
  ventilator: {
    code: 'E-FN ventilator',
    p: 0.6,
    mod: (e, r) => {
      e.fanOn = false;
      e.ice = 'delno';
      e.tEvap -= r.range(9, 12);
      e.sh = r.range(3, 5);
      e.iComp -= 1.2;
      e.tFlow -= 5;
    },
  },
  'eev-zaprt': {
    code: 'E-EV ekspanzijski ventil',
    p: 0.4,
    mod: (e, r) => {
      e.sh = r.range(14, 20);
      e.sc = r.range(9, 13);
      e.tEvap -= r.range(5, 7);
      e.tDis += 15;
      e.eev = 'zaprt';
      e.tFlow -= 4;
    },
  },
  'eev-odprt': {
    code: 'E-TD nizka T tlačnega voda',
    p: 0.4,
    mod: (e, r) => {
      e.sh = r.range(0, 0.5);
      e.sc = r.range(1, 2);
      e.ice = 'sesalni';
      e.tDis = e.tCond + r.range(4, 8);
      e.eev = 'odprt';
    },
  },
  'prevec-hladiva': {
    code: 'E-HP visok tlak',
    p: 0.4,
    mod: (e, r) => {
      e.sc = r.range(11, 15);
      e.tCond += r.range(5, 7);
      e.sh = r.range(3, 4);
      e.iComp += 1.3;
    },
  },
  'zrak-v-vodi': {
    code: 'E-FL premajhen pretok',
    p: 0.6,
    mod: (e, r) => {
      e.pWater = r.range(0.3, 0.55);
      e.flow = r.range(0.6, 1.0);
      e.flowSwing = true;
      e.pumpSound = 'grgra';
      e.dtWater = r.range(7, 9);
    },
  },
  crpalka: {
    code: 'E-FL ni pretoka',
    p: 0.75,
    mod: (e) => {
      e.flow = 0;
      e.pumpRunning = false;
      e.pumpSound = 'tiho';
      e.compRunning = false;
      e.iComp = 0;
      e.tFlow = e.tRoom + 2;
      e.dtWater = 0;
    },
  },
  'senzor-zunanji': {
    code: 'E-TO senzor zunanje T',
    p: 0.4,
    mod: (e, r) => {
      e.ctrlTOut = -40;
      e.tFlowSet = 55;
      e.tFlow = r.range(53, 55);
      e.tCond = e.tFlow + 3;
      e.tRoom = r.range(25, 27);
      e.ntcOhm = Infinity;
      e.energyRatio = 1.5;
    },
  },
  odtajevanje: {
    code: 'E-DF odtajevanje neuspešno',
    p: 0.6,
    mod: (e, r) => {
      e.ice = 'polno';
      e.tEvap -= r.range(11, 14);
      e.coil4 = Infinity;
      e.tFlow -= 6;
      e.iComp -= 1;
    },
  },
  krivulja: {
    mod: (e, r) => {
      e.tFlowSet = r.range(26, 29);
      e.tFlow = e.tFlowSet;
      e.tCond = e.tFlow + 3;
      e.tRoom = r.range(17, 18.5);
    },
  },
  tripotni: {
    mod: (e, r) => {
      e.valve3 = 'bojler';
      e.tDhw = r.range(60, 63);
      e.tRadIn = e.tRoom + r.range(2, 4);
      e.tRoom = r.range(16.5, 18);
    },
  },
  'filter-susilnik': {
    mod: (e, r) => {
      e.sh = r.range(13, 18);
      e.sc = r.range(8, 11);
      e.tEvap -= r.range(4, 6);
      e.tDis += 12;
      e.dtDrier = r.range(6, 9);
      e.tFlow -= 3;
    },
  },
  raztezna: {
    mod: (e, r) => {
      e.pWater = r.range(2.7, 2.95);
      e.preCharge = r.range(0, 0.2);
    },
  },
  dogrevalnik: {
    mod: (e) => {
      e.backupOn = true;
      e.backupLimit = 10;
      e.energyRatio = 1.9;
    },
  },
  'vt-senzor': {
    code: 'E-HP visok tlak',
    p: 0.9,
    mod: (e, r) => {
      e.ctrlHp = r.range(40, 42);
      e.starts24h = r.int(25, 40);
      e.tRoom -= 2;
    },
  },
};
export const FAULT_IDS = Object.keys(FAULT_MODS) as FaultId[];

const STALE = ['E-PW izpad napajanja (pred 3 tedni)', 'E-CM komunikacija (lani)', 'E-DF odtajevanje (pred 2 mesecema, enkrat)'];
export const LEVELS: Record<Level, { noise: number; codeMul: number; stale: number; learn: boolean; combo: number; label: string }> = {
  vajenec: { noise: 0.5, codeMul: 1.2, stale: 0, learn: true, combo: 0, label: 'Vajenec' },
  serviser: { noise: 1, codeMul: 1, stale: 0.2, learn: true, combo: 0.15, label: 'Serviser' },
  mojster: { noise: 1.6, codeMul: 0.7, stale: 0.3, learn: false, combo: 0.35, label: 'Mojster' },
};

// ---------- kombinirane okvare ----------
/**
 * Pari okvar, ki se na terenu pojavijo skupaj in se v modelu ne prekrivajo (vsaka spremeni druge veličine),
 * zato ostaneta oba podpisa vidna. Pogosto ena prikrije drugo – zato je diagnoza težja.
 */
export const COMBOS: [FaultId, FaultId][] = [
  ['premalo-hladiva', 'lovilec'], // stara naprava: puščanje + mulj
  ['premalo-hladiva', 'raztezna'],
  ['ventilator', 'raztezna'],
  ['odtajevanje', 'raztezna'],
  ['odtajevanje', 'dogrevalnik'], // led – grelec pomaga, računi rastejo
  ['krivulja', 'dogrevalnik'], // napačne nastavitve na dveh mestih
  ['eev-zaprt', 'tripotni'],
  ['filter-susilnik', 'zrak-v-vodi'], // po popravilu: nečistoče v krogu + zrak v vodi
  ['prevec-hladiva', 'dogrevalnik'],
  ['vt-senzor', 'raztezna'],
  ['ventilator', 'krivulja'],
  ['lovilec', 'krivulja'],
];
/** Možni partner za kombinirano okvaro (ali null). */
export function comboPartner(f: FaultId, r: Rng): FaultId | null {
  const opts = COMBOS.filter((c) => c.includes(f)).map((c) => (c[0] === f ? c[1] : c[0]));
  return opts.length ? r.pick(opts) : null;
}

// ---------- letni časi (kampanja) ----------
export type Season = 'jesen' | 'zima' | 'pomlad';
export const SEASONS: Record<Season, { label: string; tOut: [number, number]; typical: FaultId[]; intro: string; icon: string }> = {
  jesen: {
    label: 'Jesen – zagon sezone',
    icon: '🍂',
    tOut: [3, 12],
    typical: ['crpalka', 'zrak-v-vodi', 'krivulja', 'raztezna', 'lovilec'],
    intro: 'Prvi zagon po poletju. Črpalke so po mirovanju lahko zablokirane, v sistemu je zrak, krivulje so ostale od lani. Listje pada na zunanje enote.',
  },
  zima: {
    label: 'Zima – mraz in led',
    icon: '❄️',
    tOut: [-12, 2],
    typical: ['odtajevanje', 'ventilator', 'premalo-hladiva', 'senzor-zunanji', 'eev-zaprt'],
    intro: 'Najbolj obremenjen čas. Led na zunanjih enotah, odtajevanje dela ves čas, slabosti v krogu hladiva pridejo na dan. Klici so nujni – hiše so mrzle.',
  },
  pomlad: {
    label: 'Pomlad – računi in servisi',
    icon: '🌱',
    tOut: [5, 16],
    typical: ['dogrevalnik', 'prevec-hladiva', 'filter-susilnik', 'tripotni', 'vt-senzor'],
    intro: 'Pridejo računi za zimo in posledice zimskih popravil. Stranke sprašujejo, zakaj je poraba visoka, naprave po posegih ne delajo prav.',
  },
};
export const SEASON_ORDER: Season[] = ['jesen', 'zima', 'pomlad'];
export const DAYS_PER_SEASON = 2;
/** Letni čas za zaporedni dan kampanje (0, 1, 2 …). */
export const seasonForDay = (day: number): Season => SEASON_ORDER[Math.floor(day / DAYS_PER_SEASON) % SEASON_ORDER.length];
/** Kupček za letni čas: tipične okvare dvakrat, ostale enkrat, premešano. */
export function seasonDeck(season: Season, seed: number): FaultId[] {
  const r = rng(seed);
  const d = [...FAULT_IDS, ...SEASONS[season].typical];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(r.next() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

/** Zgradi stanje naprave za nalog: zdravo izhodišče (PRD), ena ali dve okvari, šum in kode. */
export function makeEnv(fault: FaultId | FaultId[], seed: number, level: Level = 'serviser', tOutRange: [number, number] = [-7, 7]): Env {
  const faults = Array.isArray(fault) ? fault : [fault];
  const r = rng(seed);
  const L = LEVELS[level];
  const heating = r.chance(0.6) ? 'radiatorji' : 'talno';
  const tOut = Math.round(r.range(tOutRange[0], tOutRange[1]));
  const tFlowSet = heating === 'radiatorji' ? 35 + (2 - tOut) * 0.7 : 30 + (2 - tOut) * 0.35;
  const e: Env = {
    heating,
    tOut,
    tRoom: r.range(20.5, 22),
    ctrlTOut: tOut,
    tFlowSet,
    tFlow: tFlowSet,
    tRadIn: NaN,
    dtWater: r.range(4.5, 6),
    flow: r.range(1.15, 1.35),
    flowSwing: false,
    pWater: r.range(1.4, 1.8),
    preCharge: r.range(0.9, 1.2),
    tEvap: tOut - r.range(6, 8),
    tCond: tFlowSet + r.range(2.5, 4),
    sh: r.range(4, 6.5),
    sc: r.range(3, 5),
    tDis: 0,
    iComp: r.range(5.5, 6.8),
    compRunning: true,
    starts24h: r.int(3, 8),
    fanOn: true,
    ice: 'ni',
    pumpRunning: true,
    pumpSound: 'enakomerno',
    strainer: 'cist',
    eev: 'ok',
    coil4: r.range(1400, 1600),
    ntcOhm: 0,
    ntcExpected: 0,
    valve3: 'ogrevanje',
    tDhw: r.range(47, 52),
    dtDrier: r.range(0, 1),
    leak: false,
    backupOn: false,
    backupLimit: -10,
    energyRatio: r.range(0.9, 1.1),
    ctrlHp: NaN,
    code: null,
    staleCode: null,
  };
  e.tDis = e.tCond + r.range(22, 30);
  // NTC 10 kΩ pri 25 °C, B ≈ 3950 – pričakovana upornost pri zunanji T
  e.ntcExpected = 10000 * Math.exp(3950 * (1 / (tOut + 273.15) - 1 / 298.15));
  e.ntcOhm = e.ntcExpected * r.range(0.98, 1.02);
  for (const id of faults) FAULT_MODS[id].mod(e, r);
  if (Number.isNaN(e.tRadIn)) e.tRadIn = e.tFlow - r.range(0.3, 1);
  // šum na vseh merjenih vrednostih
  const n = (v: number, s: number) => v + (r.next() * 2 - 1) * s * L.noise;
  e.tFlow = n(e.tFlow, 0.4);
  e.dtWater = Math.max(0, n(e.dtWater, 0.3));
  if (e.flow > 0) e.flow = Math.max(0.05, n(e.flow, 0.03));
  e.pWater = Math.max(0, n(e.pWater, 0.05));
  e.tEvap = n(e.tEvap, 0.5);
  e.tCond = n(e.tCond, 0.5);
  e.sh = Math.max(0, n(e.sh, 0.4));
  e.sc = Math.max(0, n(e.sc, 0.4));
  e.tDis = n(e.tDis, 1.5);
  if (e.iComp > 0) e.iComp = n(e.iComp, 0.2);
  // koda napake: le z verjetnostjo; včasih stara, nepovezana koda v zgodovini
  const codes = faults.map((id) => FAULT_MODS[id]).filter((m) => m.code && r.chance(Math.min(0.95, (m.p ?? 0.5) * L.codeMul))).map((m) => m.code!);
  e.code = codes.length ? [...new Set(codes)].join('; ') : null;
  if (r.chance(L.stale)) e.staleCode = r.pick(STALE);
  return e;
}

// ---------- orodja in meritve ----------
export type Comp =
  | 'stranka'
  | 'radiator'
  | 'krmilnik'
  | 'manometer'
  | 'crpalka'
  | 'lovilec'
  | 'pt'
  | 'tripotni'
  | 'raztezna'
  | 'dogrevalnik'
  | 'uparjalnik'
  | 'ventilator'
  | 'zunanji-senzor'
  | 'servisni'
  | 'kompresor'
  | 'eev'
  | 'stiripotni'
  | 'susilnik';

export interface Tool {
  id: string;
  label: string;
  comp: Comp;
  min: number;
  needs?: string;
  /** potrditvena (draga) meritev */
  confirm?: boolean;
}
export const TOOLS: Tool[] = [
  { id: 'pogovor', label: 'Pogovor s stranko', comp: 'stranka', min: 2 },
  { id: 'radiatorji', label: 'Radiatorji / tla in sobna T', comp: 'radiator', min: 2 },
  { id: 'zaslon', label: 'Zaslon: koda in zgodovina', comp: 'krmilnik', min: 2 },
  { id: 'nastavitve', label: 'Nastavitve: krivulja, dogrevalnik', comp: 'krmilnik', min: 3 },
  { id: 'pretok', label: 'Pretok (krmilnik)', comp: 'krmilnik', min: 2 },
  { id: 'tlak-vode', label: 'Tlak vode', comp: 'manometer', min: 1 },
  { id: 'dt-vode', label: 'T dovoda in povratka (ΔT)', comp: 'pt', min: 4 },
  { id: 'poslusaj', label: 'Poslušaj obtočno črpalko', comp: 'crpalka', min: 2 },
  { id: 'crpalka-pregled', label: 'Pregled črpalke (napajanje, vrtenje)', comp: 'crpalka', min: 6, confirm: true },
  { id: 'lovilec', label: 'Odpri lovilec nesnage', comp: 'lovilec', min: 10, confirm: true },
  { id: 'tripotni', label: '3-potni ventil in T bojlerja', comp: 'tripotni', min: 3 },
  { id: 'raztezna', label: 'Predtlak raztezne posode', comp: 'raztezna', min: 10, confirm: true },
  { id: 'poraba', label: 'Števec elektrike in dogrevalnik', comp: 'dogrevalnik', min: 3 },
  { id: 'zunanja', label: 'Pregled zunanje enote (led, listje)', comp: 'uparjalnik', min: 3 },
  { id: 'ventilator', label: 'Pregled ventilatorja', comp: 'ventilator', min: 4, confirm: true },
  { id: 'ntc', label: 'NTC zunanjega senzorja (Ω)', comp: 'zunanji-senzor', min: 5, confirm: true },
  { id: 'baterija', label: 'Priklopi manometrsko baterijo', comp: 'servisni', min: 8 },
  { id: 'nt', label: 'NT tlak + T uparjanja', comp: 'servisni', min: 1, needs: 'baterija' },
  { id: 'vt', label: 'VT tlak + T kondenzacije', comp: 'servisni', min: 1, needs: 'baterija' },
  { id: 'sh', label: 'Pregretje (SH)', comp: 'servisni', min: 3, needs: 'baterija' },
  { id: 'sc', label: 'Podhladitev (SC)', comp: 'servisni', min: 3, needs: 'baterija' },
  { id: 'vt-senzor', label: 'VT: krmilnik proti manometru', comp: 'krmilnik', min: 2, needs: 'baterija' },
  { id: 'detektor', label: 'Detektor puščanja', comp: 'servisni', min: 10, confirm: true },
  { id: 't-tlacni', label: 'T tlačnega voda', comp: 'kompresor', min: 3 },
  { id: 'tok', label: 'Tok kompresorja', comp: 'kompresor', min: 4 },
  { id: 'eev', label: 'Pregled EEV (tuljava, odziv)', comp: 'eev', min: 6, confirm: true },
  { id: 'tuljava4', label: 'Upornost tuljave 4-potnega ventila', comp: 'stiripotni', min: 5, confirm: true },
  { id: 'susilnik', label: 'ΔT na filtru sušilniku', comp: 'susilnik', min: 4 },
];
export const toolById = (id: string) => TOOLS.find((t) => t.id === id);

export interface Reading {
  text: string;
  zone: Zone;
  /** normalno območje (učni način) */
  normal?: string;
}
const f1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString('sl-SI', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const z = (v: number, lo: number, hi: number): Zone => (v < lo ? 'low' : v > hi ? 'high' : 'ok');
const bar = (pts: PTPoint[], t: number) => (satPressure(pts, t, 'bubble') ?? NaN) - 1.013;

/** Odčitek meritve v obstoječem stanju. pts = P-T tabela R32 (preverjena, data/refrigerants.json). */
export function reading(tool: string, e: Env, pts: PTPoint[]): Reading {
  const run = e.compRunning;
  switch (tool) {
    case 'pogovor':
      return { zone: 'info', text: e.backupOn ? 'Stranka: »Toplo je, ampak račun za elektriko je skoraj dvojen.«' : e.valve3 === 'bojler' ? 'Stranka: »Tuš je vroč kot še nikoli, hiša pa mrzla.«' : e.pWater > 2.6 ? 'Stranka: »Varnostni ventil kaplja, vsak teden dolivam vodo.«' : e.starts24h > 20 ? 'Stranka: »Zunanja enota se ves dan vklaplja in ugaša.«' : e.ctrlTOut < -30 ? 'Stranka: »Pregreto je, odpiramo okna.«' : 'Stranka ponovi prijavo, nič novega.' };
    case 'radiatorji': {
      const hot = e.tRadIn;
      return { zone: z(e.tRoom, 20, 23.5), text: `Sobna T ${f1(e.tRoom)} °C, ${e.heating === 'radiatorji' ? 'radiatorji' : 'tla'} na otip ${hot > 34 ? 'topli' : hot > 27 ? 'mlačni' : 'hladni'}.`, normal: 'sobna 20–23 °C' };
    }
    case 'zaslon': {
      const lines = [e.code ? `Aktivna koda: ${e.code}.` : 'Ni aktivne kode.'];
      if (e.staleCode) lines.push(`V zgodovini: ${e.staleCode}.`);
      lines.push(`Zunanja T (krmilnik): ${f1(e.ctrlTOut)} °C. Zagonov v 24 h: ${e.starts24h}.`);
      return { zone: e.code ? 'high' : 'info', text: lines.join(' '), normal: 'zagonov: do ~10 na dan (orientacijsko)' };
    }
    case 'nastavitve':
      return { zone: 'info', text: `Zahtevana T dovoda po krivulji: ${f1(e.tFlowSet)} °C pri zunanji ${f1(e.ctrlTOut)} °C. Meja vklopa dogrevalnika: ${e.backupLimit > 0 ? '+' : ''}${e.backupLimit} °C.`, normal: e.heating === 'radiatorji' ? 'radiatorji: okoli 33–45 °C' : 'talno: okoli 28–35 °C' };
    case 'pretok':
      return { zone: e.flow < 0.9 ? 'low' : 'ok', text: e.flow === 0 ? 'Pretok 0,00 m³/h.' : `Pretok ${e.flow.toFixed(2).replace('.', ',')} m³/h${e.flowSwing ? ' – niha' : ''}.`, normal: '1,15–1,35 m³/h' };
    case 'tlak-vode':
      return { zone: z(e.pWater, 1.0, 2.5), text: `Tlak vode ${f1(e.pWater)} bar.`, normal: '1,4–1,8 bar (hladno)' };
    case 'dt-vode':
      return { zone: z(e.dtWater, 3.5, 7.5), text: run ? `Dovod ${f1(e.tFlow)} °C, povratek ${f1(e.tFlow - e.dtWater)} °C → ΔT ${f1(e.dtWater)} K.` : 'Kompresor ne teče – cevi so na sobni temperaturi.', normal: 'ΔT 4,5–6 K' };
    case 'poslusaj':
      return { zone: e.pumpSound === 'enakomerno' ? 'ok' : 'high', text: e.pumpSound === 'grgra' ? 'Črpalka grgra, v ceveh šumi zrak.' : e.pumpSound === 'tiho' ? 'Črpalke se ne sliši – ne teče.' : 'Enakomerno, tiho brnenje.' };
    case 'crpalka-pregled':
      return { zone: e.pumpRunning ? 'ok' : 'high', text: e.pumpRunning ? 'Črpalka ima napajanje in se vrti.' : 'Napajanje je, gred se ne vrti – motor zablokiran ali okvarjen.' };
    case 'lovilec':
      return { zone: e.strainer === 'zamasen' ? 'high' : 'ok', text: e.strainer === 'zamasen' ? 'Mrežica polna mulja in magnetita.' : 'Mrežica je čista.' };
    case 'tripotni':
      return { zone: e.valve3 === 'bojler' ? 'high' : 'ok', text: e.valve3 === 'bojler' ? `Kazalec na SANITARNI, čeprav je zahteva ogrevanje. Bojler ${f1(e.tDhw)} °C.` : `Kazalec na OGREVANJU. Bojler ${f1(e.tDhw)} °C.`, normal: 'bojler 45–55 °C' };
    case 'raztezna':
      return { zone: e.preCharge < 0.5 ? 'low' : 'ok', text: `Predtlak plinske strani ${f1(e.preCharge)} bar (vodna stran izpraznjena).`, normal: 'po projektu, običajno blizu 1 bar' };
    case 'poraba':
      return { zone: e.energyRatio > 1.3 ? 'high' : 'ok', text: `Poraba ${Math.round(e.energyRatio * 100)} % lanske pri podobnem vremenu. Dogrevalnik: ${e.backupOn ? 'VKLOPLJEN' : 'izklopljen'}.` };
    case 'zunanja':
      return { zone: e.ice === 'ni' ? 'ok' : 'high', text: e.ice === 'polno' ? 'Ves uparjalnik v ledu, ventilator se vrti.' : e.ice === 'delno' ? 'Led na spodnjem delu uparjalnika, ventilator stoji.' : e.ice === 'sesalni' ? 'Lamele čiste, sesalni vod do kompresorja zaledenel.' : 'Lamele čiste, ventilator se vrti, odtok kondenzata prost.' };
    case 'ventilator':
      return { zone: e.fanOn ? 'ok' : 'high', text: e.fanOn ? 'Ventilator se vrti enakomerno.' : 'Ventilator stoji, motor ob zahtevi ne zažene.' };
    case 'ntc':
      return { zone: Number.isFinite(e.ntcOhm) ? 'ok' : 'high', text: Number.isFinite(e.ntcOhm) ? `${f1(e.ntcOhm / 1000)} kΩ – ustreza ${f1(e.tOut)} °C po tabeli.` : 'Upornost ∞ – senzor ali kabel prekinjen.', normal: `pri ${e.tOut} °C okoli ${f1(e.ntcExpected / 1000)} kΩ` };
    case 'baterija':
      return { zone: 'info', text: 'Baterija priklopljena na servisna priključka.' };
    case 'nt':
      return { zone: run ? z(e.tEvap, e.tOut - 8.5, e.tOut - 5.5) : 'info', text: run ? `NT ${f1(bar(pts, e.tEvap))} bar → T uparjanja ${f1(e.tEvap)} °C.` : 'Kompresor stoji – tlaka sta izenačena.', normal: `T uparjanja = T zunaj − 6…8 K (${f1(e.tOut - 8)}…${f1(e.tOut - 6)} °C)` };
    case 'vt':
      return { zone: run ? z(e.tCond - e.tFlow, 2, 4.5) : 'info', text: run ? `VT ${f1(bar(pts, e.tCond))} bar → T kondenzacije ${f1(e.tCond)} °C.` : 'Kompresor stoji – tlaka sta izenačena.', normal: 'T kondenzacije = T dovoda + 2,5…4 K' };
    case 'sh':
      return { zone: run ? z(e.sh, 3.5, 7.5) : 'info', text: run ? `Pregretje ${f1(e.sh)} K.` : 'Kompresor stoji – ni meritve.', normal: '4–6,5 K' };
    case 'sc':
      return { zone: run ? z(e.sc, 2.5, 6) : 'info', text: run ? `Podhladitev ${f1(e.sc)} K.` : 'Kompresor stoji – ni meritve.', normal: '3–5 K' };
    case 'vt-senzor': {
      const real = bar(pts, e.tCond);
      const ctrl = Number.isFinite(e.ctrlHp) ? e.ctrlHp : real + 0.1;
      return { zone: Math.abs(ctrl - real) > 2 ? 'high' : 'ok', text: `Krmilnik bere ${f1(ctrl)} bar, manometer kaže ${f1(real)} bar.`, normal: 'razlika do ~0,5 bar' };
    }
    case 'detektor':
      return { zone: e.leak ? 'high' : 'ok', text: e.leak ? 'Alarm na holandski matici tekočinskega voda – puščanje.' : 'Ni puščanja na dostopnih spojih.' };
    case 't-tlacni':
      return { zone: run ? z(e.tDis - e.tCond, 15, 40) : 'info', text: run ? `T tlačnega voda ${f1(e.tDis)} °C.` : 'Kompresor stoji.', normal: 'okoli 20–35 K nad T kondenzacije' };
    case 'tok':
      return { zone: run ? z(e.iComp, 4.8, 7.5) : 'low', text: run ? `Tok kompresorja ${f1(e.iComp)} A.` : 'Kompresor ne teče – 0 A (zaščita: ni pretoka).', normal: '5,5–6,8 A pri tej obremenitvi' };
    case 'eev':
      return { zone: e.eev === 'ok' ? 'ok' : 'high', text: e.eev === 'zaprt' ? 'Tuljava v redu, ventil se ob ukazu ne odpre – igla zataknjena.' : e.eev === 'odprt' ? 'Ventil ostane odprt tudi ob ukazu za zapiranje.' : 'Tuljava v redu, ventil sledi ukazom krmilnika.' };
    case 'tuljava4':
      return { zone: Number.isFinite(e.coil4) ? 'ok' : 'high', text: Number.isFinite(e.coil4) ? `Upornost tuljave ${Math.round(e.coil4)} Ω.` : 'Upornost ∞ Ω – tuljava prekinjena.', normal: 'okoli 1–2 kΩ (po navodilih)' };
    case 'susilnik':
      return { zone: z(e.dtDrier, -1, 2), text: `ΔT na filtru sušilniku ${f1(e.dtDrier)} K.`, normal: '0–1 K' };
  }
  return { zone: 'info', text: '–' };
}

// ---------- točkovanje in dan (PRD) ----------
export const DAY_MIN = 480;
export const START_REP = 3;

export interface JobResult {
  correct: boolean;
  pay: number;
  repDelta: number;
  notes: string[];
}
/** Plačilo po PRD: (140 € − 1,2 € × min nad 20 min na lokaciji) × (0,6 + 0,1 × ugled), najmanj 40 €; ≤ 1 meritev ×0,7; napaka −30 € in −1 ★. */
export function scoreJob(correct: boolean, onSiteMin: number, measurements: number, rep: number): JobResult {
  if (!correct) return { correct, pay: -30, repDelta: -1, notes: ['Napačna diagnoza: −30 € in −1 ★'] };
  const notes: string[] = [];
  let pay = (140 - 1.2 * Math.max(0, onSiteMin - 20)) * (0.6 + 0.1 * rep);
  if (onSiteMin > 20) notes.push(`${onSiteMin - 20} min nad 20 min: −${Math.round(1.2 * (onSiteMin - 20))} €`);
  notes.push(`Ugled ${rep} ★: ×${(0.6 + 0.1 * rep).toFixed(1)}`);
  pay = Math.max(40, pay);
  if (measurements <= 1) {
    pay *= 0.7;
    notes.push('Diagnoza z ≤ 1 meritvijo: ×0,7 (ugibanje)');
  }
  const repDelta = onSiteMin <= 35 ? 1 : 0;
  if (repDelta) notes.push('Pravilno v ≤ 35 min: +1 ★');
  return { correct, pay: Math.round(pay), repDelta, notes };
}

/**
 * Ocena diagnoze z eno ali dvema okvarama. Vse pravilno = polno plačilo (pri dveh okvarah ×1,25);
 * delno pravilno (ena od dveh ali ena preveč) = pol plačila brez spremembe ugleda; nič pravilnega = napaka.
 */
export function scoreDiagnosis(actual: FaultId[], guess: FaultId[], onSiteMin: number, measurements: number, rep: number): JobResult & { level: 'ok' | 'partial' | 'wrong' } {
  const hit = guess.filter((g) => actual.includes(g)).length;
  const exact = hit === actual.length && guess.length === actual.length;
  if (exact) {
    const res = scoreJob(true, onSiteMin, measurements, rep);
    if (actual.length > 1) {
      res.pay = Math.round(res.pay * 1.25);
      res.notes.push('Obe okvari najdeni: ×1,25');
    }
    return { ...res, level: 'ok' };
  }
  if (hit > 0) {
    const res = scoreJob(true, onSiteMin, measurements, rep);
    return {
      correct: false,
      pay: Math.round(res.pay * 0.5),
      repDelta: 0,
      notes: [actual.length > guess.length ? 'Delno: našel si eno od dveh okvar – stranka bo poklicala znova. ×0,5' : 'Delno: ena diagnoza je bila odveč – nepotreben del. ×0,5'],
      level: 'partial',
    };
  }
  return { ...scoreJob(false, onSiteMin, measurements, rep), level: 'wrong' };
}

/** Kupček okvar: vsaka enkrat v naključnem vrstnem redu, nato nov kupček. */
export function shuffledDeck(seed: number): FaultId[] {
  const r = rng(seed);
  const d = [...FAULT_IDS];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(r.next() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}
/** Klic podpore izključi 5 napačnih možnosti (nikoli nobene od dejanskih okvar). */
/**
 * Skupina zamenljivih okvar za vajo: izbrana okvara, okvara, s katero jo je lahko zamenjati,
 * in vse okvare, ki jih je lahko zamenjati z njo. Izbrana je vedno prva.
 */
export function practiceGroup(target: FaultId, confuse: Record<string, FaultId>): FaultId[] {
  const g = [target];
  const add = (f: FaultId | undefined) => {
    if (f && FAULT_IDS.includes(f) && !g.includes(f)) g.push(f);
  };
  add(confuse[target]);
  for (const f of FAULT_IDS) if (confuse[f] === target) add(f);
  return g;
}

/** Naključna okvara iz skupine; če je mogoče, ne ista kot prejšnjič. */
export function pickPractice(group: FaultId[], last: FaultId | null, seed: number): FaultId {
  const pool = group.length > 1 && last ? group.filter((f) => f !== last) : group;
  return pool[rng(seed).int(0, pool.length - 1)];
}

export function supportEliminate(fault: FaultId | FaultId[], seed: number, n = 5): FaultId[] {
  const actual = Array.isArray(fault) ? fault : [fault];
  const r = rng(seed ^ 0x5bd1e995);
  const wrong = FAULT_IDS.filter((f) => !actual.includes(f));
  for (let i = wrong.length - 1; i > 0; i--) {
    const j = Math.floor(r.next() * (i + 1));
    [wrong[i], wrong[j]] = [wrong[j], wrong[i]];
  }
  return wrong.slice(0, n);
}
