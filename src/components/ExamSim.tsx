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
}
interface Props {
  questions: ExamQuestion[];
  topics: ExamTopic[];
  /** Število vprašanj in minute v simulaciji izpita. */
  size?: number;
  minutes?: number;
  /** Prag za »opravljeno« v odstotkih – prag te vaje, ne uradni. */
  pass?: number;
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
const correctIdx = (q: ExamQuestion) => q.options.findIndex((o) => o.correct);
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const LETTERS = ['A', 'B', 'C', 'D'];

export default function ExamSim({ questions, topics, size = 30, minutes = 45, pass = 70 }: Props) {
  const [saved, setSaved] = useState<Saved>({ history: [], wrong: [] });
  const [mode, setMode] = useState<Mode>('home');
  const [items, setItems] = useState<Item[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(0);
  const [kind, setKind] = useState<'exam' | 'practice'>('exam');
  const [label, setLabel] = useState('');
  const top = useRef<HTMLDivElement>(null);
  const topicById = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);

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
    setItems(mkItems(k === 'exam' ? shuffle(qs).slice(0, size) : shuffle(qs)));
    setAnswers({});
    setIdx(0);
    if (k === 'exam') setLeft(minutes * 60);
    setMode(k);
    scrollTop();
  }

  function finish() {
    const wrong = items.filter((it) => answers[it.q.id] !== correctIdx(it.q)).map((it) => it.q.id);
    const right = items.filter((it) => answers[it.q.id] === correctIdx(it.q)).map((it) => it.q.id);
    const next: Saved = {
      history: kind === 'exam' ? [{ at: Date.now(), score: right.length, total: items.length }, ...saved.history].slice(0, 10) : saved.history,
      wrong: [...new Set([...saved.wrong.filter((id) => !right.includes(id)), ...wrong])],
    };
    store(next);
    setSaved(next);
    setMode('result');
    scrollTop();
  }

  const pick = (qid: string, optIdx: number) => {
    if (mode === 'practice' && answers[qid] !== undefined) return; // v vaji odgovor velja takoj
    setAnswers((a) => ({ ...a, [qid]: optIdx }));
  };

  // ---------- začetek ----------
  if (mode === 'home') {
    const best = saved.history.reduce((b, h) => Math.max(b, Math.round((100 * h.score) / h.total)), 0);
    const wrongQs = questions.filter((q) => saved.wrong.includes(q.id));
    return (
      <div class="ex" ref={top}>
        <div class="ex-card ex-main">
          <p class="eyebrow">Simulacija izpita</p>
          <h3>{Math.min(size, questions.length)} vprašanj · {minutes} minut</h3>
          <p>Naključna vprašanja iz vseh tem. Odgovori se pokažejo šele na koncu – kot na pravem izpitu.</p>
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
          <p>Odgovor in razlaga se pokažeta takoj.</p>
          <div class="ex-topics">
            <button type="button" onClick={() => start('practice', questions, 'Vse teme')}>
              Vse teme <span>{questions.length}</span>
            </button>
            {topics.map((t) => {
              const qs = questions.filter((q) => q.topic === t.id);
              return (
                <button key={t.id} type="button" onClick={() => start('practice', qs, t.label)}>
                  {t.label} <span>{qs.length}</span>
                </button>
              );
            })}
          </div>
        </div>
        <p class="muted ex-note">Vprašanja so v slogu izpita, niso uradna izpitna vprašanja. Prag {pass} % je prag te vaje.</p>
      </div>
    );
  }

  // ---------- rezultat ----------
  if (mode === 'result') {
    const right = items.filter((it) => answers[it.q.id] === correctIdx(it.q)).length;
    const pct = Math.round((100 * right) / items.length);
    const passed = pct >= pass;
    const byTopic = topics
      .map((t) => {
        const its = items.filter((it) => it.q.topic === t.id);
        return { t, n: its.length, ok: its.filter((it) => answers[it.q.id] === correctIdx(it.q)).length };
      })
      .filter((x) => x.n > 0);
    const wrong = items.filter((it) => answers[it.q.id] !== correctIdx(it.q));
    return (
      <div class="ex" ref={top}>
        <div class={`ex-card ex-score ${passed ? 'ok' : 'bad'}`}>
          <p class="eyebrow">{label}</p>
          <p class="ex-pct">{pct} %</p>
          <p>
            {right} od {items.length} pravilnih · {kind === 'exam' ? (passed ? 'Opravljeno ✓' : `Pod pragom ${pass} %`) : 'Vaja končana'}
          </p>
        </div>

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
                  <span class={ok / n >= pass / 100 ? 'ok' : 'bad'} style={{ width: `${(100 * ok) / n}%` }} />
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
                const a = answers[it.q.id];
                return (
                  <li key={it.q.id}>
                    <p class="ex-q">{it.q.text}</p>
                    <p class="ex-yours">Tvoj odgovor: {a === undefined ? '— brez odgovora' : it.q.options[a].text}</p>
                    <p class="ex-right">Pravilno: {it.q.options[correctIdx(it.q)].text}</p>
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
  const chosen = answers[it.q.id];
  const answered = Object.keys(answers).length;
  const showFeedback = mode === 'practice' && chosen !== undefined;
  const ci = correctIdx(it.q);
  const last = idx === items.length - 1;
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
        <p class="eyebrow">{topicById.get(it.q.topic)?.label}</p>
        <p class="ex-q" id={`q-${it.q.id}`}>
          {it.q.text}
        </p>
        <div class="ex-opts" role="radiogroup" aria-labelledby={`q-${it.q.id}`}>
          {it.order.map((oi, k) => {
            const state = showFeedback ? (oi === ci ? 'right' : oi === chosen ? 'wrong' : 'dim') : oi === chosen ? 'sel' : '';
            return (
              <button key={oi} type="button" role="radio" aria-checked={oi === chosen} class={`ex-opt ${state}`} onClick={() => pick(it.q.id, oi)}>
                <span class="ex-letter">{LETTERS[k]}</span>
                <span>{it.q.options[oi].text}</span>
              </button>
            );
          })}
        </div>
        {showFeedback && (
          <div class={`ex-fb ${chosen === ci ? 'ok' : 'bad'}`} aria-live="polite">
            <strong>{chosen === ci ? '✓ Pravilno' : '✗ Napačno'}</strong>
            <p>{it.q.explain}</p>
          </div>
        )}
      </div>

      <div class="ex-nav">
        <button type="button" class="btn secondary" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
          ←
        </button>
        {last ? (
          <button
            type="button"
            class="btn"
            onClick={() => {
              if (mode === 'exam' && answered < items.length && !confirm(`Odgovoril si na ${answered} od ${items.length} vprašanj. Oddam izpit?`)) return;
              finish();
            }}
          >
            {mode === 'exam' ? 'Oddaj izpit' : 'Končaj'}
          </button>
        ) : (
          <button type="button" class="btn" disabled={mode === 'practice' && chosen === undefined} onClick={() => setIdx(idx + 1)}>
            Naprej →
          </button>
        )}
      </div>

      {mode === 'exam' && (
        <details class="ex-map">
          <summary>
            Pregled vprašanj · odgovorjenih {answered}/{items.length}
          </summary>
          <div class="ex-grid">
            {items.map((x, i) => (
              <button key={x.q.id} type="button" class={`${answers[x.q.id] !== undefined ? 'done' : ''} ${i === idx ? 'cur' : ''}`} onClick={() => setIdx(i)}>
                {i + 1}
              </button>
            ))}
          </div>
          <button
            type="button"
            class="btn secondary wide"
            onClick={() => {
              if (answered < items.length && !confirm(`Odgovoril si na ${answered} od ${items.length} vprašanj. Oddam izpit?`)) return;
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
