import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  MEASUREMENTS,
  MEASUREMENT_READINGS,
  readingsFor,
  scoreCase,
  type FaultId,
  type Reading,
  type Score,
} from '../../packages/engine/src/sim';
import type { SimScene, Cue, OperatingMode } from '../sim/scene';
import './simulator.css';

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
interface FaultText {
  id: FaultId;
  name: string;
  pattern: string;
  why: string;
  fix: string;
  verify: string;
}
interface Call {
  fault: FaultId;
  place: string;
  customer: string;
  call: string;
  par: number;
}
interface Day {
  id: string;
  title: string;
  intro: string;
  calls: Call[];
}
interface Props {
  parts: Part[];
  faults: FaultText[];
  days: Day[];
  lessonUrl: string;
}

// ---------- shranjevanje rezultatov igre (samo v brskalniku) ----------
const KEY = 'akademija-tc:simulator';
type Saved = { days: Record<string, { best: number; stars: number }> };
function loadSaved(): Saved {
  try {
    return { days: {}, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { days: {} };
  }
}
function saveSaved(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* brez shranjevanja */
  }
}

const ZONE_LABEL = { low: 'NIZKO', ok: 'NORMALNO', high: 'VISOKO', info: '' } as const;
const STEP_TEXT: Record<number, string> = {
  1: 'Hladivo v uparjalniku je hladnejše od zunanjega zraka. Vzame mu toploto in zavre – postane para. Zato črpalka greje tudi pri mrazu.',
  2: 'Kompresor paro stisne. Ko se tlak dvigne, se para segreje – zdaj je bolj vroča od vode v radiatorjih.',
  3: 'V kondenzatorju vroča para odda toploto vodi in se utekočini. Obtočna črpalka toplo vodo odpelje v radiatorje.',
  4: 'Ekspanzijski ventil tekočini zniža tlak. S tlakom pade temperatura – hladivo je spet mrzlo in krog se ponovi.',
};
const MEASURE_SHORT: Record<string, string> = {
  zaslon: 'Zaslon',
  'tlak-vode': 'Tlak vode',
  zunanja: 'Pregled',
  poslusaj: 'Poslušaj',
  'ventil-3p': '3-potni',
  bojler: 'Bojler',
  'dt-susilnik': 'Sušilnik',
  't-dvizni': 'T dvižni',
  'dt-voda': 'ΔT voda',
  filter: 'Filter',
  'nt-stran': 'NT + SH',
  'vt-stran': 'VT + SC',
  't-tlacni': 'T tlačni',
  tok: 'Tok',
};
// Kje na napravi se pokaže oznaka meritve.
const MEASURE_ANCHOR: Record<string, string> = {
  zaslon: 'krmilnik',
  'tlak-vode': 'raztezna',
  zunanja: 'uparjalnik',
  poslusaj: 'obtocna',
  'ventil-3p': 'tripotni',
  bojler: 'bojler',
  'dt-susilnik': 'susilnik',
  't-dvizni': 'dvizni',
  'dt-voda': 'povratni',
  filter: 'filter',
  'nt-stran': 'sesalni',
  'vt-stran': 'tekocinski',
  't-tlacni': 'tlacni',
  tok: 'kompresor',
};

const DISPLAY: Partial<Record<FaultId, { lines: string[]; alarm?: boolean }>> = {
  nastavitev: { lines: ['27 °C', 'Želena: 27 °C', 'Krivulja −8'] },
  filter: { lines: ['E: VISOK TLAK', 'Ponovni zagon …'], alarm: true },
  'zrak-v-vodi': { lines: ['E: PRETOK', 'Premajhen pretok'], alarm: true },
  senzor: { lines: ['Povratna 40 °C', 'Moč zmanjšana'] },
  odtajevanje: { lines: ['E: ODTAJEVANJE', '6× neuspešno'], alarm: true },
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
    text: 'Hladivo vzame toploto zunanjemu zraku in jo v kondenzatorju odda vodi. 3-potni ventil pošilja toplo vodo v radiatorje.',
  },
  {
    id: 'sanitarna',
    label: 'Sanitarna voda',
    part: 'tripotni',
    text: '3-potni ventil preklopi: topla voda ne gre več v radiatorje, ampak v tuljavo bojlerja. Hiša se ta čas ne greje – zato je pomembno, da ventil po segrevanju bojlerja preklopi nazaj.',
  },
  {
    id: 'odtajevanje',
    label: 'Odtajevanje',
    part: 'stiripotni',
    text: '4-potni ventil obrne tok. Vroč plin iz kompresorja gre v zunanje lamele in stopi led, ventilator stoji. Toploto za to si črpalka za nekaj minut »izposodi« iz vode ogrevanja.',
  },
];

const clockText = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export default function Simulator({ parts, faults, days, lessonUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SimScene | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'no3d'>('loading');
  const [mode, setMode] = useState<'learn' | 'game'>('learn');

  // učenje
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [group, setGroup] = useState<Group | 'vse'>('hladivo');
  const [opMode, setOpMode] = useState<OperatingMode>('ogrevanje');

  // igra
  const [saved, setSaved] = useState<Saved>({ days: {} });
  const [dayIdx, setDayIdx] = useState<number | null>(null);
  const [callIdx, setCallIdx] = useState(0);
  const [phase, setPhase] = useState<'days' | 'brief' | 'work' | 'diagnose' | 'debrief' | 'dayEnd'>('days');
  const [measured, setMeasured] = useState<string[]>([]);
  const [guesses, setGuesses] = useState<FaultId[]>([]);
  const [score, setScore] = useState<Score | null>(null);
  const [dayScores, setDayScores] = useState<Score[]>([]);
  const [clock, setClock] = useState(8 * 60);
  const [toast, setToast] = useState('');

  const day = dayIdx === null ? null : days[dayIdx];
  const call = day?.calls[callIdx];
  const readings = useMemo(() => (call ? readingsFor(call.fault, `${day!.id}-${callIdx}`) : {}), [call, day, callIdx]);
  const partById = useMemo(() => new Map(parts.map((p) => [p.id, p])), [parts]);
  const faultById = useMemo(() => new Map(faults.map((f) => [f.id, f])), [faults]);
  const tourParts = useMemo(() => parts.filter((p) => p.step).sort((a, b) => a.step! - b.step!), [parts]);

  useEffect(() => setSaved(loadSaved()), []);

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
  }, [status, mode, phase]);

  // Dotik dela v 3D
  useEffect(() => {
    sceneRef.current?.onPick((id) => {
      if (mode === 'learn' && partById.has(id)) selectPart(id);
      if (mode === 'game' && phase === 'work') {
        const m = Object.entries(MEASURE_ANCHOR).find(([, a]) => a === id)?.[0];
        if (m) measure(m);
      }
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

  function switchMode(m: 'learn' | 'game') {
    setMode(m);
    setOpMode('ogrevanje');
    selectPart(null);
    setStep(0);
    resetScene();
    if (m === 'game') setPhase(day ? phase : 'days');
  }

  function resetScene() {
    const s = sceneRef.current;
    if (!s) return;
    s.resetCues();
    s.setOperatingMode('ogrevanje');
    s.setFlowSpeed(1, 1);
    s.setDisplay(['35 °C', 'Ogrevanje', 'OK']);
    s.highlight(null);
    s.focus(null);
  }

  // ---------- igra ----------
  function startDay(i: number) {
    setDayIdx(i);
    setCallIdx(0);
    setDayScores([]);
    setClock(8 * 60);
    startCall();
  }
  function startCall() {
    setMeasured([]);
    setGuesses([]);
    setScore(null);
    setPhase('brief');
    resetScene();
    sceneRef.current?.setDisplay(['…', 'Na poti', '']);
  }

  function revealFor(mId: string) {
    const s = sceneRef.current;
    if (!s || !call) return;
    const f = call.fault;
    const cues: Cue[] = [];
    if (mId === 'zunanja' && f === 'ovira-zraka') cues.push('leaves', 'ice');
    if (mId === 'zunanja' && f === 'premalo-hladiva') cues.push('oil');
    if (mId === 'filter' && f === 'filter') cues.push('dirty-filter');
    if (mId === 'poslusaj' && f === 'zrak-v-vodi') cues.push('bubbles');
    if (mId === 'tlak-vode' && f === 'zrak-v-vodi') cues.push('low-water');
    if (mId === 'zunanja' && f === 'odtajevanje') cues.push('ice-full');
    if ((mId === 'ventil-3p' || mId === 'bojler') && f === 'tripotni') cues.push('valve-dhw');
    if (mId === 'dt-susilnik' && f === 'filter-susilnik') cues.push('frost-drier');
    cues.forEach((c) => s.reveal(c));
    if (mId === 'zaslon') {
      const d = DISPLAY[f] ?? { lines: ['35 °C', 'Ogrevanje', 'OK'] };
      s.setDisplay(d.lines, d.alarm);
    }
    if (mId === 'dt-voda' && (f === 'filter' || f === 'zrak-v-vodi')) s.setFlowSpeed(1, 0.35);
    if ((mId === 'nt-stran' || mId === 'vt-stran') && (f === 'premalo-hladiva' || f === 'eev' || f === 'filter-susilnik')) s.setFlowSpeed(0.55, 1);
    s.highlight(MEASURE_ANCHOR[mId]);
  }

  function measure(id: string) {
    if (measured.includes(id)) {
      setToast('To si že izmeril – poglej zapisnik.');
      return;
    }
    const m = MEASUREMENTS.find((x) => x.id === id)!;
    setMeasured((prev) => [...prev, id]);
    setClock((c) => c + m.minutes);
    revealFor(id);
    setToast(`${m.label}: +${m.minutes} min`);
  }

  function diagnose(f: FaultId) {
    const next = [...guesses, f];
    setGuesses(next);
    if (f !== call!.fault && next.length < 3) {
      setToast('Meritve tega ne potrjujejo. −30 točk. Poglej zapisnik in poskusi znova.');
      return;
    }
    const s = scoreCase({ fault: call!.fault, measured, guesses: next, par: call!.par });
    setScore(s);
    setDayScores((d) => [...d, s]);
    if (s.solved) setClock((c) => c + 25); // popravilo in preverjanje
    setPhase('debrief');
  }

  function nextCall() {
    if (!day) return;
    if (callIdx + 1 < day.calls.length) {
      setCallIdx(callIdx + 1);
      setClock((c) => c + 40); // vožnja do naslednje stranke
      startCall();
    } else {
      const total = dayScores.reduce((s, x) => s + x.points, 0);
      const stars = Math.min(...dayScores.map((x) => x.stars));
      const prev = saved.days[day.id];
      const next = { ...saved, days: { ...saved.days, [day.id]: { best: Math.max(total, prev?.best ?? 0), stars: Math.max(stars, prev?.stars ?? 0) } } };
      setSaved(next);
      saveSaved(next);
      setPhase('dayEnd');
    }
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // ---------- oznake nad 3D ----------
  const chips =
    status !== 'ready'
      ? []
      : mode === 'learn'
        ? parts
            .map((p, i) => ({ p, i }))
            .filter(({ p }) => group === 'vse' || p.group === group || p.id === selected)
            .map(({ p, i }) => ({ id: p.id, n: i + 1, anchor: p.id, label: p.name.replace(/ \(.*\)/, ''), on: selected === p.id, done: false }))
        : phase === 'work'
          ? MEASUREMENTS.map((m, i) => ({ id: m.id, n: i + 1, anchor: MEASURE_ANCHOR[m.id], label: MEASURE_SHORT[m.id], on: false, done: measured.includes(m.id) }))
          : [];

  const readingRows: Reading[] = measured.flatMap((m) => MEASUREMENT_READINGS[m].map((r) => readings[r]));

  return (
    <div class="sim">
      <div class="sim-tabs" role="tablist" aria-label="Način simulatorja">
        <button role="tab" aria-selected={mode === 'learn'} class={mode === 'learn' ? 'on' : ''} onClick={() => switchMode('learn')}>
          Kako deluje
        </button>
        <button role="tab" aria-selected={mode === 'game'} class={mode === 'game' ? 'on' : ''} onClick={() => switchMode('game')}>
          Dan na terenu 🛠
        </button>
      </div>

      <div class="sim-layout">
        <div class="stage">
          <canvas ref={canvasRef} aria-label="3D model toplotne črpalke zrak–voda" role="img" />
          {status === 'loading' && <div class="stage-msg">Nalagam 3D model …</div>}
          {status === 'no3d' && <div class="stage-msg">Ta naprava ne podpira 3D prikaza. Vse deluje tudi s seznamom ob strani.</div>}
          <div class="overlay" ref={overlayRef}>
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                data-anchor={c.anchor}
                class={`chip ${c.on ? 'on' : ''} ${c.done ? 'done' : ''} ${mode === 'game' ? 'measure' : ''}`}
                aria-label={`${c.n}. ${c.label}${c.done ? ' – izmerjeno' : ''}`}
                onClick={() => (mode === 'learn' ? selectPart(c.id) : measure(c.id))}
              >
                <span class="n" aria-hidden="true">{c.done ? '✓' : c.n}</span>
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
          {mode === 'game' && day && phase !== 'days' && (
            <div class="hud">
              <span>🕗 {clockText(clock)}</span>
              <span>
                Klic {callIdx + 1}/{day.calls.length}
              </span>
            </div>
          )}
          {toast && (
            <div class="toast" role="status">
              {toast}
            </div>
          )}
          {status === 'ready' && <p class="hint">Povleci za vrtenje · ščipni ali kolešček za približanje · tapni del</p>}
        </div>

        <div class="side" aria-live="polite">
          {mode === 'learn' && (
            <LearnPanel
              group={group}
              setGroup={setGroup}
              opMode={opMode}
              changeMode={changeMode}
              parts={parts}
              tourParts={tourParts}
              selected={selected ? partById.get(selected) ?? null : null}
              step={step}
              goTour={goTour}
              selectPart={selectPart}
              lessonUrl={lessonUrl}
            />
          )}

          {mode === 'game' && phase === 'days' && (
            <div class="panel-in">
              <p class="eyebrow">Igra</p>
              <h2>Dan na terenu</h2>
              <p>Si serviser. Stranke kličejo, ti meriš in iščeš vzrok. Vsaka meritev vzame čas. Točke dobiš za <strong>dokazano</strong> diagnozo, za <strong>najlažje najprej</strong> in če ne priklapljaš manometrov brez potrebe.</p>
              <ol class="days">
                {days.map((d, i) => {
                  const s = saved.days[d.id];
                  const locked = i > 0 && !saved.days[days[i - 1].id];
                  return (
                    <li key={d.id}>
                      <button type="button" class="day" disabled={locked} onClick={() => startDay(i)}>
                        <strong>{d.title}</strong>
                        <span>{locked ? '🔒 Najprej opravi prejšnji dan' : d.intro}</span>
                        {s && <span class="stars" aria-label={`${s.stars} od 3 zvezdic`}>{'★'.repeat(s.stars)}{'☆'.repeat(3 - s.stars)} · {s.best} točk</span>}
                      </button>
                    </li>
                  );
                })}
              </ol>
              <p class="fine">Učni model: vrednosti kažejo smer odstopanj, niso podatki proizvajalca.</p>
            </div>
          )}

          {mode === 'game' && call && phase === 'brief' && (
            <div class="panel-in">
              <p class="eyebrow">
                📞 Klic {callIdx + 1} · {call.place}
              </p>
              <h2>{call.customer}</h2>
              <blockquote class="callq">{call.call}</blockquote>
              <p class="muted">Kaj boš preveril najprej? Spomni se: najlažje najprej – zaslon, voda, zrak.</p>
              <button type="button" class="btn" onClick={() => setPhase('work')}>
                Prispel sem – začni →
              </button>
            </div>
          )}

          {mode === 'game' && call && (phase === 'work' || phase === 'diagnose') && (
            <div class="panel-in">
              <p class="eyebrow">
                {call.customer} · {call.place}
              </p>
              <blockquote class="callq small">{call.call}</blockquote>

              {phase === 'work' && (
                <>
                  <h3>Meritve</h3>
                  <div class="measures">
                    {MEASUREMENTS.map((m, i) => (
                      <button key={m.id} type="button" class={`meas k-${m.kind} ${measured.includes(m.id) ? 'done' : ''}`} onClick={() => measure(m.id)} title={m.tells}>
                        <span><b class="num-dot">{measured.includes(m.id) ? '✓' : i + 1}</b> {m.label}</span>
                        <small>{m.minutes} min</small>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <h3>Zapisnik</h3>
              {readingRows.length === 0 ? (
                <p class="muted">Še nič izmerjenega. Tapni meritev na napravi ali v seznamu.</p>
              ) : (
                <ul class="log">
                  {readingRows.map((r) => (
                    <ReadingRow key={r.id} r={r} />
                  ))}
                </ul>
              )}

              {phase === 'work' ? (
                <button type="button" class="btn wide" disabled={measured.length === 0} onClick={() => setPhase('diagnose')}>
                  Postavi diagnozo →
                </button>
              ) : (
                <>
                  <h3>Kaj je vzrok?</h3>
                  <div class="diag">
                    {faults.map((f) => (
                      <button key={f.id} type="button" class={guesses.includes(f.id) ? 'wrong' : ''} disabled={guesses.includes(f.id)} onClick={() => diagnose(f.id)}>
                        {f.name}
                      </button>
                    ))}
                  </div>
                  <button type="button" class="btn ghost small" onClick={() => setPhase('work')}>
                    ← Še merim
                  </button>
                </>
              )}
            </div>
          )}

          {mode === 'game' && call && phase === 'debrief' && score && (
            <Debrief score={score} fault={faultById.get(call.fault)!} readings={readings} onNext={nextCall} last={callIdx + 1 === day!.calls.length} />
          )}

          {mode === 'game' && day && phase === 'dayEnd' && (
            <div class="panel-in center">
              <p class="eyebrow">Konec delovnika · {clockText(clock)}</p>
              <h2>{day.title}</h2>
              <p class="big-stars" aria-label="Zvezdice za dan">
                {dayScores.map((s) => '★'.repeat(s.stars) + '☆'.repeat(3 - s.stars)).join('  ')}
              </p>
              <p>
                Skupaj <strong>{dayScores.reduce((s, x) => s + x.points, 0)} točk</strong> · rešenih {dayScores.filter((s) => s.solved).length}/{dayScores.length}
              </p>
              <div class="row">
                {dayIdx! + 1 < days.length && (
                  <button type="button" class="btn" onClick={() => startDay(dayIdx! + 1)}>
                    Naslednji dan →
                  </button>
                )}
                <button type="button" class="btn secondary" onClick={() => startDay(dayIdx!)}>
                  Ponovi dan
                </button>
                <button type="button" class="btn ghost" onClick={() => (setPhase('days'), resetScene())}>
                  Vsi dnevi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReadingRow({ r }: { r: Reading }) {
  if (r.text)
    return (
      <li class="reading info">
        <strong>{r.label}</strong>
        <span>{r.text}</span>
      </li>
    );
  const [lo, hi] = r.range!;
  const span = hi - lo;
  const min = lo - span;
  const max = hi + span;
  const pct = Math.max(2, Math.min(98, ((r.value! - min) / (max - min)) * 100));
  return (
    <li class={`reading z-${r.zone}`}>
      <strong>{r.label}</strong>
      <span class="val">
        {String(r.value).replace('.', ',')} {r.unit}
      </span>
      <span class={`zone z-${r.zone}`}>
        {r.zone === 'low' ? '▼ ' : r.zone === 'high' ? '▲ ' : ''}
        {ZONE_LABEL[r.zone]}
      </span>
      <span class="scale" aria-hidden="true">
        <span class="okband" />
        <span class="dot" style={`left:${pct}%`} />
      </span>
    </li>
  );
}

function Debrief({ score, fault, readings, onNext, last }: { score: Score; fault: FaultText; readings: Record<string, Reading>; onNext: () => void; last: boolean }) {
  const refrigerant = ['premalo-hladiva', 'prevec-hladiva', 'eev'].includes(fault.id);
  void readings;
  return (
    <div class="panel-in">
      <p class="eyebrow">{score.solved ? 'Rešeno' : 'Tokrat ne'}</p>
      <h2>{fault.name}</h2>
      <p class="big-stars" aria-label={`${score.stars} od 3 zvezdic`}>
        {'★'.repeat(score.stars)}
        {'☆'.repeat(3 - score.stars)}
      </p>
      <ul class="notes">
        {score.notes.map((n) => (
          <li key={n.text}>
            <span>{n.text}</span>
            <strong class={n.points < 0 ? 'neg' : ''}>{n.points > 0 ? '+' : ''}{n.points}</strong>
          </li>
        ))}
        <li class="sum">
          <span>Skupaj ({score.minutes} min meritev)</span>
          <strong>{score.points}</strong>
        </li>
      </ul>
      <h3>Vzorec</h3>
      <p>{fault.pattern}</p>
      <h3>Zakaj</h3>
      <p>{fault.why}</p>
      <h3>Popravilo</h3>
      <p>{fault.fix}</p>
      <h3>Preverjanje</h3>
      <p>{fault.verify}</p>
      {refrigerant && <p class="safety">⚠ Poseg v krog hladiva (polnjenje, praznjenje, menjava ventila) sme opraviti samo serviser s spričevalom za delo s hladivi.</p>}
      <button type="button" class="btn wide" onClick={onNext}>
        {last ? 'Konec dneva →' : 'Naslednji klic →'}
      </button>
    </div>
  );
}

function LearnPanel({
  group,
  setGroup,
  opMode,
  changeMode,
  parts,
  tourParts,
  selected,
  step,
  goTour,
  selectPart,
  lessonUrl,
}: {
  group: Group | 'vse';
  setGroup: (g: Group | 'vse') => void;
  opMode: OperatingMode;
  changeMode: (m: OperatingMode) => void;
  parts: Part[];
  tourParts: Part[];
  selected: Part | null;
  step: number;
  goTour: (n: number) => void;
  selectPart: (id: string | null) => void;
  lessonUrl: string;
}) {
  if (step > 0) {
    const p = tourParts[step - 1];
    return (
      <div class="panel-in">
        <p class="eyebrow">Krog hladiva · korak {step} od 4</p>
        <h2>{p.name}</h2>
        <p class="lead-s">{STEP_TEXT[step]}</p>
        <p>
          <em>Predstavljaj si:</em> {p.analogy}
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
    );
  }
  if (selected)
    return (
      <div class="panel-in">
        <p class="eyebrow">
          {selected.where} · <span lang="en">{selected.en}</span>
        </p>
        <h2>{selected.name}</h2>
        <p class="lead-s">{selected.what}</p>
        <p>
          <em>Predstavljaj si:</em> {selected.analogy}
        </p>
        <h3>Tipične napake</h3>
        <ul>
          {selected.faults.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <button type="button" class="btn secondary" onClick={() => selectPart(null)}>
          ← Vsi deli
        </button>
      </div>
    );
  return (
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
        Najprej razumi razliko med simptomom in vzrokom: <a href={lessonUrl}>lekcija 0.1</a>.
      </p>
    </div>
  );
}
