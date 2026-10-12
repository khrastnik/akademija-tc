// Napredek živi samo v brskalniku (localStorage). Vsak dostop je v try/catch:
// v zasebnem oknu ali z blokiranimi podatki strani stran deluje naprej, le brez shranjevanja.

export const SCHEMA_VERSION = 1;
const KEY = 'akademija-tc:napredek';
const DAY = 24 * 60 * 60 * 1000;
/** Ponavljanje napačnih vprašanj po 1, 3 in 7 dneh. */
export const REVIEW_STEPS_DAYS = [1, 3, 7];

export interface Progress {
  v: number;
  lessons: Record<string, { card: number; done: boolean; at: number }>;
  answers: Record<string, { correct: boolean; at: number }>;
  review: Record<string, { step: number; due: number }>;
  skipped: Record<string, boolean>;
  xp: number;
  last?: string;
}

const empty = (): Progress => ({ v: SCHEMA_VERSION, lessons: {}, answers: {}, review: {}, skipped: {}, xp: 0 });

let memory: Progress | null = null;

export function load(): Progress {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(KEY);
    memory = raw ? migrate(JSON.parse(raw)) : empty();
  } catch {
    memory = empty();
  }
  return memory;
}

function migrate(data: any): Progress {
  if (!data || typeof data !== 'object') return empty();
  // Ko se shema spremeni, tu dodaj pretvorbo iz starejše različice.
  return { ...empty(), ...data, v: SCHEMA_VERSION };
}

export function save(p: Progress) {
  memory = p;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* shranjevanje ni na voljo – napredek velja do zaprtja zavihka */
  }
}

export function update(fn: (p: Progress) => void) {
  const p = load();
  fn(p);
  save(p);
  return p;
}

export function setCard(lessonId: string, card: number) {
  update((p) => {
    const l = (p.lessons[lessonId] ??= { card: 0, done: false, at: Date.now() });
    l.card = card;
    l.at = Date.now();
    p.last = lessonId;
  });
}

export function completeLesson(lessonId: string) {
  update((p) => {
    const l = (p.lessons[lessonId] ??= { card: 0, done: false, at: Date.now() });
    if (!l.done) p.xp += 10; // branje da malo, vaje več, kvizi največ
    l.done = true;
    l.at = Date.now();
    p.last = lessonId;
  });
}

/** Zabeleži odgovor. Napačen gre v »Za ponovitev«, pravilen v ponovitvi napreduje 1 → 3 → 7 dni. */
export function recordAnswer(key: string, correct: boolean, fromReview = false) {
  update((p) => {
    const first = !p.answers[key];
    p.answers[key] = { correct, at: Date.now() };
    if (correct && first) p.xp += 5;
    const r = p.review[key];
    if (!correct) {
      p.review[key] = { step: 0, due: Date.now() + REVIEW_STEPS_DAYS[0] * DAY };
    } else if (r && fromReview) {
      const step = r.step + 1;
      if (step >= REVIEW_STEPS_DAYS.length) delete p.review[key];
      else p.review[key] = { step, due: Date.now() + REVIEW_STEPS_DAYS[step] * DAY };
    }
  });
}

export function dueReviews(now = Date.now()) {
  return Object.entries(load().review)
    .filter(([, r]) => r.due <= now)
    .map(([key]) => key);
}

export function exportJson() {
  return JSON.stringify({ app: 'akademija-tc', exported: new Date().toISOString(), progress: load() }, null, 2);
}

export function importJson(text: string) {
  const data = JSON.parse(text);
  if (data?.app !== 'akademija-tc' || !data.progress) throw new Error('To ni datoteka z napredkom Akademije TČ.');
  save(migrate(data.progress));
}

export function storageAvailable() {
  try {
    const k = KEY + ':test';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}
