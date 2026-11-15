import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { SimScene, OperatingMode } from '../sim/scene';
import './simulator.css';

// 3D simulator za razumevanje delovanja. Igra z diagnostiko je na strani »Teren« (en model, ena igra).

type Group = 'hladivo' | 'voda' | 'krmiljenje';
interface Part {
  id: string;
  group: Group;
  name: string;
  en: string;
  where: string;
  what: string;
  analogy: string;
  faults: string[];
  step?: number;
}
interface Props {
  parts: Part[];
  lessonUrl: string;
  terenUrl: string;
  okvareUrl: string;
}

const STEP_TEXT: Record<number, string> = {
  1: 'Hladivo v uparjalniku je hladnejše od zunanjega zraka. Vzame mu toploto in zavre – postane para. Zato črpalka greje tudi pri mrazu.',
  2: 'Kompresor paro stisne. Ko se tlak dvigne, se para segreje – zdaj je bolj vroča od vode v radiatorjih.',
  3: 'V kondenzatorju vroča para odda toploto vodi in se utekočini. Obtočna črpalka toplo vodo odpelje v zalogovnik in naprej v radiatorje.',
  4: 'Ekspanzijski ventil tekočini zniža tlak. S tlakom pade temperatura – hladivo je spet mrzlo in krog se ponovi.',
};
const GROUPS: { id: Group | 'vse'; label: string }[] = [
  { id: 'hladivo', label: 'Krog hladiva' },
  { id: 'voda', label: 'Vodni krog' },
  { id: 'krmiljenje', label: 'Krmiljenje' },
  { id: 'vse', label: 'Vse' },
];
const MODES: { id: OperatingMode; label: string; part: string; text: string }[] = [
  {
    id: 'ogrevanje',
    label: 'Ogrevanje',
    part: 'kondenzator',
    text: 'Hladivo vzame toploto zunanjemu zraku in jo v kondenzatorju odda vodi. 3-potni ventil pošilja toplo vodo v zalogovnik, iz njega jo sekundarna črpalka vodi v radiatorje.',
  },
  {
    id: 'sanitarna',
    label: 'Sanitarna voda',
    part: 'tripotni',
    text: '3-potni ventil preklopi: topla voda ne gre več v radiatorje, ampak v tuljavo bojlerja. Radiatorji ta čas dobivajo toploto iz zalogovnika – brez zalogovnika bi se hiša ohlajala. Pomembno je, da ventil po segrevanju bojlerja preklopi nazaj.',
  },
  {
    id: 'odtajevanje',
    label: 'Odtajevanje',
    part: 'stiripotni',
    text: '4-potni ventil obrne tok. Vroč plin iz kompresorja gre v zunanje lamele in stopi led, ventilator stoji. Toploto za to si črpalka za nekaj minut »izposodi« iz vode ogrevanja.',
  },
];

export default function Simulator({ parts, lessonUrl, terenUrl, okvareUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SimScene | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'no3d'>('loading');
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [group, setGroup] = useState<Group | 'vse'>('hladivo');
  const [opMode, setOpMode] = useState<OperatingMode>('ogrevanje');

  const partById = useMemo(() => new Map(parts.map((p) => [p.id, p])), [parts]);
  const tourParts = useMemo(() => parts.filter((p) => p.step).sort((a, b) => a.step! - b.step!), [parts]);

  // ---------- 3D: naloži three.js šele zdaj (ločen paket) ----------
  useEffect(() => {
    let disposed = false;
    (async () => {
      // Najprej naj se izriše stran; 3D gradimo, ko ima brskalnik prosto.
      await new Promise<void>((r) => ('requestIdleCallback' in window ? requestIdleCallback(() => r(), { timeout: 800 }) : setTimeout(r, 50)));
      const mod = await import('../sim/scene');
      if (disposed || !canvasRef.current) return;
      if (!mod.webglAvailable()) return setStatus('no3d');
      try {
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        sceneRef.current = mod.createScene(canvasRef.current, { reducedMotion: reduced });
        setStatus('ready');
      } catch {
        setStatus('no3d');
      }
    })();
    return () => {
      disposed = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Oznake nad 3D: pozicije posodablja vsak okvir neposredno v DOM (brez ponovnega izrisa Preacta).
  useEffect(() => {
    if (status !== 'ready') return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const s = sceneRef.current;
      const box = overlayRef.current;
      if (!s || !box) return;
      const chips = [...box.querySelectorAll<HTMLElement>('[data-anchor]')];
      const anchors = s.anchors(chips.map((c) => c.dataset.anchor!));
      chips.forEach((c, i) => {
        const a = anchors[i];
        c.style.transform = `translate(${a.x}px, ${a.y}px) translate(-50%, -50%)`;
        c.style.visibility = a.visible ? 'visible' : 'hidden';
      });
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [status]);

  // Dotik dela v 3D
  useEffect(() => {
    sceneRef.current?.onPick((id) => {
      if (partById.has(id)) selectPart(id);
    });
  });

  function selectPart(id: string | null) {
    setStep(0); // dotik dela med ogledom kroga pokaže ta del, ne koraka
    setSelected(id);
    sceneRef.current?.highlight(id);
    sceneRef.current?.focus(id);
  }
  function changeMode(m: OperatingMode) {
    setOpMode(m);
    sceneRef.current?.setOperatingMode(m);
    const part = MODES.find((x) => x.id === m)!.part;
    setStep(0);
    setSelected(null);
    sceneRef.current?.highlight(m === 'ogrevanje' ? null : part);
    sceneRef.current?.focus(m === 'ogrevanje' ? null : part);
    if (m !== 'ogrevanje') setGroup(partById.get(part)!.group);
  }
  function goTour(n: number) {
    setStep(n);
    const p = n ? tourParts[n - 1] : null;
    setSelected(p?.id ?? null);
    sceneRef.current?.highlight(p?.id ?? null);
    sceneRef.current?.focus(p?.id ?? null);
  }

  const chips =
    status !== 'ready'
      ? []
      : parts
          .map((p, i) => ({ p, i }))
          .filter(({ p }) => group === 'vse' || p.group === group || p.id === selected)
          .map(({ p, i }) => ({ id: p.id, n: i + 1, label: p.name.replace(/ \(.*\)/, ''), on: selected === p.id }));
  const sel = selected ? partById.get(selected) ?? null : null;

  return (
    <div class="sim">
      <div class="sim-tabs">
        <span class="sim-tab-on">Kako deluje</span>
        <a class="sim-tab-link" href={terenUrl}>
          Igra Teren 🧰 →
        </a>
      </div>

      <div class="sim-layout">
        <div class="stage">
          <canvas ref={canvasRef} aria-label="3D model toplotne črpalke zrak–voda" role="img" />
          {status === 'loading' && <div class="stage-msg">Nalagam 3D model …</div>}
          {status === 'no3d' && <div class="stage-msg">Ta naprava ne podpira 3D prikaza. Vse deluje tudi s seznamom ob strani.</div>}
          <div class="overlay" ref={overlayRef}>
            {chips.map((c) => (
              <button key={c.id} type="button" data-anchor={c.id} class={`chip ${c.on ? 'on' : ''}`} aria-label={`${c.n}. ${c.label}`} onClick={() => selectPart(c.id)}>
                <span class="n" aria-hidden="true">{c.n}</span>
                <span class="lbl" aria-hidden="true">{c.label}</span>
              </button>
            ))}
          </div>
          {status === 'ready' && (
            <div class="legend" aria-hidden="true">
              <span><i style="background:#d9412b" />visok tlak</span>
              <span><i style="background:#2f7fd1" />nizek tlak</span>
              <span><i style="background:#f0a24a" />topla voda</span>
              <span><i style="background:#3fb8b0" />povratna</span>
            </div>
          )}
          {status === 'ready' && <p class="hint">Povleci za vrtenje · ščipni ali kolešček za približanje · tapni del</p>}
        </div>

        <div class="side" aria-live="polite">
          {step > 0 ? (
            <div class="panel-in">
              <p class="eyebrow">Krog hladiva · korak {step} od 4</p>
              <h2>{tourParts[step - 1].name}</h2>
              <p class="lead-s">{STEP_TEXT[step]}</p>
              <p>
                <em>Predstavljaj si:</em> {tourParts[step - 1].analogy}
              </p>
              <div class="steps" role="group" aria-label="Koraki">
                {tourParts.map((tp, i) => (
                  <button key={tp.id} type="button" class={i + 1 === step ? 'on' : ''} aria-current={i + 1 === step} onClick={() => goTour(i + 1)}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <div class="row">
                <button type="button" class="btn secondary" onClick={() => goTour(step - 1)}>
                  ← Nazaj
                </button>
                {step < 4 ? (
                  <button type="button" class="btn" onClick={() => goTour(step + 1)}>
                    Naprej →
                  </button>
                ) : (
                  <button type="button" class="btn" onClick={() => goTour(0)}>
                    Krog je sklenjen ✓
                  </button>
                )}
              </div>
            </div>
          ) : sel ? (
            <div class="panel-in">
              <p class="eyebrow">
                {sel.where} · <span lang="en">{sel.en}</span>
              </p>
              <h2>{sel.name}</h2>
              <p class="lead-s">{sel.what}</p>
              <p>
                <em>Predstavljaj si:</em> {sel.analogy}
              </p>
              <h3>Tipične napake</h3>
              <ul>
                {sel.faults.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {sel.id !== 'stevec' && (
                <p>
                  <a href={`${okvareUrl}#${sel.id}`}>Zakaj se pokvari in kako se zamenja →</a>
                </p>
              )}
              <button type="button" class="btn secondary" onClick={() => selectPart(null)}>
                ← Vsi deli
              </button>
            </div>
          ) : (
            <div class="panel-in">
              <p class="eyebrow">3D model</p>
              <h2>Kako toplotna črpalka greje</h2>
              <p>Toplota iz zunanjega zraka gre v vodo radiatorjev – tudi pri mrazu. Hladivo jo prenaša v sklenjenem krogu.</p>
              <button type="button" class="btn wide" onClick={() => goTour(1)}>
                ▶ Ogled kroga v 4 korakih
              </button>
              <h3>Način delovanja</h3>
              <div class="seg3" role="radiogroup" aria-label="Način delovanja">
                {MODES.map((m) => (
                  <button key={m.id} type="button" role="radio" aria-checked={opMode === m.id} class={opMode === m.id ? 'on' : ''} onClick={() => changeMode(m.id)}>
                    {m.label}
                  </button>
                ))}
              </div>
              <p class="mode-text">{MODES.find((m) => m.id === opMode)!.text}</p>
              <h3>Deli naprave ({parts.length})</h3>
              <div class="seg3 groups" role="radiogroup" aria-label="Skupina delov">
                {GROUPS.map((g) => (
                  <button key={g.id} type="button" role="radio" aria-checked={group === g.id} class={group === g.id ? 'on' : ''} onClick={() => setGroup(g.id)}>
                    {g.label}
                  </button>
                ))}
              </div>
              <div class="part-list">
                {parts.map((p, i) =>
                  group === 'vse' || p.group === group ? (
                    <button key={p.id} type="button" onClick={() => selectPart(p.id)}>
                      <b class="num-dot">{i + 1}</b> {p.name}
                    </button>
                  ) : null,
                )}
              </div>
              <p class="fine">
                Najprej razumi razliko med simptomom in vzrokom: <a href={lessonUrl}>lekcija 0.1</a>. Iskanje napak vadiš v igri <a href={terenUrl}>Teren</a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
