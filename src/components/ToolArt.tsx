// Gradniki za risbe merilne opreme (SVG, viewBox 0 0 320 220, vedno svetla podlaga kot 3D prizor).
import type { ComponentChildren } from 'preact';

export const C = {
  metal: '#c9ced3',
  metalDark: '#7d8890',
  dark: '#2b2f33',
  blue: '#2f7fd1',
  red: '#d9412b',
  yellow: '#f2c230',
  copper: '#b87333',
  screen: '#0d2a24',
  screenText: '#7dffcf',
  white: '#ffffff',
  ink: '#3c3a36',
};

/** Številčnica: v = 0…1 položaj kazalca na loku 270°. */
export function Gauge({ cx, cy, r, ring, v, label, zones }: { cx: number; cy: number; r: number; ring: string; v: number; label?: string; zones?: { from: number; to: number; color: string }[] }) {
  const t = Math.max(0, Math.min(1, v));
  const ang = (x: number) => ((-225 + x * 270) * Math.PI) / 180;
  const pt = (x: number, rr: number) => [cx + rr * Math.cos(ang(x)), cy + rr * Math.sin(ang(x))];
  const arc = (a: number, b: number, rr: number) => {
    const [x1, y1] = pt(a, rr);
    const [x2, y2] = pt(b, rr);
    return `M${x1},${y1} A${rr},${rr} 0 ${(b - a) * 270 > 180 ? 1 : 0} 1 ${x2},${y2}`;
  };
  const [nx, ny] = pt(t, r * 0.72);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={ring} stroke={C.metalDark} stroke-width="2" />
      <circle cx={cx} cy={cy} r={r - 6} fill={C.white} />
      {zones?.map((z) => <path d={arc(z.from, z.to, r - 12)} stroke={z.color} stroke-width="6" fill="none" />)}
      {Array.from({ length: 21 }, (_, i) => {
        const x = i / 20;
        const [x1, y1] = pt(x, r - 8);
        const [x2, y2] = pt(x, i % 5 === 0 ? r - 17 : r - 13);
        return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.ink} stroke-width={i % 5 === 0 ? 2 : 1} />;
      })}
      {label && (
        <text x={cx} y={cy + r * 0.45} text-anchor="middle" font-size={r * 0.24} font-weight="800" fill={C.ink}>
          {label}
        </text>
      )}
      <line class="tl-needle" x1={cx} y1={cy} x2={nx} y2={ny} stroke={C.red} stroke-width="2.5" stroke-linecap="round" />
      <circle cx={cx} cy={cy} r="4" fill={C.dark} />
    </g>
  );
}
export const Hose = ({ d, color }: { d: string; color: string }) => <path d={d} stroke={color} stroke-width="7" fill="none" stroke-linecap="round" />;
export function Screen({ x, y, w, h, lines, size = 13, alarm = false }: { x: number; y: number; w: number; h: number; lines: string[]; size?: number; alarm?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="5" fill={alarm ? '#3a0e0a' : C.screen} stroke="#111" />
      {lines.map((l, i) => (
        <text x={x + 7} y={y + 6 + size * (i + 1)} font-size={size} font-family="ui-monospace, Consolas, monospace" font-weight="700" fill={alarm ? '#ff7b6b' : C.screenText}>
          {l}
        </text>
      ))}
    </g>
  );
}
export const Knob = ({ x, y, color, open }: { x: number; y: number; color: string; open?: boolean }) => (
  <g>
    <rect x={x} y={y} width="34" height="24" rx="6" fill={color} stroke={C.metalDark} />
    {[6, 12, 18, 24, 30].map((dx) => (
      <line x1={x + dx} y1={y + 3} x2={x + dx} y2={y + 21} stroke="rgba(0,0,0,.25)" stroke-width="1.5" />
    ))}
    {open !== undefined && (
      <text x={x + 17} y={y + 38} font-size="10" font-weight="800" text-anchor="middle" fill={C.ink}>
        {open ? 'ODPRT' : 'ZAPRT'}
      </text>
    )}
  </g>
);
export const Pipe = ({ y, h = 26, x1 = 0, x2 = 320 }: { y: number; h?: number; x1?: number; x2?: number }) => (
  <g>
    <rect x={x1} y={y} width={x2 - x1} height={h} fill={C.copper} />
    <rect x={x1} y={y + 4} width={x2 - x1} height={4} fill="#d99a5e" opacity=".8" />
  </g>
);
export const Probe = ({ d, color }: { d: string; color: string }) => <path d={d} stroke={color} stroke-width="4" fill="none" stroke-linecap="round" />;

/** Del naprave, ki ga klikneš (miška, prst ali tipkovnica). Utripajoča pika pokaže, kje lahko klikneš. */
export function Hit({ label, onClick, hint, children }: { label: string; onClick: () => void; hint?: [number, number]; children: ComponentChildren }) {
  return (
    <g
      class="tl-hit"
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <title>{label}</title>
      {children}
      {hint && <circle class="tl-pulse" cx={hint[0]} cy={hint[1]} r="7" />}
    </g>
  );
}
