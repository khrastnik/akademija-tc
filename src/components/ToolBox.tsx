import { useEffect, useRef, useState } from 'preact/hooks';
import { TOOL_SIMS, type PT } from './ToolSims';
import type { ToolId } from './tool-ids';
import './tools.css';

interface Tool {
  id: ToolId;
  name: string;
  en: string;
  cat: 'hladivo' | 'temperatura' | 'elektrika' | 'voda';
  who: string[];
  measures: string;
  where: string[];
  how: string[];
  mistakes: string[];
  lessons: string[];
}
interface Props {
  tools: Tool[];
  tables: PT[];
  lessonTitles: Record<string, string>;
  lessonBase: string;
}

const CATS = [
  { id: 'vse', label: 'Vse' },
  { id: 'hladivo', label: 'Krog hladiva' },
  { id: 'temperatura', label: 'Temperatura' },
  { id: 'elektrika', label: 'Elektrika' },
  { id: 'voda', label: 'Voda' },
] as const;
const WHO: Record<string, string> = {
  lastnik: 'Lastnik',
  serviser: 'Serviser',
  elektro: 'Elektrika – usposobljena oseba',
  spricevalo: '🔒 Spričevalo F-plini',
};
const noop = () => {};

export default function ToolBox({ tools, tables, lessonTitles, lessonBase }: Props) {
  const [cat, setCat] = useState<string>('vse');
  const [sel, setSel] = useState<ToolId | null>(null);
  const [msg, setMsg] = useState('');
  const top = useRef<HTMLDivElement>(null);

  // #id v naslovu odpre napravo (povezava iz lekcij, gumb Nazaj v brskalniku)
  useEffect(() => {
    const read = () => {
      const id = decodeURIComponent(location.hash.slice(1)) as ToolId;
      setSel(tools.some((t) => t.id === id) ? id : null);
      setMsg('');
    };
    read();
    addEventListener('hashchange', read);
    return () => removeEventListener('hashchange', read);
  }, [tools]);
  useEffect(() => {
    if (sel) top.current?.scrollIntoView({ block: 'start' });
  }, [sel]);

  const open = (id: ToolId | null) => {
    if (id) location.hash = id;
    else history.pushState(null, '', location.pathname + location.search);
    setSel(id);
    setMsg('');
  };

  if (sel) {
    const t = tools.find((x) => x.id === sel)!;
    const Sim = TOOL_SIMS[t.id];
    return (
      <div class="tl" ref={top}>
        <button type="button" class="tl-back" onClick={() => open(null)}>
          ← Vsa oprema
        </button>
        <h2 class="tl-title">
          {t.name} <span lang="en">{t.en}</span>
        </h2>
        <div class="tl-who">
          {t.who.map((w) => (
            <span class={`tl-tag who-${w}`}>{WHO[w]}</span>
          ))}
        </div>
        <div class="tl-stage">
          <p class="tl-try">👆 Klikni utripajoče dele naprave.</p>
          <Sim say={setMsg} tables={tables} />
          <p class={`tl-msg ${msg ? '' : 'empty'}`} aria-live="polite">
            {msg || 'Tu se izpiše, kaj se je zgodilo in zakaj.'}
          </p>
        </div>
        <section class="tl-sec">
          <h3>Kaj meri</h3>
          <p>{t.measures}</p>
          <h3>Kje</h3>
          <ul>{t.where.map((x) => <li>{x}</li>)}</ul>
          <h3>Kako</h3>
          <ol>{t.how.map((x) => <li>{x}</li>)}</ol>
          <h3>Pogoste napake</h3>
          <ul class="tl-bad">{t.mistakes.map((x) => <li>{x}</li>)}</ul>
          {t.lessons.length > 0 && (
            <p class="tl-links">
              {t.lessons.map((l) => (
                <a href={`${lessonBase}${l}/`}>{lessonTitles[l]} →</a>
              ))}
            </p>
          )}
        </section>
      </div>
    );
  }

  const shown = tools.filter((t) => cat === 'vse' || t.cat === cat);
  return (
    <div class="tl" ref={top}>
      <div class="tl-filters" role="group" aria-label="Vrsta opreme">
        {CATS.map((c) => (
          <button type="button" class={cat === c.id ? 'on' : ''} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <ul class="tl-grid">
        {shown.map((t) => {
          const Sim = TOOL_SIMS[t.id];
          return (
            <li class="tl-card">
              {/* sličica je ista naprava, a neaktivna – gumb kartice je ločen, ker gumb v gumbu ni veljaven HTML */}
              <div class="tl-thumb" aria-hidden="true" inert>
                <Sim say={noop} tables={tables} />
              </div>
              <button type="button" class="tl-card-btn" onClick={() => open(t.id)}>
                <strong>{t.name}</strong>
                <span class="tl-card-who">{t.who.map((w) => WHO[w]).join(' · ')}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
