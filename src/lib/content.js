// Nalaganje in preverjanje vsebine iz content/ in data/.
// Uporabljata ga build (Astro strani) in scripts/validate.mjs, zato je čisti JS brez Vite posebnosti.
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

export const ROOT = process.cwd();

/** Vrstni red in pomen 12 kartic ene lekcije (PRD: Format ene lekcije). */
export const CARD_TYPES = [
  { type: 'goal', title: 'Kaj se bomo naučili' },
  { type: 'story', title: 'Zgodba' },
  { type: 'what', title: 'Kaj je to' },
  { type: 'imagine', title: 'Predstavljaj si' },
  { type: 'why', title: 'Zakaj je tako' },
  { type: 'widget', title: 'Poskusi sam' },
  { type: 'numbers', title: 'Številke' },
  { type: 'measure', title: 'Kako izmeriš' },
  { type: 'field-error', title: 'Tipična napaka' },
  { type: 'remember', title: 'Zapomni si' },
  { type: 'quiz', title: 'Mini kviz' },
  { type: 'next', title: 'Povzetek in kaj sledi' },
];
const CARD_TYPE_IDS = CARD_TYPES.map((c) => c.type);

export const LIMITS = { cardWords: 120, storyWords: 160, tableRows: 3, tableCols: 4 };

// ---------- sheme ----------

const id = z.string().regex(/^[a-z0-9-]+$/, 'id sme vsebovati le male črke, številke in -');

export const moduleSchema = z.object({
  id: z.string().regex(/^m\d{2}$/),
  number: z.number().int().min(0).max(21),
  title: z.string().min(3),
  phase: z.string(),
  goal: z.string().min(10),
  dir: z.string().optional(),
});

export const lessonFrontmatterSchema = z.object({
  id: z.string().regex(/^m\d{2}-l\d{2}$/),
  module: z.string().regex(/^m\d{2}$/),
  title: z.string().min(3),
  level: z.enum(['L1', 'L2', 'L3', 'L4', 'L5']),
  minutes: z.number().int().min(3).max(15),
  buildsOn: z.array(z.string()).default([]),
  terms: z.array(id).default([]),
  updated: z.union([z.string(), z.date()]).transform((d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d)),
  reviewed: z.boolean().default(false),
  /** Kdo je lekcijo strokovno pregledal – obvezno, če je reviewed: true. */
  reviewedBy: z.string().min(5).optional(),
  sources: z.array(z.object({ title: z.string(), url: z.string().url().optional() })).default([]),
});

const optionSchema = z.object({
  id,
  text: z.string().min(1),
  correct: z.boolean().optional(),
  why: z.string({ error: 'vsak odgovor potrebuje razlago (why)' }).min(10),
});

const questionSchema = z.object({
  id,
  type: z.enum(['single', 'truefalse']),
  text: z.string().min(5),
  understand: z.object(
    {
      simpler: z.string().min(5),
      terms: z.array(id).default([]),
      hint: z.string().min(5),
    },
    { error: 'vsako vprašanje potrebuje »Razumem vprašanje« (understand)' },
  ),
  options: z.array(optionSchema).min(2).max(4),
  lessonLink: z.string({ error: 'vsako vprašanje potrebuje povezavo na lekcijo (lessonLink)' }),
});

export const quizSchema = z.object({
  id: z.string(),
  lesson: z.string(),
  questions: z.array(questionSchema).min(3).max(15),
});

export const termSchema = z.object({
  id,
  sl: z.string(),
  en: z.string(),
  abbr: z.string().optional(),
  kratkaRazlaga: z.string().min(5),
  dolgaRazlaga: z.string().min(10),
  analogija: z.string().optional(),
  povezaneLekcije: z.array(z.string()).default([]),
});

const refrigerantSchema = z.object({
  id: z.string(),
  name: z.string(),
  source: z.string({ error: 'vsaka številka potrebuje vir' }).min(5),
  safety: z.string().optional(),
  points: z.array(z.object({ tC: z.number(), pBarAbs: z.number(), pDewBarAbs: z.number().optional() })).min(2),
});
export const refrigerantsSchema = z.object({ refrigerants: z.array(refrigerantSchema) });

// ---------- branje ----------

const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const exists = (...p) => fs.existsSync(path.join(ROOT, ...p));
const listFiles = (dir, ext) =>
  exists(dir)
    ? fs
        .readdirSync(path.join(ROOT, dir))
        .filter((f) => f.endsWith(ext))
        .sort()
    : [];

/** Razbije Markdown z YAML glavo. */
export function splitFrontmatter(raw) {
  const m = raw.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('manjka YAML glava (---)');
  return { data: parseYaml(m[1]), body: m[2] };
}

/** `type=widget id=sh-calc` -> { type: 'widget', id: 'sh-calc' } */
function parseAttrs(s) {
  const out = {};
  for (const m of s.matchAll(/([a-zA-Z-]+)=("([^"]*)"|[^\s}]+)/g)) out[m[1]] = m[3] ?? m[2];
  return out;
}

/** Razreže telo lekcije na kartice po vrsticah `::card{...}` in `::quiz{...}`. */
export function parseCards(body) {
  const cards = [];
  let current = null;
  for (const line of body.split(/\r?\n/)) {
    const d = line.match(/^::(card|quiz)\{([^}]*)\}\s*$/);
    if (d) {
      const attrs = parseAttrs(d[2]);
      current = d[1] === 'quiz' ? { type: 'quiz', attrs, md: '' } : { type: attrs.type, attrs, md: '' };
      cards.push(current);
    } else if (current) {
      current.md += line + '\n';
    } else if (line.trim()) {
      throw new Error(`besedilo pred prvo kartico: "${line.trim()}"`);
    }
  }
  for (const c of cards) c.md = c.md.trim();
  return cards;
}

/** Besedilo kartice brez Markdown oznak, za štetje besed. */
export function plainText(md) {
  return md
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/[#*_>`|-]/g, ' ');
}
export const wordCount = (md) => plainText(md).split(/\s+/).filter(Boolean).length;

/** Vrne [{ rows, cols }] za vsako Markdown tabelo (rows = podatkovne vrstice brez glave). */
export function tables(md) {
  const out = [];
  let block = [];
  const flush = () => {
    if (block.length >= 2) out.push({ rows: block.length - 2, cols: block[0].split('|').filter((c) => c.trim()).length });
    block = [];
  };
  for (const line of md.split('\n')) {
    if (/^\s*\|/.test(line)) block.push(line);
    else flush();
  }
  flush();
  return out;
}

export const termRefs = (md) => [...md.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)].map((m) => m[1].trim());

export function loadModules() {
  return z.array(moduleSchema).parse(parseYaml(read('content', 'modules', 'modules.yaml')));
}

export function loadGlossary() {
  return listFiles('content/glossary', '.yaml').flatMap((f) => {
    const parsed = z.array(termSchema).safeParse(parseYaml(read('content', 'glossary', f)));
    if (!parsed.success) throw new Error(`content/glossary/${f}: ${formatZod(parsed.error)}`);
    return parsed.data;
  });
}

export function loadQuizzes() {
  return listFiles('content/quizzes', '.yaml').map((f) => {
    const parsed = quizSchema.safeParse(parseYaml(read('content', 'quizzes', f)));
    if (!parsed.success) throw new Error(`content/quizzes/${f}: ${formatZod(parsed.error)}`);
    return { ...parsed.data, file: `content/quizzes/${f}` };
  });
}

export function loadLessons() {
  const lessons = [];
  for (const mod of loadModules()) {
    if (!mod.dir) continue;
    const dir = `content/modules/${mod.dir}`;
    for (const f of listFiles(dir, '.md')) {
      const file = `${dir}/${f}`;
      const { data, body } = splitFrontmatter(read(file));
      const parsed = lessonFrontmatterSchema.safeParse(data);
      if (!parsed.success) throw new Error(`${file}: ${formatZod(parsed.error)}`);
      lessons.push({ ...parsed.data, file, cards: parseCards(body) });
    }
  }
  return lessons;
}

const widgetSchema = z.object({
  id,
  kind: z.literal('sort'),
  groups: z.array(z.object({ id, label: z.string() })).min(2).max(4),
  items: z.array(z.object({ id, text: z.string(), group: id, why: z.string().min(10) })).min(3),
});

export function loadWidgets() {
  return listFiles('content/widgets', '.yaml').map((f) => {
    const parsed = widgetSchema.safeParse(parseYaml(read('content', 'widgets', f)));
    if (!parsed.success) throw new Error(`content/widgets/${f}: ${formatZod(parsed.error)}`);
    return parsed.data;
  });
}

const simSchema = {
  parts: z.array(
    z.object({ id, group: z.enum(['hladivo', 'voda', 'krmiljenje']), name: z.string(), en: z.string(), where: z.string(), what: z.string().min(20), analogy: z.string(), faults: z.array(z.string()), step: z.number().int().min(1).max(4).optional() }),
  ),
};

/** Vsebina 3D simulatorja: deli naprave. (Igra z diagnostiko je na strani Teren – content/teren.) */
export function loadSim() {
  const out = {};
  for (const [key, schema] of Object.entries(simSchema)) {
    const parsed = schema.safeParse(parseYaml(read('content', 'sim', `${key}.yaml`)));
    if (!parsed.success) throw new Error(`content/sim/${key}.yaml: ${formatZod(parsed.error)}`);
    out[key] = parsed.data;
  }
  return /** @type {{parts: any[]}} */ (out);
}

// ---------- okvare in popravila delov ----------
const WHO = ['lastnik', 'serviser', 'elektro', 'spricevalo'];
const repairSchema = z.array(
  z.object({
    part: id,
    who: z.array(z.enum(WHO)).min(1),
    procedure: z.enum(['hladivo', 'voda']).optional(),
    causes: z.array(z.string().min(10)).min(1),
    effects: z.array(z.string().min(10)).min(1),
    fix: z.array(z.string().min(10)).min(1),
    verify: z.string().min(10),
    prevent: z.string().min(5).optional(),
  }),
);
/** Okvare delov: zakaj se pokvari, posledice, popravilo. */
export function loadRepairs() {
  const parsed = repairSchema.safeParse(parseYaml(read('content', 'okvare', 'okvare.yaml')));
  if (!parsed.success) throw new Error(`content/okvare/okvare.yaml: ${formatZod(parsed.error)}`);
  return parsed.data;
}

// ---------- merilna oprema ----------
const toolSchema = z.array(
  z.object({
    id,
    name: z.string(),
    en: z.string(),
    cat: z.enum(['hladivo', 'temperatura', 'elektrika', 'voda']),
    who: z.array(z.enum(WHO)).min(1),
    measures: z.string().min(20),
    where: z.array(z.string().min(10)).min(1),
    how: z.array(z.string().min(10)).min(2),
    mistakes: z.array(z.string().min(10)).min(1),
    lessons: z.array(z.string()).default([]),
  }),
);
/** Merilna oprema: kaj meri, kje in kako. */
export function loadTools() {
  const parsed = toolSchema.safeParse(parseYaml(read('content', 'oprema', 'oprema.yaml')));
  if (!parsed.success) throw new Error(`content/oprema/oprema.yaml: ${formatZod(parsed.error)}`);
  return parsed.data;
}

// ---------- igra Teren ----------
const terenSchema = z.object({
  faults: z
    .array(
      z.object({
        id,
        name: z.string(),
        complaints: z.array(z.string().min(10)).min(2),
        indicators: z.array(z.string().min(5)).length(3),
        why: z.string().min(20),
        fix: z.string().min(10),
      }),
    )
    .min(5),
  models: z.array(z.string()).min(3),
  customers: z.array(z.string()).min(5),
  places: z.array(z.string()).min(5),
  generic: z.object({ complaints: z.array(z.string().min(10)).min(2), faults: z.array(id) }),
});
const ucenjeSchema = z.object({
  faults: z.record(
    id,
    z.object({
      steps: z.array(z.string().min(10)).min(2),
      confuse: z.object({ with: id, how: z.string().min(20) }),
      also: z.array(id).default([]),
      proof: z.array(id).min(1),
      lessons: z.array(z.string()).min(1),
      parts: z.array(id).min(1),
    }),
  ),
  meanings: z.record(id, z.object({ high: z.string().min(10).optional(), low: z.string().min(10).optional() })),
});
/** Učni del igre »Teren«: pot do diagnoze, zamenjave, pomen meritev. */
export function loadTerenUcenje() {
  const parsed = ucenjeSchema.safeParse(parseYaml(read('content', 'teren', 'ucenje.yaml')));
  if (!parsed.success) throw new Error(`content/teren/ucenje.yaml: ${formatZod(parsed.error)}`);
  return parsed.data;
}

/** Besedila igre »Teren«: okvare, stranke, kraji, izmišljeni modeli. */
export function loadTeren() {
  const parsed = terenSchema.safeParse(parseYaml(read('content', 'teren', 'teren.yaml')));
  if (!parsed.success) throw new Error(`content/teren/teren.yaml: ${formatZod(parsed.error)}`);
  return parsed.data;
}

// ---------- kode napak proizvajalcev ----------
const codesSchema = z.object({
  brands: z.array(
    z.object({
      id,
      name: z.string(),
      series: z.string(),
      note: z.string().optional(),
      sources: z.array(z.string().url()).min(1, 'vsak proizvajalec potrebuje vsaj en vir'),
      codes: z
        .array(
          z.object({
            code: z.coerce.string(),
            meaning: z.string().min(8),
            sure: z.enum(['potrjeno', 'model']),
            who: z.enum(WHO),
            check: z.array(z.string().min(5)).min(1),
            parts: z.array(id).default([]),
          }),
        )
        .min(1),
    }),
  ),
  pending: z.array(z.object({ name: z.string(), reason: z.string() })).default([]),
});
/** Kode napak – samo tiste, ki jih potrjuje vir. */
export function loadCodes() {
  const parsed = codesSchema.safeParse(parseYaml(read('content', 'kode', 'kode.yaml')));
  if (!parsed.success) throw new Error(`content/kode/kode.yaml: ${formatZod(parsed.error)}`);
  return parsed.data;
}

// ---------- priprava na izpit za F-pline ----------
const fgasSchema = z.object({
  topics: z
    .array(
      z.object({
        id,
        title: z.string(),
        summary: z.string().min(20),
        points: z.array(z.string().min(5)).min(2),
        lessons: z.array(z.string()).default([]),
      }),
    )
    .min(3),
  practical: z.array(z.object({ id, title: z.string(), steps: z.array(z.string().min(5)).min(2), why: z.string().min(10) })).min(2),
  quiz: z.array(questionSchema).min(5).max(20),
});
const examSchema = z.object({
  topics: z.array(z.object({ id, label: z.string(), link: id })).min(3),
  questions: z
    .array(
      z.object({
        id,
        topic: id,
        text: z.string().min(8),
        options: z.array(z.object({ text: z.string().min(1), correct: z.boolean().optional() })).min(3).max(4),
        explain: z.string().min(20),
      }),
    )
    .min(20),
});
/** Banka vprašanj v slogu izpita F-plini (ni uradna). */
export function loadFgasExam() {
  const parsed = examSchema.safeParse(parseYaml(read('content', 'f-plini', 'izpit.yaml')));
  if (!parsed.success) throw new Error(`content/f-plini/izpit.yaml: ${formatZod(parsed.error)}`);
  return parsed.data;
}

/** Snov, praktični koraki in vaja za izpit iz ravnanja s F-plini. */
export function loadFgas() {
  const parsed = fgasSchema.safeParse(parseYaml(read('content', 'f-plini', 'f-plini.yaml')));
  if (!parsed.success) throw new Error(`content/f-plini/f-plini.yaml: ${formatZod(parsed.error)}`);
  return parsed.data;
}

export function loadRefrigerants() {
  return refrigerantsSchema.parse(JSON.parse(read('data', 'refrigerants.json'))).refrigerants;
}

function formatZod(err) {
  return err.issues.map((i) => `${i.path.join('.') || '(koren)'}: ${i.message}`).join('; ');
}

/** "m00-l01" -> "0.1" */
export const lessonNumber = (lessonId) => {
  const [, m, l] = lessonId.match(/^m(\d{2})-l(\d{2})$/);
  return `${Number(m)}.${Number(l)}`;
};

// ---------- pravila PRD, ki jih build uveljavi ----------

/** Vrne seznam napak. Prazen seznam = vsebina je objavljiva. */
export function validateContent() {
  const errors = [];
  const tryLoad = (fn, fallback) => {
    try {
      return fn();
    } catch (e) {
      errors.push(e.message);
      return fallback;
    }
  };

  const modules = tryLoad(loadModules, []);
  const glossary = tryLoad(loadGlossary, []);
  const quizzes = tryLoad(loadQuizzes, []);
  const lessons = tryLoad(loadLessons, []);
  const widgets = tryLoad(loadWidgets, []);
  tryLoad(loadRefrigerants, []);
  const sim = tryLoad(loadSim, { parts: [] });
  const widgetIds = new Set(widgets.map((w) => w.id));
  for (const w of widgets)
    for (const it of w.items)
      if (!w.groups.some((g) => g.id === it.group)) errors.push(`content/widgets/${w.id}.yaml: "${it.id}" ima neznano skupino "${it.group}"`);

  const termIds = new Set();
  for (const t of glossary) {
    if (termIds.has(t.id)) errors.push(`slovar: podvojen pojem "${t.id}"`);
    termIds.add(t.id);
  }
  const lessonIds = new Set(lessons.map((l) => l.id));
  const moduleIds = new Set(modules.map((m) => m.id));
  const quizById = new Map(quizzes.map((q) => [q.id, q]));

  if (modules.length !== 22) errors.push(`modules.yaml: pričakujem 22 modulov (0–21), najdenih ${modules.length}`);

  for (const t of glossary)
    for (const l of t.povezaneLekcije)
      if (!lessonIds.has(l)) errors.push(`slovar "${t.id}": povezana lekcija "${l}" ne obstaja`);

  for (const lesson of lessons) {
    const at = lesson.file;
    if (!moduleIds.has(lesson.module)) errors.push(`${at}: modul "${lesson.module}" ne obstaja`);
    if (lesson.reviewed && !lesson.reviewedBy) errors.push(`${at}: reviewed: true zahteva reviewedBy (kdo je pregledal)`);
    if (!lesson.id.startsWith(lesson.module)) errors.push(`${at}: id "${lesson.id}" ne spada v modul "${lesson.module}"`);
    for (const b of lesson.buildsOn) if (!lessonIds.has(b)) errors.push(`${at}: buildsOn "${b}" ne obstaja`);
    for (const t of lesson.terms) if (!termIds.has(t)) errors.push(`${at}: pojem "${t}" ni v slovarju`);

    const types = lesson.cards.map((c) => c.type);
    for (const c of lesson.cards) if (!CARD_TYPE_IDS.includes(c.type)) errors.push(`${at}: neznana vrsta kartice "${c.type}"`);
    const missing = CARD_TYPE_IDS.filter((t) => !types.includes(t));
    if (missing.length) errors.push(`${at}: manjkajo kartice: ${missing.join(', ')}`);
    const order = types.map((t) => CARD_TYPE_IDS.indexOf(t));
    if (order.some((v, i) => i > 0 && v < order[i - 1])) errors.push(`${at}: kartice niso v predpisanem vrstnem redu`);

    for (const c of lesson.cards) {
      const limit = c.type === 'story' ? LIMITS.storyWords : LIMITS.cardWords;
      const words = wordCount(c.md);
      if (words > limit) errors.push(`${at}: kartica "${c.type}" ima ${words} besed (največ ${limit})`);
      for (const tb of tables(c.md))
        if (tb.rows > LIMITS.tableRows || tb.cols > LIMITS.tableCols)
          errors.push(`${at}: tabela v kartici "${c.type}" je ${tb.rows}×${tb.cols} (največ ${LIMITS.tableRows}×${LIMITS.tableCols})`);
      for (const t of termRefs(c.md)) if (!termIds.has(t)) errors.push(`${at}: [[${t}]] ni v slovarju`);
      if (c.type === 'widget' && !widgetIds.has(c.attrs.id)) errors.push(`${at}: vaja "${c.attrs.id}" ne obstaja v content/widgets/`);
      if (c.type === 'quiz') {
        const q = quizById.get(c.attrs.ref);
        if (!q) errors.push(`${at}: kviz "${c.attrs.ref}" ne obstaja`);
        else if (q.lesson !== lesson.id) errors.push(`${at}: kviz "${q.id}" pripada lekciji "${q.lesson}"`);
      }
    }
  }

  for (const quiz of quizzes) {
    const at = quiz.file;
    if (!lessonIds.has(quiz.lesson)) errors.push(`${at}: lekcija "${quiz.lesson}" ne obstaja`);
    for (const q of quiz.questions) {
      const correct = q.options.filter((o) => o.correct).length;
      if (correct !== 1) errors.push(`${at} ${q.id}: pravilen mora biti natanko en odgovor (najdenih ${correct})`);
      if (q.type === 'truefalse' && q.options.length !== 2) errors.push(`${at} ${q.id}: DA/NE vprašanje ima natanko 2 odgovora`);
      for (const t of q.understand.terms) if (!termIds.has(t)) errors.push(`${at} ${q.id}: pojem "${t}" ni v slovarju`);
      const [lessonId, anchor] = q.lessonLink.split('#');
      const target = lessons.find((l) => l.id === lessonId);
      if (!target) errors.push(`${at} ${q.id}: lessonLink "${q.lessonLink}" kaže na neobstoječo lekcijo`);
      else if (anchor && !target.cards.some((c) => c.type === anchor))
        errors.push(`${at} ${q.id}: lessonLink "${q.lessonLink}" kaže na neobstoječo kartico`);
      const lens = q.options.map((o) => o.text.length);
      if (Math.max(...lens) > 3 * Math.min(...lens) + 20)
        errors.push(`${at} ${q.id}: odgovori so preveč različno dolgi (dolžina ne sme izdati pravilnega)`);
    }
  }

  // okvare: vsak del hladilnega in vodnega kroga ima opis okvare, vsak opis pripada obstoječemu delu
  const repairs = tryLoad(loadRepairs, []);
  const partIds = new Set(sim.parts.map((p) => p.id));
  for (const r of repairs) if (!partIds.has(r.part)) errors.push(`content/okvare/okvare.yaml: del "${r.part}" ni v parts.yaml`);
  for (const p of sim.parts)
    if ((p.group === 'hladivo' || p.group === 'voda') && !repairs.some((r) => r.part === p.id))
      errors.push(`content/okvare/okvare.yaml: manjka opis okvare za del "${p.id}"`);
  for (const r of repairs)
    if (r.procedure === 'hladivo' && !r.who.includes('spricevalo'))
      errors.push(`content/okvare/okvare.yaml ${r.part}: poseg v krog hladiva mora imeti oznako "spricevalo"`);

  // kode napak: povezave na obstoječe dele, brez podvojenih kod pri istem proizvajalcu
  const codes = tryLoad(loadCodes, { brands: [], pending: [] });
  const repairIds = new Set(repairs.map((r) => r.part));
  for (const b of codes.brands) {
    const seen = new Set();
    for (const c of b.codes) {
      const at = `content/kode/kode.yaml ${b.id} ${c.code}`;
      if (seen.has(c.code)) errors.push(`${at}: podvojena koda`);
      seen.add(c.code);
      for (const p of c.parts) if (!repairIds.has(p)) errors.push(`${at}: del "${p}" nima opisa na strani okvar`);
    }
  }

  // F-plini: vaja – ista pravila kot kvizi, povezava kaže na temo na strani (#id) ali na lekcijo
  const fgas = tryLoad(loadFgas, { topics: [], practical: [], quiz: [] });
  const topicIds = new Set([...fgas.topics.map((t) => t.id), ...fgas.practical.map((p) => p.id)]);
  for (const t of fgas.topics) for (const l of t.lessons) if (!lessonIds.has(l)) errors.push(`content/f-plini: tema ${t.id} kaže na neobstoječo lekcijo "${l}"`);
  for (const q of fgas.quiz) {
    const at = `content/f-plini/f-plini.yaml ${q.id}`;
    const correct = q.options.filter((o) => o.correct).length;
    if (correct !== 1) errors.push(`${at}: pravilen mora biti natanko en odgovor (najdenih ${correct})`);
    for (const t of q.understand.terms) if (!termIds.has(t)) errors.push(`${at}: pojem "${t}" ni v slovarju`);
    if (q.lessonLink.startsWith('#')) {
      if (!topicIds.has(q.lessonLink.slice(1))) errors.push(`${at}: povezava "${q.lessonLink}" ne kaže na temo`);
    } else if (!lessonIds.has(q.lessonLink.split('#')[0])) errors.push(`${at}: lessonLink "${q.lessonLink}" kaže na neobstoječo lekcijo`);
    const lens = q.options.map((o) => o.text.length);
    if (Math.max(...lens) > 3 * Math.min(...lens) + 20) errors.push(`${at}: odgovori so preveč različno dolgi`);
  }

  // merilna oprema: povezave na obstoječe lekcije, brez podvojenih naprav
  const tools = tryLoad(loadTools, []);
  const toolIds = new Set();
  for (const t of tools) {
    if (toolIds.has(t.id)) errors.push(`content/oprema/oprema.yaml: podvojena naprava "${t.id}"`);
    toolIds.add(t.id);
    for (const l of t.lessons) if (!lessonIds.has(l)) errors.push(`content/oprema/oprema.yaml ${t.id}: lekcija "${l}" ne obstaja`);
  }

  // banka izpitnih vprašanj F-plini
  const exam = tryLoad(loadFgasExam, { topics: [], questions: [] });
  const examTopics = new Set(exam.topics.map((t) => t.id));
  for (const t of exam.topics) if (!topicIds.has(t.link)) errors.push(`content/f-plini/izpit.yaml: tema ${t.id} kaže na neobstoječ razdelek "#${t.link}"`);
  const qIds = new Set();
  for (const q of exam.questions) {
    const at = `content/f-plini/izpit.yaml ${q.id}`;
    if (qIds.has(q.id)) errors.push(`${at}: podvojen id`);
    qIds.add(q.id);
    if (!examTopics.has(q.topic)) errors.push(`${at}: neznana tema "${q.topic}"`);
    const correct = q.options.filter((o) => o.correct).length;
    if (correct !== 1) errors.push(`${at}: pravilen mora biti natanko en odgovor (najdenih ${correct})`);
    const lens = q.options.map((o) => o.text.length);
    if (Math.max(...lens) > 3 * Math.min(...lens) + 20) errors.push(`${at}: odgovori so preveč različno dolgi`);
  }
  for (const t of examTopics) if (exam.questions.filter((q) => q.topic === t).length < 3) errors.push(`content/f-plini/izpit.yaml: tema ${t} ima manj kot 3 vprašanja`);

  return errors;
}
