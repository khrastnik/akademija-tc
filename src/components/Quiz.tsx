import { useRef, useState } from 'preact/hooks';
import { recordAnswer } from '../lib/progress';
import './quiz.css';

export interface QuizOption {
  id: string;
  text: string;
  correct?: boolean;
  why: string;
}
export interface QuizQuestion {
  id: string;
  type: 'single' | 'truefalse';
  text: string;
  understand: { simpler: string; terms: string[]; hint: string };
  options: QuizOption[];
  lessonLink: string;
}
export interface TermLite {
  id: string;
  sl: string;
  en: string;
  kratkaRazlaga: string;
}

interface Props {
  quizId: string;
  questions: QuizQuestion[];
  terms: Record<string, TermLite>;
  /** url('lekcija/') – osnova za povezave »Preberi v lekciji«. */
  lessonBase: string;
  /** V ponovitvi pravilen odgovor premakne vprašanje na naslednji interval. */
  mode?: 'lesson' | 'review';
  onDone?: (correct: number, total: number) => void;
}

/** Stabilno »naključno« mešanje: enako na strežniku in v brskalniku, pravilni odgovor ni vedno prvi. */
function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const linkFor = (base: string, lessonLink: string) => {
  const [lesson, anchor] = lessonLink.split('#');
  return `${base}${lesson}/${anchor ? `#${anchor}` : ''}`;
};

export default function Quiz({ quizId, questions, terms, lessonBase, mode = 'lesson', onDone }: Props) {
  const [picked, setPicked] = useState<Record<string, string>>({});
  // Ref drži zadnje stanje tudi pri hitrih zaporednih dotikih (state v zaprtju je lahko star).
  const pickedRef = useRef<Record<string, string>>({});
  const answered = Object.keys(picked).length;
  const correct = questions.filter((q) => q.options.find((o) => o.id === picked[q.id])?.correct).length;

  function pick(q: QuizQuestion, o: QuizOption) {
    if (pickedRef.current[q.id]) return;
    const next = { ...pickedRef.current, [q.id]: o.id };
    pickedRef.current = next;
    setPicked(next);
    recordAnswer(`${quizId}:${q.id}`, !!o.correct, mode === 'review');
    if (Object.keys(next).length === questions.length) {
      const c = questions.filter((qq) => qq.options.find((oo) => oo.id === next[qq.id])?.correct).length;
      onDone?.(c, questions.length);
      document.dispatchEvent(new CustomEvent('lesson:unlock', { detail: { card: 'quiz' } }));
    }
  }

  return (
    <div class="quiz">
      {questions.map((q, qi) => {
        const choice = picked[q.id];
        const options = q.type === 'truefalse' ? q.options : seededShuffle(q.options, `${quizId}:${q.id}`);
        return (
          <fieldset class="q" key={q.id}>
            <legend>
              <span class="q-num">{qi + 1}/{questions.length}</span> {q.text}
            </legend>

            <details class="understand">
              <summary>Razumem vprašanje</summary>
              <p><strong>Povedano preprosteje:</strong> {q.understand.simpler}</p>
              {q.understand.terms.length > 0 && (
                <dl>
                  {q.understand.terms.map((t) =>
                    terms[t] ? (
                      <div key={t}>
                        <dt>{terms[t].sl} <span class="muted">· {terms[t].en}</span></dt>
                        <dd>{terms[t].kratkaRazlaga}</dd>
                      </div>
                    ) : null,
                  )}
                </dl>
              )}
              <p><strong>Namig:</strong> {q.understand.hint}</p>
            </details>

            <div class={`options ${q.type === 'truefalse' ? 'tf' : ''}`} role="group" aria-label="Odgovori">
              {options.map((o) => {
                const state = !choice ? '' : o.correct ? 'right' : o.id === choice ? 'wrong' : 'other';
                return (
                  <button type="button" key={o.id} class={`opt ${state}`} disabled={!!choice} aria-pressed={o.id === choice} onClick={() => pick(q, o)}>
                    <span class="mark" aria-hidden="true">{state === 'right' ? '✓' : state === 'wrong' ? '✗' : ''}</span>
                    <span>{o.text}</span>
                    {state === 'right' && <span class="sr-only"> – pravilen odgovor</span>}
                    {state === 'wrong' && <span class="sr-only"> – tvoj odgovor, napačen</span>}
                  </button>
                );
              })}
            </div>

            {choice && (
              <div class="explain" aria-live="polite">
                <p class={q.options.find((o) => o.id === choice)?.correct ? 'verdict ok' : 'verdict bad'}>
                  {q.options.find((o) => o.id === choice)?.correct ? 'Pravilno.' : 'Ni pravilno – to vprašanje se ti vrne v »Za ponovitev«.'}
                </p>
                <ul>
                  {options.map((o) => (
                    <li key={o.id} class={o.correct ? 'ok' : ''}>
                      <strong>{o.correct ? '✓ ' : ''}{o.text}:</strong> {o.why}
                    </li>
                  ))}
                </ul>
                <a href={linkFor(lessonBase, q.lessonLink)}>Preberi v lekciji →</a>
              </div>
            )}
          </fieldset>
        );
      })}
      {answered === questions.length && (
        <p class="score" aria-live="polite">
          Rezultat: <strong>{correct} / {questions.length}</strong>
          {correct < questions.length ? ' · napačna vprašanja te čakajo v »Za ponovitev« čez 1, 3 in 7 dni.' : ' · odlično.'}
        </p>
      )}
    </div>
  );
}
