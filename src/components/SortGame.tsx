import { useState } from 'preact/hooks';
import { scoreSort } from '../../packages/engine/src/index';
import './sortgame.css';

interface Group {
  id: string;
  label: string;
}
interface Item {
  id: string;
  text: string;
  group: string;
  why: string;
}
interface Props {
  widgetId: string;
  groups: Group[];
  items: Item[];
}

export default function SortGame({ widgetId, groups, items }: Props) {
  const [answers, setAnswers] = useState<Record<string, string | undefined>>({});
  const [checked, setChecked] = useState<ReturnType<typeof scoreSort> | null>(null);
  const key = Object.fromEntries(items.map((i) => [i.id, i.group]));
  const allSet = items.every((i) => answers[i.id]);

  function choose(itemId: string, group: string) {
    setAnswers((prev) => ({ ...prev, [itemId]: group }));
    setChecked(null);
  }

  function check() {
    const result = scoreSort(answers, key);
    setChecked(result);
    if (result.done) document.dispatchEvent(new CustomEvent('lesson:unlock', { detail: { card: 'widget', id: widgetId } }));
  }

  return (
    <div class="sort">
      <ol class="sort-items">
        {items.map((item) => {
          const wrong = checked?.wrong.includes(item.id);
          const right = checked && !wrong;
          return (
            <li key={item.id} class={wrong ? 'wrong' : right ? 'right' : ''}>
              <p class="sort-text" id={`${widgetId}-${item.id}`}>
                {right && <span aria-hidden="true">✓ </span>}
                {wrong && <span aria-hidden="true">✗ </span>}
                {item.text}
              </p>
              <div class="seg" role="radiogroup" aria-labelledby={`${widgetId}-${item.id}`}>
                {groups.map((g) => (
                  <button
                    type="button"
                    role="radio"
                    key={g.id}
                    aria-checked={answers[item.id] === g.id}
                    class={answers[item.id] === g.id ? 'on' : ''}
                    onClick={() => choose(item.id, g.id)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              {wrong && <p class="sort-hint">Še enkrat premisli: je to nekaj, kar <em>opaziš</em>, kar <em>izmeriš</em>, ali kar <em>popraviš</em>?</p>}
              {checked?.done && <p class="sort-why">{item.why}</p>}
            </li>
          );
        })}
      </ol>
      <div class="sort-foot" aria-live="polite">
        <button type="button" class="btn" disabled={!allSet} onClick={check}>
          Preveri
        </button>
        {!allSet && <span class="muted">Razvrsti vseh {items.length}.</span>}
        {checked && !checked.done && (
          <span>
            Pravilnih {checked.correct} od {checked.total}. Popravi označene in preveri znova.
          </span>
        )}
        {checked?.done && <strong class="ok-text">Vse pravilno – nadaljuj z gumbom Naprej.</strong>}
      </div>
    </div>
  );
}
