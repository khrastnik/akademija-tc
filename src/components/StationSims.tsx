// Štiri postaje kroga hladiva v živo: vsaka mini simulacija ima en drsnik in pokaže posledico.
// Poenostavljen model – kaže smer sprememb, ne pravih vrednosti.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import './station-sims.css';

type Pt = [number, number];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const frac = (v: number) => v - Math.floor(v);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
function mix(c1: string, c2: string, k: number) {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [a, b] = [p(c1), p(c2)];
  return `rgb(${a.map((x, i) => Math.round(lerp(x, b[i], clamp(k, 0, 1)))).join(',')})`;
}

/** Pot iz ravnih odsekov; at(s) vrne točko pri deležu poti s ∈ [0, 1]. */
function makePath(pts: Pt[]) {
  const segs: { a: Pt; b: Pt; len: number; start: number }[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ a, b, len, start: total });
    total += len;
  }
  const at = (s: number): Pt => {
    const d = clamp(s, 0, 1) * total;
    const seg = segs.find((x) => d <= x.start + x.len) ?? segs[segs.length - 1];
    const k = seg.len ? (d - seg.start) / seg.len : 0;
    return [lerp(seg.a[0], seg.b[0], k), lerp(seg.a[1], seg.b[1], k)];
  };
  const d = 'M' + pts.map((p) => p.join(' ')).join(' L');
  const part = (s0: number, s1: number) => {
    const n = 24;
    const out: Pt[] = [];
    for (let i = 0; i <= n; i++) out.push(at(lerp(s0, s1, i / n)));
    return 'M' + out.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L');
  };
  return { at, d, part };
}

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Čas animacije v sekundah; teče le, ko je zavihek viden in uporabnik ni izbral manj gibanja. */
function useTime(ref: { current: Element | null }) {
  const [t, setT] = useState(0.37);
  useEffect(() => {
    if (reducedMotion()) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const el = ref.current as HTMLElement | null;
      if (document.hidden || !el || el.offsetParent === null) return;
      setT((x) => x + dt);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}

function Slider(props: { label: string; value: number; min: number; max: number; step?: number; onInput: (v: number) => void; text: string; marks?: [string, string] }) {
  return (
    <label class="ss-slider">
      <span class="ss-slider-top">
        <span>{props.label}</span>
        <strong>{props.text}</strong>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        aria-valuetext={props.text}
        onInput={(e) => props.onInput(Number((e.target as HTMLInputElement).value))}
      />
      {props.marks && (
        <span class="ss-marks" aria-hidden="true">
          <span>{props.marks[0]}</span>
          <span>{props.marks[1]}</span>
        </span>
      )}
    </label>
  );
}

function Meter({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'hot' | 'cold' | 'bad' }) {
  return (
    <div class={`ss-meter ss-${tone}`}>
      <span>{label}</span>
      <span class="ss-bar" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamp(value, 0, 1) * 100)}>
        <span style={`width:${clamp(value, 0, 1) * 100}%`} />
      </span>
    </div>
  );
}

function Verdict({ kind, children }: { kind: 'ok' | 'warn' | 'bad'; children: ComponentChildren }) {
  return (
    <p class={`ss-verdict ss-v-${kind}`} aria-live="polite">
      <span aria-hidden="true">{kind === 'ok' ? '✓ ' : kind === 'warn' ? '◐ ' : '⚠ '}</span>
      {children}
    </p>
  );
}

// ---------------------------------------------------------------- 1 Uparjalnik
const EVAP = makePath([
  [16, 166],
  [300, 166],
  [300, 124],
  [60, 124],
  [60, 82],
  [300, 82],
  [300, 40],
  [344, 40],
]);

function Evaporator({ onTouch }: { onTouch: () => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const t = useTime(ref);
  const [air, setAir] = useState(70);
  const [temp, setTemp] = useState(2);
  const heat = (air / 100) * clamp((temp + 20) / 30, 0.1, 1.2);
  // kje vse hladivo zavre: več toplote → prej
  const b = clamp(1.15 - heat * 0.75, 0.22, 1.2);
  // zrak: na vstopu barva po zunanji temperaturi, za lamelami ohlajen (modrejši)
  const warmth = (temp + 15) / 30;
  const n = 26;
  const speed = 0.055;
  const verdict =
    b < 0.6 ? (
      <Verdict kind="warn">Veliko toplote: hladivo zavre že na začetku, para se potem še dolgo greje – pregrevanje je visoko.</Verdict>
    ) : b <= 0.97 ? (
      <Verdict kind="ok">Prav tako: hladivo zavre proti koncu, na izhodu je samo para – malo pregreta.</Verdict>
    ) : (
      <Verdict kind="bad">Premalo toplote: na izhodu so še kapljice tekočine – nevarno za kompresor. Ventil (postaja 4) bi moral spustiti manj hladiva.</Verdict>
    );
  return (
    <div class="ss-body">
      <svg ref={ref} viewBox="0 0 360 200" role="img" aria-label={`Uparjalnik: hladivo zavre pri ${Math.round(Math.min(b, 1) * 100)} % poti.`}>
        <rect x="40" y="26" width="276" height="156" rx="8" class="ss-coil" />
        {Array.from({ length: 23 }, (_, i) => (
          <line key={i} x1={52 + i * 12} y1="30" x2={52 + i * 12} y2="178" class="ss-fin" />
        ))}
        {/* zrak skozi lamele: zunaj teče zrak z zunanjo temperaturo, za lamelami je hladnejši */}
        {[61, 103, 145].map((y, row) =>
          Array.from({ length: 4 }, (_, i) => {
            const k = frac(i / 4 + t * 0.12 * (0.25 + air / 100) + row * 0.13);
            const x = lerp(352, 8, k);
            const opacity = air < 5 ? 0 : 0.45 + (air / 100) * 0.55;
            const color = mix('#2f7fd1', '#e8902a', warmth * (1 - k * 0.8));
            return <path key={`${row}-${i}`} d={`M${x} ${y} l-16 0 m5 -5 l-5 5 l5 5`} class="ss-air" stroke={color} style={`opacity:${opacity}`} />;
          }),
        )}
        <path d={EVAP.d} class="ss-tube" />
        {b <= 1 && <path d={EVAP.part(b, 1)} class="ss-superheat" />}
        {Array.from({ length: n }, (_, i) => {
          const s = frac(i / n + t * speed);
          const [x, y] = EVAP.at(s);
          if (s < b) {
            const v = clamp(s / b, 0, 1);
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="4.6" class="ss-liquid-cold" />
                <circle cx={x + 1} cy={y - 1} r={0.8 + v * 2.6} class="ss-bubble" />
              </g>
            );
          }
          return <circle key={i} cx={x} cy={y} r="4.4" class="ss-vapor-cold" />;
        })}
        {b <= 1 &&
          (() => {
            const [x, y] = EVAP.at(b);
            return (
              <g>
                <circle cx={x} cy={y} r="9" class="ss-mark" />
                <text x={x} y={y - 13} class="ss-label ss-center">vse zavrelo</text>
              </g>
            );
          })()}
        <text x="16" y="194" class="ss-label">tekočina iz ventila →</text>
        <text x="344" y="22" class="ss-label ss-end">para v kompresor</text>
        <text x="352" y="106" class="ss-label ss-end ss-air-label">← zrak</text>
        {b <= 0.92 &&
          (() => {
            const [x, y] = EVAP.at((b + 1) / 2);
            return (
              <text x={x} y={y + 20} class="ss-label ss-center ss-sh-label">
                pregrevanje
              </text>
            );
          })()}
        {b > 1 && (
          <text x="344" y="58" class="ss-label ss-end ss-alarm">
            še tekočina!
          </text>
        )}
      </svg>
      <div class="ss-controls">
        <Slider
          label="Pretok zraka (ventilator, listje)"
          value={air}
          min={0}
          max={100}
          onInput={(v) => (setAir(v), onTouch())}
          text={air < 15 ? 'skoraj nič – zamašeno' : air < 50 ? 'oviran' : 'prost'}
          marks={['listje, led', 'čiste lamele']}
        />
        <Slider label="Zunanja temperatura" value={temp} min={-15} max={15} onInput={(v) => (setTemp(v), onTouch())} text={`${temp > 0 ? '+' : ''}${temp} °C`} marks={['mraz', 'toplo']} />
        <Meter label="Toplota iz zraka" value={heat / 1.2} tone="hot" />
      </div>
      {verdict}
      <p class="ss-try">Poskusi: potisni pretok zraka na nič, kot bi lamele prekrilo listje – in poglej izhod.</p>
    </div>
  );
}

// ---------------------------------------------------------------- 2 Kompresor
function Compressor({ onTouch }: { onTouch: () => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const t = useTime(ref);
  const [spd, setSpd] = useState(50);
  const s = spd / 100;
  const phase = frac(t * (0.25 + s * 0.9));
  // faze: sesanje (bat gre levo), stiskanje (desno), iztis (ventil odprt)
  const head = 268;
  const maxW = 128;
  const minW = 16;
  let w: number;
  let comp = 0;
  let stage: 'sesanje' | 'stiskanje' | 'iztis';
  if (phase < 0.45) {
    w = lerp(minW, maxW, phase / 0.45);
    stage = 'sesanje';
  } else if (phase < 0.82) {
    const k = (phase - 0.45) / 0.37;
    w = lerp(maxW, maxW * 0.38, k);
    comp = k;
    stage = 'stiskanje';
  } else {
    const k = (phase - 0.82) / 0.18;
    w = lerp(maxW * 0.38, minW, k);
    comp = 1;
    stage = 'iztis';
  }
  const px = head - w;
  const gasColor = mix('#5aa9ff', '#e5462e', comp * (0.65 + s * 0.35));
  const dots = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      const jx = Math.sin(t * 7 + r * 3 + c) * 1.6;
      const jy = Math.cos(t * 6 + c * 2 + r) * 1.6;
      dots.push(<circle key={`${r}${c}`} cx={px + ((c + 0.5) / 4) * w + jx} cy={74 + ((r + 0.5) / 4) * 52 + jy} r={2.8} fill={gasColor} />);
    }
  const angle = phase * Math.PI * 2;
  const crank: Pt = [62 + Math.cos(angle) * 22, 100 + Math.sin(angle) * 22];
  const inletOpen = stage === 'sesanje';
  const outletOpen = stage === 'iztis';
  const low = 0.62 - s * 0.3;
  const high = 0.45 + s * 0.45;
  return (
    <div class="ss-body">
      <svg ref={ref} viewBox="0 0 360 200" role="img" aria-label={`Kompresor: faza ${stage}, hitrost ${spd} %.`}>
        {/* sesalni vod zgoraj, tlačni vod spodaj */}
        <path d={`M${head + 18} 8 V64`} class="ss-pipe-cold" />
        <path d={`M${head + 18} 136 V176 H352`} class="ss-pipe-hot" />
        {inletOpen &&
          [0, 1, 2].map((i) => {
            const k = frac(t * (0.8 + s) + i / 3);
            return <circle key={i} cx={head + 18} cy={lerp(10, 62, k)} r="2.8" fill="#5aa9ff" />;
          })}
        {outletOpen &&
          [0, 1, 2, 3].map((i) => {
            const k = frac(t * (1 + s * 1.5) + i / 4);
            const [x, y] = k < 0.4 ? [head + 18, lerp(138, 176, k / 0.4)] : [lerp(head + 18, 352, (k - 0.4) / 0.6), 176];
            return <circle key={i} cx={x} cy={y} r="3" fill="#e5462e" />;
          })}
        <rect x="128" y="66" width={head - 128 + 4} height="68" rx="4" class="ss-cyl" />
        <rect x={head} y="60" width="36" height="80" rx="6" class="ss-head" />
        <rect x={head + 10} y="58" width="16" height="8" rx="2" class={inletOpen ? 'ss-valve-open' : 'ss-valve'} />
        <rect x={head + 10} y="134" width="16" height="8" rx="2" class={outletOpen ? 'ss-valve-open' : 'ss-valve'} />
        {dots}
        <rect x={px - 12} y="68" width="12" height="64" rx="3" class="ss-piston" />
        <circle cx="62" cy="100" r="28" class="ss-wheel" />
        <line x1={crank[0]} y1={crank[1]} x2={px - 12} y2="100" class="ss-rod" />
        <circle cx={crank[0]} cy={crank[1]} r="4" class="ss-pin" />
        <text x={head + 30} y="20" class="ss-label">sesanje</text>
        <text x="352" y="194" class="ss-label ss-end">vroča para</text>
        <text x="186" y="152" class="ss-label ss-center">{stage}</text>
        <Gauge x={30} y={170} value={low} label="NT" tone="cold" />
        <Gauge x={96} y={170} value={high} label="VT" tone="hot" />
      </svg>
      <div class="ss-controls">
        <Slider label="Hitrost kompresorja (inverter)" value={spd} min={15} max={100} onInput={(v) => (setSpd(v), onTouch())} text={`${spd} %`} marks={['počasi', 'polna moč']} />
        <Meter label="Temperatura tlačnega voda" value={0.35 + s * 0.6} tone="hot" />
        <Meter label="Poraba elektrike" value={0.2 + s * 0.8} tone="neutral" />
        <Meter label="Toplota za hišo" value={0.25 + s * 0.75} tone="hot" />
      </div>
      <Verdict kind="ok">Ko bat stisne paro v manjši prostor, se delci gnetejo – tlak in temperatura narasteta. Zato je tlačni vod vroč. Hitrejši kompresor premakne več hladiva: več toplote, a tudi več elektrike.</Verdict>
      <p class="ss-try">Pravi kompresorji v toplotnih črpalkah so večinoma spiralni ali rotacijski – bat je tu le za nazornost. Princip stiskanja je enak.</p>
    </div>
  );
}

function Gauge({ x, y, value, label, tone }: { x: number; y: number; value: number; label: string; tone: 'hot' | 'cold' }) {
  const a = Math.PI * (1 - clamp(value, 0, 1));
  return (
    <g class={`ss-gauge ss-${tone}`}>
      <path d={`M${x - 20} ${y} A20 20 0 0 1 ${x + 20} ${y}`} class="ss-gauge-arc" />
      <line x1={x} y1={y} x2={x + Math.cos(a) * 16} y2={y - Math.sin(a) * 16} class="ss-needle" />
      <circle cx={x} cy={y} r="2.5" class="ss-pin" />
      <text x={x} y={y + 14} class="ss-label ss-center">{label}</text>
    </g>
  );
}

// ---------------------------------------------------------------- 3 Kondenzator
const COND_REF = makePath([
  [344, 78],
  [16, 78],
]);
const COND_WAT = makePath([
  [16, 142],
  [344, 142],
]);

function Condenser({ onTouch }: { onTouch: () => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const t = useTime(ref);
  const [flow, setFlow] = useState(70);
  const w = Math.max(0.04, flow / 100);
  // kje se vsa para utekočini: manj vode → kasneje (ali nikoli)
  const c = clamp(0.28 + (1 - w) * 0.88, 0.28, 1.2);
  const exitWarm = clamp(0.35 / w, 0.35, 1);
  const pressure = clamp(0.35 + (1 - w) * 0.7, 0, 1);
  const n = 18;
  const verdict =
    c > 1 ? (
      <Verdict kind="bad">Voda teče prepočasi: para se ne utegne utekočiniti, toplota ostaja v hladivu – tlak raste, krmilnik ustavi kompresor z napako »visok tlak«.</Verdict>
    ) : c > 0.8 ? (
      <Verdict kind="warn">Pretok je majhen: para se utekočini šele na koncu, voda gre ven zelo topla – tlak je višji kot običajno.</Verdict>
    ) : (
      <Verdict kind="ok">Prav tako: para odda toploto vodi in se utekočini, tekočina se na koncu še malo ohladi (podhlajevanje).</Verdict>
    );
  return (
    <div class="ss-body">
      <svg ref={ref} viewBox="0 0 360 200" role="img" aria-label={`Kondenzator: pretok vode ${flow} %, para se utekočini pri ${Math.round(Math.min(c, 1) * 100)} % poti.`}>
        <rect x="8" y="52" width="344" height="116" rx="10" class="ss-hx" />
        <line x1="12" y1="110" x2="348" y2="110" class="ss-plate" />
        <path d={COND_REF.d} class="ss-chan" />
        <path d={COND_WAT.d} class="ss-chan" />
        {c <= 1 && <path d={COND_REF.part(c, 1)} class="ss-subcool" />}
        {/* toplota prehaja skozi ploščo tam, kjer je še para */}
        {Array.from({ length: 7 }, (_, i) => {
          const s = (i + 0.5) / 7;
          if (s > Math.min(c, 1)) return null;
          const [x] = COND_REF.at(s);
          const k = frac(t * 0.9 + i * 0.37);
          return <path key={i} d={`M${x} ${lerp(88, 128, k)} q3 -4 0 -8`} class="ss-heat" style={`opacity:${1 - k}`} />;
        })}
        {Array.from({ length: n }, (_, i) => {
          const s = frac(i / n + t * 0.05);
          const [x, y] = COND_REF.at(s);
          return s < c ? <circle key={i} cx={x} cy={y} r="4.8" class="ss-vapor-hot" /> : <circle key={i} cx={x} cy={y} r="4.4" class="ss-liquid-hot" />;
        })}
        {Array.from({ length: 16 }, (_, i) => {
          const s = frac(i / 16 + t * 0.03 * (0.15 + w * 1.4));
          const [x, y] = COND_WAT.at(s);
          return <circle key={i} cx={x} cy={y} r="4" fill={mix('#3fb8b0', '#f08a3c', s * exitWarm)} />;
        })}
        <text x="344" y="44" class="ss-label ss-end">← vroča para iz kompresorja</text>
        <text x="16" y="44" class="ss-label">tekočina k ventilu</text>
        <text x="16" y="186" class="ss-label">povratna voda →</text>
        <text x="344" y="186" class="ss-label ss-end">topla voda v radiatorje</text>
        {c > 1 && (
          <text x="16" y="100" class="ss-label ss-alarm">
            še para!
          </text>
        )}
      </svg>
      <div class="ss-controls">
        <Slider
          label="Pretok vode (obtočna črpalka, filter)"
          value={flow}
          min={0}
          max={100}
          onInput={(v) => (setFlow(v), onTouch())}
          text={flow < 15 ? 'skoraj stoji – zamašen filter' : flow < 45 ? 'majhen' : 'normalen'}
          marks={['zamašen filter', 'čist krog']}
        />
        <Meter label="Tlak na visoki strani" value={pressure} tone={pressure > 0.85 ? 'bad' : 'hot'} />
        <Meter label="Temperatura vode na izstopu" value={exitWarm} tone="hot" />
      </div>
      {verdict}
      <p class="ss-try">Poskusi: zapri pretok vode, kot bi se zamašil filter – in poglej, kaj se zgodi s paro in tlakom.</p>
    </div>
  );
}

// ---------------------------------------------------------------- 4 Ekspanzijski ventil
function Valve({ onTouch }: { onTouch: () => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const t = useTime(ref);
  const [open, setOpen] = useState(50);
  const o = open / 100;
  const gap = 2 + o * 18;
  const fill = clamp(o * 1.45, 0, 1.25);
  const flowSpeed = 0.15 + o * 0.9;
  const after = 0.55 - o * 0.25;
  const verdict =
    fill < 0.45 ? (
      <Verdict kind="warn">Ventil je preveč zaprt: v uparjalnik pride premalo hladiva – uparjalnik je lačen, pregrevanje visoko, naprava slabo greje.</Verdict>
    ) : fill <= 0.98 ? (
      <Verdict kind="ok">Prav tako: za režo tlak pade, hladivo se ohladi in v uparjalnik pride ravno prav hladiva.</Verdict>
    ) : (
      <Verdict kind="bad">Ventil je preveč odprt: hladiva je preveč, ne zavre do konca – kapljice lahko dosežejo kompresor.</Verdict>
    );
  return (
    <div class="ss-body">
      <svg ref={ref} viewBox="0 0 360 200" role="img" aria-label={`Ekspanzijski ventil: odprtost ${open} %, uparjalnik napolnjen ${Math.round(Math.min(fill, 1) * 100)} %.`}>
        <path d="M8 110 H150" class="ss-pipe-warm" />
        <path d="M200 110 H290" class="ss-pipe-cold" />
        {Array.from({ length: 12 }, (_, i) => {
          const k = frac(i / 12 + t * 0.35 * flowSpeed);
          return <circle key={i} cx={lerp(10, 150, k)} cy={110 + Math.sin(i * 2.1) * 2} r="4.4" class="ss-liquid-hot" />;
        })}
        {Array.from({ length: 16 }, (_, i) => {
          if (i / 16 > o + 0.08) return null;
          const k = frac(i / 16 + t * 0.6 * flowSpeed);
          const spread = (Math.sin(i * 7.3) * 0.5 + 0.5) * Math.min(1, k * 3) * (gap * 0.5 + 6);
          const y = 110 + (i % 2 ? spread : -spread);
          return i % 3 === 0 ? <circle key={i} cx={lerp(202, 288, k)} cy={y} r="3.2" class="ss-vapor-cold" /> : <circle key={i} cx={lerp(202, 288, k)} cy={y} r="3" class="ss-liquid-cold" />;
        })}
        <rect x="150" y="70" width="50" height="80" rx="8" class="ss-valve-body" />
        <rect x="160" y="96" width="30" height={Math.max(0, 14 - gap * 0.2)} class="ss-seat" />
        <rect x="168" y={20} width="14" height={Math.max(10, 104 - gap)} rx="3" class="ss-needle-bar" />
        <rect x="160" y="14" width="30" height="20" rx="4" class="ss-coil-box" />
        <text x="175" y="28" class="ss-label ss-center ss-light">EEV</text>
        {/* uparjalnik: koliko tekočine dobi */}
        <rect x="300" y="50" width="44" height="120" rx="6" class="ss-evap-box" />
        <rect x="304" y={166 - Math.min(fill, 1) * 112} width="36" height={Math.min(fill, 1) * 112} rx="4" class={fill > 0.98 ? 'ss-evap-flood' : 'ss-evap-fill'} />
        <text x="322" y="44" class="ss-label ss-center">uparjalnik</text>
        <Thermo x={60} value={0.75} label="pred" tone="hot" />
        <Thermo x={244} value={after} label="za" tone="cold" />
        <text x="10" y="188" class="ss-label">visok tlak</text>
        <text x="200" y="188" class="ss-label">nizek tlak</text>
      </svg>
      <div class="ss-controls">
        <Slider label="Odprtost ventila" value={open} min={5} max={100} onInput={(v) => (setOpen(v), onTouch())} text={`${open} %`} marks={['skoraj zaprt', 'na široko']} />
        <Meter label="Hladivo v uparjalniku" value={Math.min(fill, 1)} tone={fill > 0.98 ? 'bad' : 'cold'} />
      </div>
      {verdict}
      <p class="ss-try">Krmilnik ventil premika sam – tako, da je pregrevanje ravno prav. Ti ga tu premikaš ročno, da vidiš, zakaj je to pomembno.</p>
    </div>
  );
}

function Thermo({ x, value, label, tone }: { x: number; value: number; label: string; tone: 'hot' | 'cold' }) {
  const h = 46 * clamp(value, 0, 1);
  return (
    <g class={`ss-thermo ss-${tone}`}>
      <rect x={x - 4} y="40" width="8" height="50" rx="4" class="ss-thermo-glass" />
      <rect x={x - 2} y={88 - h} width="4" height={h} rx="2" class="ss-thermo-fill" />
      <circle cx={x} cy="92" r="6" class="ss-thermo-fill" />
      <text x={x} y="34" class="ss-label ss-center">{label}</text>
    </g>
  );
}

// ---------------------------------------------------------------- ovoj z zavihki
const STATIONS = [
  { id: 'uparjalnik', n: 1, name: 'Uparjalnik', task: 'vzame toploto zraku', C: Evaporator },
  { id: 'kompresor', n: 2, name: 'Kompresor', task: 'dvigne tlak in temperaturo', C: Compressor },
  { id: 'kondenzator', n: 3, name: 'Kondenzator', task: 'odda toploto vodi', C: Condenser },
  { id: 'ventil', n: 4, name: 'Ekspanzijski ventil', task: 'zniža tlak', C: Valve },
];

export default function StationSims({ widgetId }: { widgetId?: string }) {
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const doneRef = useRef(false);
  const touch = (id: string) =>
    setTouched((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      if (next.size === STATIONS.length && !doneRef.current) {
        doneRef.current = true;
        document.dispatchEvent(new CustomEvent('lesson:unlock', { detail: { card: 'widget', id: widgetId } }));
      }
      return next;
    });
  const st = STATIONS[active];
  const C = st.C;
  return (
    <div class="ss">
      <div class="ss-tabs" role="tablist" aria-label="Postaje kroga hladiva">
        {STATIONS.map((x, i) => (
          <button key={x.id} role="tab" type="button" aria-selected={i === active} class={i === active ? 'on' : ''} onClick={() => setActive(i)}>
            <span class={`ss-n ${touched.has(x.id) ? 'done' : ''}`}>{touched.has(x.id) ? '✓' : x.n}</span>
            <span class="ss-tab-name">{x.name}</span>
          </button>
        ))}
      </div>
      <p class="ss-title">
        <strong>
          {st.n}. {st.name}
        </strong>{' '}
        – {st.task}
      </p>
      <C key={st.id} onTouch={() => touch(st.id)} />
      <div class="ss-foot">
        <span class="muted">
          Preizkušeno {touched.size} / {STATIONS.length} – pri vsaki postaji premakni drsnik.
        </span>
        {active < STATIONS.length - 1 && (
          <button type="button" class="btn small" onClick={() => setActive(active + 1)}>
            Naslednja postaja →
          </button>
        )}
      </div>
      {touched.size === STATIONS.length && <p class="ss-done">Vse štiri postaje preizkušene ✓ – zdaj veš, kaj vsaka naredi in kaj se zgodi, ko ne more.</p>}
      <p class="ss-note">Poenostavljen učni model: kaže smer sprememb, ne pravih vrednosti.</p>
    </div>
  );
}
