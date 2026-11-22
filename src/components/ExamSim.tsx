import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import './exam-sim.css';

export interface ExamQuestion {
  id: string;
  topic: string;
  text: string;
  options: { text: string; correct?: boolean }[];
  explain: string;
}
export interface ExamTopic {
  id: string;
  label: string;
  link: string;
  /** Število vprašanj te teme na pisnem izpitu (0 = samo praktični del ali samo vaja). */
  exam?: number;
  /** Skupina, za katero velja prag 50 % (poglavja iz izpitnega kataloga). */
  group?: string;
  /** Poglavje v izpitnem katalogu. */
  ref?: string;
}
export interface ExamGroup {
  id: string;
  label: string;
}
interface Props {
  questions: ExamQuestion[];
  topics: ExamTopic[];
  groups?: ExamGroup[];
  /** Minute za pisni del. */
  minutes?: number;
}

type Item = { q: ExamQuestion; order: number[] };
type Mode = 'home' | 'exam' | 'practice' | 'result';
type Saved = { history: { at: number; score: number; total: number }[]; wrong: string[] };

const KEY = 'akademija-tc:f-plini-izpit';
function load(): Saved {
  try {
    return { history: [], wrong: [], ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { history: [], wrong: [] };
  }
}
function store(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* brez shranjevanja */
  }
}
function shuffle<T>(a: T[]): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
const mkItems = (qs: ExamQuestion[]): Item[] => qs.map((q) => ({ q, order: shuffle(q.options.map((_, i) => i)) }));
const correctSet = (q: ExamQuestion) => q.options.flatMap((o, i) => (o.correct ? [i] : []));
/** Točka samo, če so označeni natanko vsi pravilni odgovori – napačen ali manjkajoč odgovor = 0. */
const isRight = (q: ExamQuestion, sel: number[] | undefined) => {
  if (!sel || sel.length === 0) return false;
  const c = correctSet(q);
  return sel.length === c.length && c.every((i) => sel.includes(i));
};
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const pctOf = (ok: number, n: number) => (n ? Math.round((100 * ok) / n) : 0);

/** Pisni izpit: iz vsake teme toliko naključnih vprašanj, kot jih ima tema na izpitu. */
function drawExam(questions: ExamQuestion[], topics: ExamTopic[]): ExamQuestion[] {
  const picked = topics.flatMap((t) => shuffle(questions.filter((q) => q.topic === t.id)).slice(0, t.exam ?? 0));
  return shuffle(picked);
}

export default function ExamSim({ questions, topics, groups = [], minutes = 90 }: Props) {
  const [saved, setSaved] = useState<Saved>({ history: [], wrong: [] });
  const [mode, setMode] = useState<Mode>('home');
  const [items, setItems] = useState<Item[]>([]);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(0);
  const [kind, setKind] = useState<'exam' | 'practice'>('exam');
  const [label, setLabel] = useState('');
  const top = useRef<HTMLDivElement>(null);
  const topicById = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);
  const examSize = useMemo(
    () => topics.reduce((s, t) => s + Math.min(t.exam ?? 0, questions.filter((q) => q.topic === t.id).length), 0),
    [topics, questions],
  );

  useEffect(() => setSaved(load()), []);

  // časovnik izpita
  useEffect(() => {
    if (mode !== 'exam') return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [mode]);
  useEffect(() => {
    if (mode === 'exam' && left <= 0) finish();
  }, [left, mode]);

  const scrollTop = () => top.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });

  function start(k: 'exam' | 'practice', qs: ExamQuestion[], name: string) {
    setKind(k);
    setLabel(name);
    setItems(mkItems(k === 'exam' ? drawExam(qs, topics) : shuffle(qs)));
    setAnswers({});
    setChecked({});
    setIdx(0);
    if (k === 'exam') setLeft(minutes * 60);
    setMode(k);
    scrollTop();
  }

  function finish() {
    const wrong = items.filter((it) => !isRight(it.q, answers[it.q.id])).map((it) => it.q.id);
    const right = items.filter((it) => isRight(it.q, answers[it.q.id])).map((it) => it.q.id);
    const next: Saved = {
      history: kind === 'exam' ? [{ at: Date.now(), score: right.length, total: items.length }, ...saved.history].slice(0, 10) : saved.history,
      wrong: [...new Set([...saved.wrong.filter((id) => !right.includes(id)), ...wrong])],
    };
    store(next);
    setSaved(next);
    setMode('result');
    scrollTop();
  }

  const toggle = (qid: string, optIdx: number) => {
    if (mode === 'practice' && checked[qid]) return; // v vaji po »Preveri« odgovor velja
    setAnswers((a) => {
      const cur = a[qid] ?? [];
      return { ...a, [qid]: cur.includes(optIdx) ? cur.filter((i) => i !== optIdx) : [...cur, optIdx] };
    });
  };
  const nAnswered = Object.values(answers).filter((a) => a.length > 0).length;
  const confirmSubmit = () => nAnswered >= items.length || confirm(`Odgovoril si na ${nAnswered} od ${items.length} vprašanj. Oddam izpit?`);

  // ---------- začetek ----------
  if (mode === 'home') {
    const best = saved.history.reduce((b, h) => Math.max(b, pctOf(h.score, h.total)), 0);
    const wrongQs = questions.filter((q) => saved.wrong.includes(q.id));
    return (
      <div class="ex" ref={top}>
        <div class="ex-card ex-main">
          <p class="eyebrow">Simulacija pisnega izpita</p>
          <h3>
            {examSize} vprašanj · {minutes} minut
          </h3>
          <p>
            Razporeditev po temah kot v izpitnem katalogu. Pri vsakem vprašanju je lahko pravilnih več odgovorov – točko dobiš samo, če označiš vse pravilne in nobenega
            napačnega. Rezultat se pokaže šele na koncu.
          </p>
          <button type="button" class="btn wide" onClick={() => start('exam', questions, 'Simulacija izpita')}>
            Začni izpit
          </button>
          {saved.history.length > 0 && (
            <p class="ex-hist">
              Najboljši rezultat: <strong>{best} %</strong> · poskusov: {saved.history.length}
            </p>
          )}
        </div>

        {wrongQs.length > 0 && (
          <button type="button" class="ex-card ex-wrong" onClick={() => start('practice', wrongQs, 'Ponovi napačne')}>
            <strong>Ponovi napačne ({wrongQs.length})</strong>
            <span>Vprašanja, ki si jih zgrešil. Ko odgovoriš prav, izginejo s seznama.</span>
          </button>
        )}

        <div class="ex-card">
          <p class="eyebrow">Vaja po temah</p>
          <p>Označi odgovore in klikni »Preveri« – razlaga se pokaže takoj.</p>
          <div class="ex-topics">
            <button type="button" onClick={() => start('practice', questions, 'Vse teme')}>
              Vse teme <span>{questions.length}</span>
            </button>
            {topics.map((t) => {
              const qs = questions.filter((q) => q.topic === t.id);
              return (
                <button key={t.id} type="button" onClick={() => start('practice', qs, t.label)}>
                  <span class="ex-tl">
                    {t.label}
                    <small>{t.exam ? `${t.exam} na izpitu` : 'praktični del – ni v pisnem izpitu'}</small>
                  </span>
                  <span>{qs.length}</span>
                </button>
              );
            })}
          </div>
        </div>
        <p class="muted ex-note">
          Vprašanja so v slogu izpita, niso uradna izpitna vprašanja. Število vprašanj, čas in meje ocenjevanja so iz izpitnega kataloga za program A (2016); pravi izpit
          ima tudi odprta vprašanja in praktični del.
        </p>
      </div>
    );
  }

  // ---------- rezultat ----------
  if (mode === 'result') {
    const right = items.filter((it) => isRight(it.q, answers[it.q.id])).length;
    const pct = pctOf(right, items.length);
    const byTopic = topics
      .map((t) => {
        const its = items.filter((it) => it.q.topic === t.id);
        return { t, n: its.length, ok: its.filter((it) => isRight(it.q, answers[it.q.id])).length };
      })
      .filter((x) => x.n > 0);
    const byGroup = groups
      .map((g) => {
        const its = items.filter((it) => topicById.get(it.q.topic)?.group === g.id);
        return { g, n: its.length, ok: its.filter((it) => isRight(it.q, answers[it.q.id])).length };
      })
      .filter((x) => x.n > 0);
    const weakGroups = byGroup.filter((x) => x.ok / x.n < 0.5);
    // meje iz izpitnega kataloga A: nad 60 % in vsaj 50 % v vsaki skupini = brez zagovora; 50–60 % = ustni zagovor; pod 50 % = ponovno
    const verdict =
      kind !== 'exam'
        ? null
        : pct > 60 && weakGroups.length === 0
          ? { cls: 'ok', head: 'Opravljeno brez ustnega zagovora', text: 'Nad 60 % in vsaj 50 % v vsaki skupini poglavij – lahko greš na praktični del.' }
          : pct >= 50
            ? {
                cls: 'mid',
                head: 'Ustni zagovor',
                text:
                  pct > 60
                    ? `Skupaj nad 60 %, a pod 50 % v skupini: ${weakGroups.map((x) => x.g.label).join(', ')}. Na zagovoru dobiš vprašanja iz najšibkejših vsebin.`
                    : 'Med 50 in 60 %: na zagovoru dobiš odprta vprašanja iz vsebin, kjer si bil najslabši.',
              }
            : { cls: 'bad', head: 'Pisni del ni opravljen', text: 'Pod 50 % – pisni del bi ponavljal. Najprej vadi šibke teme.' };
    const wrong = items.filter((it) => !isRight(it.q, answers[it.q.id]));
    const optList = (q: ExamQuestion, idxs: number[]) => idxs.map((i) => q.options[i].text).join(' · ');
    return (
      <div class="ex" ref={top}>
        <div class={`ex-card ex-score ${verdict ? verdict.cls : pct >= 60 ? 'ok' : 'bad'}`}>
          <p class="eyebrow">{label}</p>
          <p class="ex-pct">{pct} %</p>
          <p>
            {right} od {items.length} pravilnih{verdict ? '' : ' · vaja končana'}
          </p>
          {verdict && (
            <p class="ex-verdict">
              <strong>{verdict.head}.</strong> {verdict.text}
            </p>
          )}
        </div>

        {kind === 'exam' && byGroup.length > 0 && (
          <div class="ex-card">
            <h3>Po skupinah poglavij</h3>
            <p class="muted ex-small">Za izpit brez zagovora potrebuješ vsaj 50 % v vsaki skupini.</p>
            <ul class="ex-bars">
              {byGroup.map(({ g, n, ok }) => (
                <li key={g.id}>
                  <div class="ex-bar-top">
                    <span>{g.label}</span>
                    <span>
                      {ok}/{n} · {pctOf(ok, n)} %
                    </span>
                  </div>
                  <div class="ex-bar ex-bar-mark">
                    <span class={ok / n >= 0.5 ? 'ok' : 'bad'} style={{ width: `${(100 * ok) / n}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div class="ex-card">
          <h3>Po temah</h3>
          <ul class="ex-bars">
            {byTopic.map(({ t, n, ok }) => (
              <li key={t.id}>
                <div class="ex-bar-top">
                  <a href={`#${t.link}`}>{t.label}</a>
                  <span>
                    {ok}/{n}
                  </span>
                </div>
                <div class="ex-bar">
                  <span class={ok / n >= 0.5 ? 'ok' : 'bad'} style={{ width: `${(100 * ok) / n}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {wrong.length > 0 && (
          <div class="ex-card">
            <h3>Napačni odgovori ({wrong.length})</h3>
            <ol class="ex-review">
              {wrong.map((it) => {
                const a = answers[it.q.id] ?? [];
                return (
                  <li key={it.q.id}>
                    <p class="ex-q">{it.q.text}</p>
                    <p class="ex-yours">Tvoj odgovor: {a.length === 0 ? '— brez odgovora' : optList(it.q, a)}</p>
                    <p class="ex-right">Pravilno: {optList(it.q, correctSet(it.q))}</p>
                    <p class="ex-explain">{it.q.explain}</p>
                    <a href={`#${topicById.get(it.q.topic)?.link}`}>Preberi snov →</a>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <div class="ex-actions">
          {wrong.length > 0 && (
            <button type="button" class="btn" onClick={() => start('practice', wrong.map((w) => w.q), 'Ponovi napačne')}>
              Ponovi napačne
            </button>
          )}
          <button type="button" class="btn secondary" onClick={() => start('exam', questions, 'Simulacija izpita')}>
            Nov izpit
          </button>
          <button type="button" class="btn ghost" onClick={() => setMode('home')}>
            Nazaj
          </button>
        </div>
      </div>
    );
  }

  // ---------- vprašanje (izpit ali vaja) ----------
  const it = items[idx];
  const chosen = answers[it.q.id] ?? [];
  const isChecked = mode === 'practice' && !!checked[it.q.id];
  const cs = correctSet(it.q);
  const ok = isRight(it.q, chosen);
  const last = idx === items.length - 1;
  const t = topicById.get(it.q.topic);
  return (
    <div class="ex" ref={top}>
      <div class="ex-bar-head">
        <span>
          {mode === 'exam' ? 'Izpit' : label} · {idx + 1}/{items.length}
        </span>
        {mode === 'exam' && <span class={`ex-timer ${left < 300 ? 'low' : ''}`}>⏱ {mmss(Math.max(0, left))}</span>}
      </div>
      <div class="ex-progress">
        <span style={{ width: `${(100 * (idx + 1)) / items.length}%` }} />
      </div>

      <div class="ex-card ex-qcard">
        <p class="eyebrow">{t?.label}</p>
        <p class="ex-q" id={`q-${it.q.id}`}>
          {it.q.text}
        </p>
        <p class="ex-hint">Označi vse pravilne odgovore.</p>
        <div class="ex-opts" role="group" aria-labelledby={`q-${it.q.id}`}>
          {it.order.map((oi, k) => {
            const sel = chosen.includes(oi);
            const right = cs.includes(oi);
            const state = isChecked ? (right && sel ? 'right' : right ? 'missed' : sel ? 'wrong' : 'dim') : sel ? 'sel' : '';
            return (
              <button key={oi} type="button" role="checkbox" aria-checked={sel} class={`ex-opt ${state}`} onClick={() => toggle(it.q.id, oi)}>
                <span class="ex-letter">{LETTERS[k]}</span>
                <span>{it.q.options[oi].text}</span>
              </button>
            );
          })}
        </div>
        {isChecked && (
          <div class={`ex-fb ${ok ? 'ok' : 'bad'}`} aria-live="polite">
            <strong>{ok ? '✓ Pravilno' : cs.length > 1 && chosen.every((i) => cs.includes(i)) ? '✗ Manjka pravilen odgovor – 0 točk' : '✗ Napačno – 0 točk'}</strong>
            {cs.length > 1 && <p>Pravilnih je {cs.length}: {cs.map((i) => it.q.options[i].text).join(' · ')}</p>}
            <p>{it.q.explain}</p>
            {t?.ref && <p class="ex-ref">Izpitni katalog: {t.ref}</p>}
          </div>
        )}
      </div>

      <div class="ex-nav">
        <button type="button" class="btn secondary" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
          ←
        </button>
        {mode === 'practice' && !isChecked ? (
          <button type="button" class="btn" disabled={chosen.length === 0} onClick={() => setChecked((c) => ({ ...c, [it.q.id]: true }))}>
            Preveri
          </button>
        ) : last ? (
          <button
            type="button"
            class="btn"
            onClick={() => {
              if (mode === 'exam' && !confirmSubmit()) return;
              finish();
            }}
          >
            {mode === 'exam' ? 'Oddaj izpit' : 'Končaj'}
          </button>
        ) : (
          <button type="button" class="btn" onClick={() => setIdx(idx + 1)}>
            Naprej →
          </button>
        )}
      </div>

      {mode === 'exam' && (
        <details class="ex-map">
          <summary>
            Pregled vprašanj · odgovorjenih {nAnswered}/{items.length}
          </summary>
          <div class="ex-grid">
            {items.map((x, i) => (
              <button key={x.q.id} type="button" class={`${(answers[x.q.id] ?? []).length ? 'done' : ''} ${i === idx ? 'cur' : ''}`} onClick={() => setIdx(i)}>
                {i + 1}
              </button>
            ))}
          </div>
          <button
            type="button"
            class="btn secondary wide"
            onClick={() => {
              if (!confirmSubmit()) return;
              finish();
            }}
          >
            Oddaj izpit zdaj
          </button>
        </details>
      )}
      <button type="button" class="ex-quit" onClick={() => (mode === 'practice' || confirm('Prekinem izpit? Rezultat se ne shrani.')) && setMode('home')}>
        {mode === 'exam' ? 'Prekini izpit' : 'Nazaj na izbiro'}
      </button>
    </div>
  );
}
