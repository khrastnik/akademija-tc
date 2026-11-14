// Delujoče naprave za stran »Merilna oprema«. Vsaka ima stanje: klikneš ventil, stikalo ali tipalo in naprava se odzove.
// Vrednosti so učni primer (R32, ogrevanje pri okoli +2 °C zunaj), ne podatki proizvajalca.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren, JSX } from 'preact';
import { satTemp, satPressure, gaugeToAbs, type PTPoint } from '../../packages/engine/src/ptcalc';
import { C, Gauge, Hose, Screen, Knob, Pipe, Probe, Hit } from './ToolArt';
import type { ToolId } from './tool-ids';

export interface PT {
  id: string;
  points: PTPoint[];
}
export interface SimProps {
  say: (text: string) => void;
  tables: PT[];
}
type Sim = (p: SimProps) => JSX.Element;

const f1 = (v: number) => v.toLocaleString('sl-SI', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const Svg = ({ children, label }: { children: ComponentChildren; label: string }) => (
  <svg viewBox="0 0 320 220" class="tl-svg" role="group" aria-label={label}>
    {children}
  </svg>
);
const Readout = ({ items }: { items: [string, string, ('ok' | 'bad' | '')?][] }) => (
  <dl class="tl-read">
    {items.map(([k, v, s]) => (
      <div class={s ?? ''}>
        <dt>{k}</dt>
        <dd>{v}</dd>
      </div>
    ))}
  </dl>
);
function useTicker(active: boolean, fn: () => void, ms = 250) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => ref.current(), ms);
    return () => clearInterval(t);
  }, [active, ms]);
}
const R32 = (tables: PT[]) => tables.find((t) => t.id === 'R32')?.points ?? [];

// ---------- 1. analogna manometrska baterija ----------
const Manifold: Sim = ({ say, tables }) => {
  const [run, setRun] = useState(true);
  const [lo, setLo] = useState(false);
  const [hi, setHi] = useState(false);
  const pts = R32(tables);
  const rest = (satPressure(pts, 15, 'bubble') ?? 13.8) - 1.013; // mirovanje: tlak nasičenja pri ~15 °C
  const bypass = run && lo && hi;
  const pLo = !run ? rest : bypass ? 13.5 : 6.1;
  const pHi = !run ? rest : bypass ? 15.5 : 22.0;
  const tLo = satTemp(pts, gaugeToAbs(pLo), 'dew');
  const tHi = satTemp(pts, gaugeToAbs(pHi), 'bubble');
  return (
    <div>
      <Svg label="Analogna manometrska baterija">
        <Hose d="M122,162 C122,200 80,190 60,218" color={C.blue} />
        <Hose d="M160,162 L160,218" color={C.yellow} />
        <Hose d="M198,162 C198,200 240,190 260,218" color={C.red} />
        <rect x="104" y="100" width="12" height="20" fill={C.metal} stroke={C.metalDark} />
        <rect x="204" y="100" width="12" height="20" fill={C.metal} stroke={C.metalDark} />
        <rect x="66" y="116" width="188" height="38" rx="9" fill={C.metal} stroke={C.metalDark} stroke-width="2" />
        {[118, 156, 194].map((x) => <rect x={x} y="152" width="8" height="12" fill="#c9a227" stroke="#8a6d12" />)}
        <Hit label={`Modri ventil (NT) – ${lo ? 'zapri' : 'odpri'}`} hint={[51, 135]} onClick={() => {
          setLo(!lo);
          say(!lo ? 'Modri ventil je odprt: nizkotlačna stran je zdaj povezana s srednjo (rumeno) cevjo – to rabiš za vakuum ali polnjenje. Za samo merjenje tlaka ventila ostaneta zaprta, manometra kažeta tudi tako.' : 'Modri ventil je zaprt. NT manometer še vedno kaže tlak v modri cevi.');
        }}>
          <Knob x={34} y={123} color={C.blue} open={lo} />
        </Hit>
        <Hit label={`Rdeči ventil (VT) – ${hi ? 'zapri' : 'odpri'}`} hint={[269, 135]} onClick={() => {
          setHi(!hi);
          say(!hi ? (run && lo ? 'Pozor: oba ventila sta odprta med delovanjem – visoki tlak teče skozi baterijo v nizko stran. Tlaka se izenačujeta, meritev ni več prava, kompresor je lahko v nevarnosti.' : 'Rdeči ventil je odprt: visokotlačna stran je povezana s srednjo cevjo.') : 'Rdeči ventil je zaprt.');
        }}>
          <Knob x={252} y={123} color={C.red} open={hi} />
        </Hit>
        <circle cx="160" cy="135" r="11" fill={bypass ? '#ffd9a8' : '#bfe3ff'} stroke={C.metalDark} stroke-width="2" />
        {bypass && <text x="160" y="139" text-anchor="middle" font-size="12" font-weight="900" fill={C.red}>!</text>}
        <Hit label="NT manometer – razlaga skale" hint={[148, 26]} onClick={() => say('NT (modri) manometer kaže nadtlak na nizkotlačni strani. Notranje skale so temperature nasičenja za posamezna hladiva – odčitaš T uparjanja brez tabele. Zato mora biti na skali tvoje hladivo.')}>
          <Gauge cx={110} cy={58} r={46} ring={C.blue} v={pLo / 20} label="NT" />
        </Hit>
        <Hit label="VT manometer – razlaga skale" hint={[248, 26]} onClick={() => say('VT (rdeči) manometer kaže nadtlak na visokotlačni strani. Iz njegove temperaturne skale odčitaš T kondenzacije – potrebuješ jo za podhlajevanje.')}>
          <Gauge cx={210} cy={58} r={46} ring={C.red} v={pHi / 50} label="VT" />
        </Hit>
      </Svg>
      <div class="tl-controls">
        <button type="button" class={run ? 'on' : ''} onClick={() => {
          setRun(!run);
          say(run ? 'Naprava miruje: tlaka se izenačita na tlak nasičenja pri temperaturi okolice. V mirovanju ne meriš SH in SC – samo po zagonu in ustalitvi.' : 'Naprava deluje: NT pade, VT naraste. Počakaj na ustalitev, nato odčitaj.');
        }}>
          {run ? '⏸ Ustavi napravo' : '▶ Zaženi napravo'}
        </button>
      </div>
      <Readout items={[
        ['NT', `${f1(pLo)} bar → ${tLo !== null ? f1(tLo) : '–'} °C`],
        ['VT', `${f1(pHi)} bar → ${tHi !== null ? f1(tHi) : '–'} °C`],
        ['Stanje', bypass ? 'obvod – napaka' : run ? 'deluje' : 'miruje', bypass ? 'bad' : ''],
      ]} />
    </div>
  );
};

// ---------- 2. digitalna manometrska baterija ----------
const REFS = ['R32', 'R410A', 'R290'];
const DigitalManifold: Sim = ({ say, tables }) => {
  const [ref, setRef] = useState(0);
  const [page, setPage] = useState(0);
  const [clamp, setClamp] = useState(false);
  const pts = tables.find((t) => t.id === REFS[ref])?.points ?? [];
  // dejansko stanje v napravi: R32, T uparjanja −4,1 °C, kondenzacije 37 °C, sesalni vod 2 °C, tekočinski 33 °C
  const real = R32(tables);
  const pLo = (satPressure(real, -4.1, 'dew') ?? 7.1) - 1.013;
  const pHi = (satPressure(real, 37, 'bubble') ?? 23) - 1.013;
  const t0 = satTemp(pts, gaugeToAbs(pLo), 'dew');
  const tc = satTemp(pts, gaugeToAbs(pHi), 'bubble');
  const sh = clamp && t0 !== null ? 2 - t0 : null;
  const sc = clamp && tc !== null ? tc - 33 : null;
  const wrong = REFS[ref] !== 'R32';
  const lines =
    page === 0
      ? [`${REFS[ref].padEnd(5)} NT ${f1(pLo)}`, `T0 ${t0 !== null ? f1(t0) : '--'}°C`, `SH ${sh !== null ? f1(sh) + ' K' : '-- K'}`]
      : [`${REFS[ref].padEnd(5)} VT ${f1(pHi)}`, `Tc ${tc !== null ? f1(tc) : '--'}°C`, `SC ${sc !== null ? f1(sc) + ' K' : '-- K'}`];
  return (
    <div>
      <Svg label="Digitalna manometrska baterija">
        <Hit label={clamp ? 'Snemi tipali temperature' : 'Pritrdi tipali temperature na cevi'} hint={[30, 52]} onClick={() => {
          setClamp(!clamp);
          say(!clamp ? 'Tipali sta na sesalnem in tekočinskem vodu. Baterija zdaj sama izračuna SH in SC.' : 'Brez tipal temperature baterija pokaže le tlak in temperaturo nasičenja – SH in SC ne more izračunati.');
        }}>
          <path d="M30,46 C30,10 80,14 90,24" stroke={C.dark} stroke-width="3" fill="none" />
          <path d="M290,46 C290,10 240,14 230,24" stroke={C.dark} stroke-width="3" fill="none" />
          <rect x="18" y="44" width="24" height="16" rx="4" fill={clamp ? '#2c7a3f' : '#5b6168'} />
          <rect x="278" y="44" width="24" height="16" rx="4" fill={clamp ? '#2c7a3f' : '#5b6168'} />
        </Hit>
        <Hose d="M110,170 C110,200 90,205 88,218" color={C.blue} />
        <Hose d="M160,170 L160,218" color={C.yellow} />
        <Hose d="M210,170 C210,200 230,205 232,218" color={C.red} />
        <rect x="70" y="20" width="180" height="152" rx="18" fill={C.dark} stroke="#111" stroke-width="2" />
        <Screen x={84} y={32} w={152} h={76} lines={lines} size={15} alarm={wrong} />
        <Hit label="Gumb HLADIVO – zamenjaj hladivo" hint={[112, 126]} onClick={() => {
          const n = (ref + 1) % REFS.length;
          setRef(n);
          say(REFS[n] === 'R32' ? 'Izbrano je pravo hladivo (R32, s tablice naprave). Temperature so pravilne.' : `Izbran je ${REFS[n]}, v napravi pa je R32. Tlak je isti, temperature in SH/SC pa so napačne – vedno najprej preveri tablico naprave.`);
        }}>
          <circle cx="112" cy="126" r="9" fill="#5b6168" stroke="#111" />
          <text x="112" y="148" font-size="8" fill="#ddd" text-anchor="middle">HLAD.</text>
        </Hit>
        <Hit label="Gumb ZASLON – NT ali VT stran" hint={[140, 126]} onClick={() => {
          setPage(1 - page);
          say(page === 0 ? 'Zaslon kaže visokotlačno stran: T kondenzacije in podhlajevanje.' : 'Zaslon kaže nizkotlačno stran: T uparjanja in pregrevanje.');
        }}>
          <circle cx="140" cy="126" r="9" fill="#5b6168" stroke="#111" />
          <text x="140" y="148" font-size="8" fill="#ddd" text-anchor="middle">ZASL.</text>
        </Hit>
        {[168, 196].map((x) => <circle cx={x} cy="126" r="9" fill="#5b6168" stroke="#111" />)}
        <Knob x={38} y={130} color={C.blue} />
        <Knob x={248} y={130} color={C.red} />
      </Svg>
      <Readout items={[
        ['Hladivo', REFS[ref], wrong ? 'bad' : 'ok'],
        ['Tipala', clamp ? 'na ceveh' : 'niso pritrjena'],
        ['Zaslon', page === 0 ? 'NT + SH' : 'VT + SC'],
      ]} />
    </div>
  );
};

// ---------- 3. kleščni termometer za cevi ----------
const PipeClamp: Sim = ({ say }) => {
  const [on, setOn] = useState(false);
  const [ins, setIns] = useState(false);
  const t = !on ? 21.0 : ins ? 2.0 : 3.4;
  const dy = on ? 0 : -70;
  return (
    <div>
      <Svg label="Kleščni termometer za cevi">
        <Pipe y={140} />
        <path d={`M200,${96 + dy} C200,60 150,40 116,48`} stroke={C.dark} stroke-width="3" fill="none" />
        <rect x="22" y="18" width="96" height="74" rx="12" fill="#e8e4dc" stroke={C.metalDark} stroke-width="2" />
        <Screen x={32} y={30} w={76} h={32} lines={[`${t < 10 ? ' ' : ''}${f1(t)} °C`]} size={16} />
        <Hit label={on ? 'Snemi klešče s cevi' : 'Pritrdi klešče na cev'} hint={[200, 120 + dy]} onClick={() => {
          setOn(!on);
          if (on) setIns(false);
          say(!on ? 'Klešče so na cevi, a niso izolirane – zrak okoli tipala jih greje, odčitek je previsok.' : 'Klešče v zraku merijo zrak, ne cevi.');
        }}>
          <rect x="186" y={92 + dy} width="28" height="44" rx="5" fill={C.dark} />
          <path d={`M186,${136 + dy} Q170,${153 + dy} 186,${170 + dy} L214,${170 + dy} Q230,${153 + dy} 214,${136 + dy} Z`} fill="none" stroke={C.dark} stroke-width="7" />
        </Hit>
        {on && (
          <Hit label={ins ? 'Odstrani izolacijo' : 'Ovij tipalo z izolacijo'} hint={[236, 182]} onClick={() => {
            setIns(!ins);
            say(!ins ? 'Tipalo je izolirano od zraka – zdaj meri cev. Razlika je lahko več kot 1 K, kar pri SH ali SC pomeni napačno diagnozo.' : 'Brez izolacije zrak spet vpliva na tipalo.');
          }}>
            <rect x="176" y="130" width="48" height="46" rx="6" fill={ins ? 'rgba(60,60,60,.55)' : 'transparent'} stroke="#9aa3ad" stroke-dasharray={ins ? '' : '4 3'} stroke-width="2" />
          </Hit>
        )}
      </Svg>
      <Readout items={[
        ['Odčitek', `${f1(t)} °C`],
        ['Prava T cevi', '2,0 °C'],
        ['Napaka', `${f1(t - 2)} K`, Math.abs(t - 2) < 0.3 ? 'ok' : 'bad'],
      ]} />
    </div>
  );
};

// ---------- 4. vbodni termometer ----------
const ProbeThermo: Sim = ({ say }) => {
  const [inPocket, setIn] = useState(false);
  const [paste, setPaste] = useState(false);
  const [hold, setHold] = useState(false);
  const [t, setT] = useState(21);
  const target = inPocket ? 35.2 : 21;
  useTicker(!hold && Math.abs(t - target) > 0.05, () => setT((x) => x + (target - x) * (paste || !inPocket ? 0.25 : 0.07)));
  return (
    <div>
      <Svg label="Vbodni termometer">
        <Pipe y={150} h={30} x1={180} />
        <Hit label={paste ? 'Brez toplotne paste' : 'Dodaj toplotno pasto v tulec'} hint={[271, 98]} onClick={() => {
          setPaste(!paste);
          say(!paste ? 'Toplotna pasta zapolni zrak v tulcu – odčitek se hitreje in zanesljiveje ustali.' : 'Brez paste je med tipalom in tulcem zrak, ki izolira – odčitek se ustaljuje počasi.');
        }}>
          <rect x="262" y="104" width="18" height="50" rx="3" fill={paste ? '#e8e4dc' : '#c9a227'} stroke="#8a6d12" />
        </Hit>
        <rect x="36" y="56" width="114" height="116" rx="16" fill={C.yellow} stroke="#8a6d12" stroke-width="2" />
        <Screen x={50} y={74} w={86} h={40} lines={[` ${f1(t)} °C`, hold ? ' HOLD' : '']} size={16} />
        <Hit label="Gumb HOLD" hint={[93, 142]} onClick={() => {
          setHold(!hold);
          say(!hold ? 'HOLD zamrzne odčitek. Pazi: če ga pritisneš prezgodaj, zapišeš vrednost, ki se še ni ustalila.' : 'Odčitek spet sledi temperaturi.');
        }}>
          <circle cx="93" cy="142" r="11" fill={C.dark} />
        </Hit>
        <Hit label={inPocket ? 'Izvleci tipalo' : 'Vstavi tipalo v potopni tulec'} hint={[230, 114]} onClick={() => {
          setIn(!inPocket);
          setHold(false);
          say(!inPocket ? 'Tipalo je v tulcu na dvižnem vodu. Počakaj, da se odčitek ustali – vsak termometer potrebuje čas.' : 'Tipalo je v zraku.');
        }}>
          <line x1="150" y1="114" x2={inPocket ? 274 : 236} y2="114" stroke="#9aa3ad" stroke-width="6" stroke-linecap="round" />
        </Hit>
      </Svg>
      <Readout items={[
        ['Odčitek', `${f1(t)} °C`],
        ['Voda v cevi', '35,2 °C'],
        ['Ustaljeno', Math.abs(t - target) < 0.2 ? 'da' : 'še ne', Math.abs(t - target) < 0.2 ? 'ok' : ''],
      ]} />
    </div>
  );
};

// ---------- 5. infrardeči termometer ----------
const IrThermo: Sim = ({ say }) => {
  const [tape, setTape] = useState(false);
  const [read, setRead] = useState<number | null>(null);
  return (
    <div>
      <Svg label="Infrardeči termometer">
        <Pipe y={150} h={34} x1={200} />
        <Hit label={tape ? 'Odstrani črni trak s cevi' : 'Nalepi črni trak na cev'} hint={[262, 140]} onClick={() => {
          setTape(!tape);
          setRead(null);
          say(!tape ? 'Črn izolirni trak ima visoko emisivnost – IR termometer zdaj vidi pravo temperaturo cevi.' : 'Gola, svetla bakrena cev odbija okolico – IR termometer meri predvsem odboj.');
        }}>
          <rect x="250" y="150" width="22" height="34" fill={tape ? '#1d1f22' : 'rgba(0,0,0,0)'} stroke={tape ? 'none' : '#1d1f22'} stroke-dasharray="3 3" />
        </Hit>
        {read !== null && <line x1="118" y1="74" x2="258" y2="164" stroke={C.red} stroke-width="1.5" stroke-dasharray="5 4" />}
        {read !== null && <circle cx="260" cy="166" r="5" fill={C.red} />}
        <path d="M20,50 L120,50 Q132,50 132,62 L132,92 Q132,104 120,104 L82,104 L70,190 L36,190 L48,104 L20,104 Q8,104 8,92 L8,62 Q8,50 20,50 Z" fill="#e8e4dc" stroke={C.metalDark} stroke-width="2" />
        <circle cx="122" cy="77" r="12" fill="#1d1f22" stroke={C.metalDark} stroke-width="2" />
        <Screen x={16} y={58} w={64} h={36} lines={[read === null ? ' ---' : `${f1(read)}°`]} size={16} />
        <Hit label="Sprožilec – izmeri" hint={[90, 122]} onClick={() => {
          const v = tape ? 35.0 : 24.6;
          setRead(v);
          say(tape ? 'Odčitek 35,0 °C – enako kot kontaktni termometer.' : 'Odčitek 24,6 °C, cev pa ima 35 °C. Svetel baker ima nizko emisivnost – IR termometer tu laže za več kot 10 K.');
        }}>
          <rect x="84" y="108" width="12" height="28" rx="5" fill={C.red} />
        </Hit>
      </Svg>
      <Readout items={[
        ['Površina', tape ? 'črn trak' : 'svetel baker'],
        ['Odčitek', read === null ? '–' : `${f1(read)} °C`],
        ['Prava T', '35,0 °C', read === null ? '' : Math.abs(read - 35) < 0.5 ? 'ok' : 'bad'],
      ]} />
    </div>
  );
};

// ---------- 6. kleščni ampermeter ----------
const ClampMeter: Sim = ({ say }) => {
  const MODES = ['OFF', 'A~', 'V~'];
  const [mode, setMode] = useState(0);
  const [grip, setGrip] = useState<'none' | 'one' | 'cable'>('none');
  const val = MODES[mode] === 'A~' ? (grip === 'one' ? '5.2 A' : '0.0 A') : MODES[mode] === 'V~' ? '0.0 V' : '';
  return (
    <div>
      <Svg label="Kleščni ampermeter">
        {grip === 'cable' ? (
          <g>
            <line x1="40" y1="44" x2="280" y2="44" stroke="#8b4513" stroke-width="8" stroke-linecap="round" />
            <line x1="40" y1="56" x2="280" y2="56" stroke="#1f5fa3" stroke-width="8" stroke-linecap="round" />
          </g>
        ) : (
          <line x1="40" y1="50" x2="280" y2="50" stroke="#8b4513" stroke-width="9" stroke-linecap="round" opacity={grip === 'one' ? 1 : 0.5} />
        )}
        <Hit label="Čeljusti – kaj objamem" hint={[200, 18]} onClick={() => {
          const n = grip === 'none' ? 'one' : grip === 'one' ? 'cable' : 'none';
          setGrip(n);
          say(n === 'one' ? 'Čeljusti objemajo en vodnik – merilnik kaže tok, ki teče po njem.' : n === 'cable' ? 'Čeljusti objemajo cel kabel (L in N). Tokova tečeta v nasprotnih smereh, njuni magnetni polji se odštejeta – kaže 0 A, čeprav naprava dela.' : 'Čeljusti so prazne.');
        }}>
          <circle cx="160" cy="50" r="38" fill="none" stroke={C.dark} stroke-width="18" stroke-dasharray="210 30" transform="rotate(-60 160 50)" />
        </Hit>
        <rect x="118" y="82" width="84" height="134" rx="16" fill={C.yellow} stroke="#8a6d12" stroke-width="2" />
        <rect x="106" y="96" width="14" height="30" rx="5" fill={C.dark} />
        <Screen x={130} y={94} w={60} h={32} lines={[val ? ` ${val}` : '']} size={15} />
        <Hit label="Vrtljivo stikalo – način merjenja" hint={[186, 166]} onClick={() => {
          const n = (mode + 1) % MODES.length;
          setMode(n);
          say(MODES[n] === 'A~' ? 'Način A~: merjenje izmeničnega toka skozi čeljusti, brez stika z vodniki.' : MODES[n] === 'V~' ? 'Način V~: za napetost potrebuješ merilne konice – čeljusti napetosti ne merijo.' : 'Izklopljeno.');
        }}>
          <circle cx="160" cy="166" r="22" fill={C.dark} stroke="#111" />
          <line x1="160" y1="166" x2={[146, 160, 174][mode]} y2={[152, 146, 152][mode]} stroke={C.yellow} stroke-width="4" stroke-linecap="round" />
          <text x="160" y="200" font-size="10" font-weight="800" text-anchor="middle" fill={C.ink}>{MODES[mode]}</text>
        </Hit>
      </Svg>
      <Readout items={[
        ['Način', MODES[mode]],
        ['V čeljustih', grip === 'one' ? 'en vodnik' : grip === 'cable' ? 'cel kabel' : 'nič'],
        ['Odčitek', val || '–', grip === 'cable' && MODES[mode] === 'A~' ? 'bad' : ''],
      ]} />
    </div>
  );
};

// ---------- 7. multimeter ----------
const Multimeter: Sim = ({ say }) => {
  const MODES = ['OFF', 'V~', 'Ω'];
  const [mode, setMode] = useState(0);
  const [target, setTarget] = useState<'socket' | 'ntc'>('ntc');
  const m = MODES[mode];
  const danger = m === 'Ω' && target === 'socket';
  const val = m === 'V~' ? (target === 'socket' ? '230.4 V' : '0.00 V') : m === 'Ω' ? (target === 'ntc' ? '10.0 kΩ' : 'NAPAKA') : '';
  return (
    <div>
      <Svg label="Multimeter">
        <Hit label="Merilni konici – kam priključim" hint={[290, 186]} onClick={() => {
          const n = target === 'ntc' ? 'socket' : 'ntc';
          setTarget(n);
          say(n === 'ntc' ? 'Konici sta na odklopljenem senzorju NTC (brez napetosti). Upornost primerjaš s tabelo proizvajalca pri izmerjeni temperaturi.' : 'Konici sta na sponkah pod napetostjo (230 V) – to sme samo usposobljena oseba, z ustrezno kategorijo merilnika (CAT).');
        }}>
          <Probe d="M150,178 C150,212 70,206 34,214" color={C.dark} />
          <Probe d="M184,178 C184,212 250,200 292,206" color={C.red} />
          <rect x="20" y="206" width="24" height="10" rx="3" fill={C.dark} />
          <rect x="286" y="198" width="26" height="10" rx="3" fill={C.red} />
          <text x="300" y="190" font-size="9" font-weight="800" text-anchor="end" fill={C.ink}>{target === 'ntc' ? 'senzor NTC' : '230 V'}</text>
        </Hit>
        <rect x="98" y="14" width="124" height="176" rx="16" fill={C.yellow} stroke="#8a6d12" stroke-width="2" />
        <rect x="106" y="22" width="108" height="160" rx="10" fill="#3a3f44" />
        <Screen x={114} y={30} w={92} h={36} lines={[val ? ` ${val}` : '']} size={15} alarm={danger} />
        <Hit label="Vrtljivo stikalo – merilno območje" hint={[194, 110]} onClick={() => {
          const n = (mode + 1) % MODES.length;
          setMode(n);
          const nm = MODES[n];
          say(nm === 'Ω' && target === 'socket' ? 'Napaka: upornosti nikoli ne meriš pod napetostjo – merilnik se lahko uniči, meritev ni prava.' : nm === 'Ω' ? 'Ohmi: meriš upornost brez napetosti, element odklopljen iz vezja.' : nm === 'V~' ? 'Izmenična napetost: konici v COM in VΩ, merilnik vzporedno z virom.' : 'Izklopljeno.');
        }}>
          <circle cx="160" cy="110" r="27" fill={C.dark} stroke="#111" />
          <line x1="160" y1="110" x2={[146, 160, 174][mode]} y2={[88, 84, 88][mode]} stroke={C.yellow} stroke-width="4" stroke-linecap="round" />
          <text x="160" y="148" font-size="10" font-weight="800" text-anchor="middle" fill="#fff">{m}</text>
        </Hit>
        {[[126, 'A'], [150, 'COM'], [184, 'VΩ']].map(([x, t]) => (
          <g>
            <circle cx={x as number} cy="166" r="8" fill="#111" stroke={t === 'COM' ? '#888' : C.red} stroke-width="2" />
            <text x={x as number} y="158" font-size="7" text-anchor="middle" fill="#ddd" font-weight="700">{t}</text>
          </g>
        ))}
      </Svg>
      <Readout items={[
        ['Območje', m],
        ['Konici', target === 'ntc' ? 'senzor NTC' : 'sponke 230 V'],
        ['Odčitek', val || '–', danger ? 'bad' : ''],
      ]} />
    </div>
  );
};

// ---------- 8. dvopolni preizkuševalnik napetosti ----------
const VoltTester: Sim = ({ say }) => {
  const [steps, setSteps] = useState<string[]>([]);
  const [lit, setLit] = useState(0);
  const ok = steps.join(',') === 'znan,vodnik,znan';
  const act = (s: 'znan' | 'vodnik') => {
    const next = [...steps, s].slice(-3);
    setSteps(next);
    setLit(s === 'znan' ? 2 : 0);
    if (s === 'vodnik' && steps[steps.length - 1] !== 'znan') say('Najprej preizkusi preizkuševalnik na znanem viru napetosti – sicer ne veš, ali ničla pomeni »ni napetosti« ali »preizkuševalnik ne dela«.');
    else if (next.join(',') === 'znan,vodnik,znan') say('Pravilno: preizkus na znanem viru – izklopljen vodnik (ni napetosti) – spet na znanem viru. Odsotnost napetosti je potrjena.');
    else if (s === 'vodnik') say('Na izklopljenem vodniku ne sveti nič. Zdaj še enkrat preizkusi na znanem viru, da potrdiš, da preizkuševalnik še dela.');
    else say('Na znanem viru svetita 120 in 230 V – preizkuševalnik deluje.');
  };
  return (
    <div>
      <Svg label="Dvopolni preizkuševalnik napetosti">
        <path d="M70,176 C70,214 250,214 250,176" stroke={C.dark} stroke-width="5" fill="none" />
        <line x1="70" y1="54" x2="70" y2="16" stroke="#9aa3ad" stroke-width="4" />
        <line x1="250" y1="54" x2="250" y2="16" stroke="#9aa3ad" stroke-width="4" />
        <rect x="44" y="52" width="52" height="128" rx="14" fill={C.yellow} stroke="#8a6d12" stroke-width="2" />
        <rect x="224" y="52" width="52" height="128" rx="14" fill={C.yellow} stroke="#8a6d12" stroke-width="2" />
        {['400', '230', '120', '50', '12'].map((t, i) => (
          <g>
            <circle cx="62" cy={72 + i * 20} r="5" fill={5 - i <= lit + 2 && lit ? (i < 2 ? C.red : '#f5a623') : '#d8d2c6'} />
            <text x="74" y={76 + i * 20} font-size="10" font-weight="700" fill={C.ink}>{t}</text>
          </g>
        ))}
        <Hit label="Preizkus na znanem viru napetosti" hint={[160, 40]} onClick={() => act('znan')}>
          <rect x="120" y="24" width="80" height="34" rx="6" fill="#e8e4dc" stroke={C.metalDark} />
          <text x="160" y="45" font-size="10" font-weight="800" text-anchor="middle" fill={C.ink}>ZNAN VIR</text>
        </Hit>
        <Hit label="Preizkus na izklopljenem vodniku" hint={[160, 110]} onClick={() => act('vodnik')}>
          <rect x="120" y="92" width="80" height="34" rx="6" fill="#e8e4dc" stroke={C.metalDark} />
          <text x="160" y="113" font-size="10" font-weight="800" text-anchor="middle" fill={C.ink}>VODNIK</text>
        </Hit>
      </Svg>
      <Readout items={[
        ['Zaporedje', steps.length ? steps.join(' → ') : '–'],
        ['Odsotnost napetosti', ok ? 'potrjena' : 'še ni potrjena', ok ? 'ok' : ''],
      ]} />
    </div>
  );
};

// ---------- 9. merilnik izolacijske upornosti ----------
const InsulationTester: Sim = ({ say }) => {
  const VOLTS = [250, 500, 1000];
  const [vi, setVi] = useState(1);
  const [wet, setWet] = useState(false);
  const [disc, setDisc] = useState(false);
  const [read, setRead] = useState<string | null>(null);
  return (
    <div>
      <Svg label="Merilnik izolacijske upornosti">
        <Probe d="M100,170 C100,206 40,206 24,214" color={C.dark} />
        <Probe d="M140,170 C140,206 260,206 292,212" color={C.red} />
        <rect x="54" y="36" width="216" height="138" rx="14" fill="#c0392b" stroke="#7a1d14" stroke-width="2" />
        <rect x="64" y="46" width="196" height="118" rx="10" fill="#3a3f44" />
        <Screen x={74} y={56} w={118} h={40} lines={[read ?? '  ---', ` ${VOLTS[vi]} V`]} size={14} alarm={read === 'ELEKTR.!'} />
        <Hit label="Gumb TEST" hint={[226, 76]} onClick={() => {
          if (!disc) {
            setRead('ELEKTR.!');
            say('Stop: inverter in elektronika sta še priključena. Preizkusna napetost ju lahko uniči – najprej odklopi elektroniko po navodilih proizvajalca.');
            return;
          }
          setRead(wet ? '  0.4 MΩ' : '>200 MΩ');
          say(wet ? 'Nizka izolacijska upornost – navitje je vlažno ali poškodovano. Kompresorja ne zaganjaj, potreben je pregled.' : 'Visoka izolacijska upornost – izolacija navitja proti ohišju je v redu.');
        }}>
          <circle cx="226" cy="76" r="20" fill={C.yellow} stroke="#8a6d12" stroke-width="2" />
          <text x="226" y="80" font-size="10" font-weight="900" text-anchor="middle" fill={C.ink}>TEST</text>
        </Hit>
        <Hit label="Izbira preizkusne napetosti" hint={[248, 132]} onClick={() => {
          const n = (vi + 1) % VOLTS.length;
          setVi(n);
          setRead(null);
          say(`Preizkusna napetost ${VOLTS[n]} V. Za naprave na 230/400 V se pogosto uporablja 500 V – velja navodilo proizvajalca.`);
        }}>
          <circle cx="226" cy="132" r="18" fill={C.dark} stroke="#111" />
          <line x1="226" y1="132" x2={[214, 226, 238][vi]} y2={[120, 116, 120][vi]} stroke={C.yellow} stroke-width="4" stroke-linecap="round" />
        </Hit>
      </Svg>
      <div class="tl-controls">
        <button type="button" class={disc ? 'on' : ''} onClick={() => { setDisc(!disc); setRead(null); }}>{disc ? '✓ Elektronika odklopljena' : 'Odklopi elektroniko'}</button>
        <button type="button" class={wet ? 'on' : ''} onClick={() => { setWet(!wet); setRead(null); }}>{wet ? 'Navitje: vlažno' : 'Navitje: suho'}</button>
      </div>
      <Readout items={[['Rezultat', read ?? '–', read === null ? '' : read.includes('200') ? 'ok' : 'bad']]} />
    </div>
  );
};

// ---------- 10. vakuumska črpalka ----------
const VacuumPump: Sim = ({ say }) => {
  const [on, setOn] = useState(false);
  const [wetOil, setWetOil] = useState(true);
  const [p, setP] = useState(760000);
  const floor = wetOil ? 2500 : 120;
  useTicker(on, () => setP((x) => Math.max(floor, x * 0.55 + floor * 0.45)), 300);
  return (
    <div>
      <Svg label="Vakuumska črpalka">
        <path d="M80,92 Q160,30 240,92" stroke={C.dark} stroke-width="8" fill="none" />
        <rect x="34" y="92" width="160" height="84" rx="40" fill={C.blue} stroke="#1f5fa3" stroke-width="2" />
        {[60, 80, 100, 120, 140, 160].map((x) => <line x1={x} y1="100" x2={x} y2="168" stroke="rgba(255,255,255,.25)" stroke-width="3" />)}
        <rect x="190" y="96" width="86" height="80" rx="8" fill={C.metal} stroke={C.metalDark} stroke-width="2" />
        <Hit label={wetOil ? 'Zamenjaj olje' : 'Olje je sveže'} hint={[252, 152]} onClick={() => {
          setWetOil(false);
          setP((x) => x);
          say(wetOil ? 'Olje zamenjano. Vlažno, motno olje ne doseže globokega vakuuma – menjaj ga pogosto, tudi po vsakem vlažnem sistemu.' : 'Olje je bistro in sveže.');
        }}>
          <circle cx="232" cy="152" r="11" fill={wetOil ? '#7a5a2a' : '#f2c46a'} stroke={C.metalDark} stroke-width="2" />
        </Hit>
        <rect x="236" y="74" width="16" height="24" fill="#c9a227" stroke="#8a6d12" />
        <rect x="230" y="66" width="28" height="10" rx="3" fill={C.red} />
        <Hit label={on ? 'Izklopi črpalko' : 'Vklopi črpalko'} hint={[214, 120]} onClick={() => {
          setOn(!on);
          if (!on) setP(760000);
          say(!on ? 'Črpalka teče – tlak v sistemu pada. Meri ga elektronski vakuummeter na sistemu, ne na črpalki.' : 'Črpalka stoji.');
        }}>
          <rect x="202" y="106" width="24" height="20" rx="4" fill={on ? '#2c7a3f' : C.dark} />
          <text x="214" y="120" font-size="8" font-weight="900" text-anchor="middle" fill="#fff">{on ? 'ON' : 'OFF'}</text>
        </Hit>
        <rect x="40" y="176" width="236" height="10" rx="4" fill={C.dark} />
      </Svg>
      <Readout items={[
        ['Tlak v sistemu', p >= 100000 ? `${f1(p / 750.06)} mbar` : `${Math.round(p)} µm`],
        ['Olje', wetOil ? 'vlažno, motno' : 'sveže'],
        ['Cilj (npr.)', 'pod 500 µm – po navodilih', p < 500 ? 'ok' : ''],
      ]} />
    </div>
  );
};

// ---------- 11. elektronski vakuummeter ----------
const MicronGauge: Sim = ({ say }) => {
  const CASES = { suh: 'suh, tesen krog', vlaga: 'vlaga v krogu', pusca: 'krog pušča' } as const;
  type K = keyof typeof CASES;
  const [k, setK] = useState<K>('suh');
  const [test, setTest] = useState(false);
  const [time, setTime] = useState(0);
  const p = !test ? 300 : k === 'suh' ? 300 + 150 * (1 - Math.exp(-time / 3)) : k === 'vlaga' ? 300 + 1500 * (1 - Math.exp(-time / 4)) : 300 + 420 * time;
  useTicker(test && time < 15, () => setTime((t) => t + 0.5), 200);
  return (
    <div>
      <Svg label="Elektronski vakuummeter">
        <Hose d="M10,204 L310,204" color={C.yellow} />
        <text x="14" y="194" font-size="11" font-weight="700" fill={C.ink}>← sistem</text>
        <Hit label={test ? 'Odpri ventil proti črpalki' : 'Zapri ventil proti črpalki (preizkus)'} hint={[268, 204]} onClick={() => {
          setTest(!test);
          setTime(0);
          say(!test ? 'Ventil proti črpalki je zaprt – opazuj, kako se tlak spreminja.' : 'Ventil je spet odprt, črpalka vleče.');
        }}>
          <rect x="250" y="192" width="36" height="24" rx="4" fill={test ? C.red : '#2c7a3f'} />
          <text x="268" y="208" font-size="9" font-weight="900" text-anchor="middle" fill="#fff">{test ? 'ZAPRT' : 'ODPRT'}</text>
        </Hit>
        <rect x="148" y="160" width="24" height="40" fill="#c9a227" stroke="#8a6d12" />
        <rect x="108" y="30" width="104" height="134" rx="16" fill={C.dark} stroke="#111" stroke-width="2" />
        <Screen x={118} y={44} w={84} h={50} lines={[` ${Math.round(p)} µm`, ` ${(p / 750.06).toFixed(2)} mbar`]} size={13} />
        <circle cx="160" cy="130" r="10" fill="#5b6168" />
      </Svg>
      <div class="tl-controls">
        {(Object.keys(CASES) as K[]).map((c) => (
          <button type="button" class={k === c ? 'on' : ''} onClick={() => { setK(c); setTest(false); setTime(0); }}>{CASES[c]}</button>
        ))}
      </div>
      <Readout items={[
        ['Po zaprtju', test ? `${f1(time)} min` : '–'],
        ['Tlak', `${Math.round(p)} µm`],
        ['Ocena', !test || time < 10 ? '…' : k === 'suh' ? 'drži – krog je suh in tesen' : k === 'vlaga' ? 'naraste in obstane – vlaga, vakuumiraj dlje' : 'raste brez konca – puščanje', !test || time < 10 ? '' : k === 'suh' ? 'ok' : 'bad'],
      ]} />
    </div>
  );
};

// ---------- 12. elektronski detektor puščanja ----------
const LeakDetector: Sim = ({ say }) => {
  const SPOTS = { cev: [60, 1], spoj: [170, 2], matica: [286, 8] } as const;
  type S = keyof typeof SPOTS;
  const [at, setAt] = useState<S | null>(null);
  const level = at ? SPOTS[at][1] : 0;
  const tip = at ? SPOTS[at][0] : 220;
  return (
    <div>
      <Svg label="Elektronski detektor puščanja">
        <Pipe y={52} h={20} x1={10} />
        <polygon points="276,48 296,48 302,62 296,76 276,76 270,62" fill="#c9a227" stroke="#8a6d12" />
        <rect x="160" y="48" width="20" height="28" fill="#a86b12" />
        {(Object.keys(SPOTS) as S[]).map((s) => (
          <Hit label={`Detektor na: ${s}`} hint={[SPOTS[s][0], 86]} onClick={() => {
            setAt(s);
            say(s === 'matica' ? 'Alarm na holandski matici – tu je puščanje. Potrdi še s penilom, nato popravi in ponovno preveri.' : s === 'spoj' ? 'Šibek signal ob spajkanem spoju – verjetno le sled hladiva v zraku. Sondo vodi počasi in tudi pod spojem.' : 'Na ravni cevi ni signala.');
          }}>
            <rect x={SPOTS[s][0] - 20} y="40" width="40" height="44" fill="transparent" />
          </Hit>
        ))}
        <path d={`M158,128 C190,128 ${tip - 30},70 ${tip},86`} stroke="#5b6168" stroke-width="9" fill="none" stroke-dasharray="7 2" />
        <circle cx={tip} cy="88" r="8" fill={C.dark} />
        <rect x="38" y="108" width="124" height="64" rx="18" fill={C.blue} stroke="#1f5fa3" stroke-width="2" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect x={54 + i * 12} y="120" width="9" height="12" rx="2" fill={i < level ? (i < 5 ? '#7dffcf' : i < 7 ? '#f5a623' : C.red) : '#1f3d5c'} />)}
        <circle cx="100" cy="152" r="8" fill={C.dark} />
      </Svg>
      <Readout items={[
        ['Sonda', at ?? 'v roki'],
        ['Signal', `${level}/8`, level >= 7 ? 'bad' : ''],
      ]} />
    </div>
  );
};

// ---------- 13. tehtnica za hladivo ----------
const Scale: Sim = ({ say }) => {
  const TARGET = 1.2;
  const [tare, setTare] = useState(false);
  const [out, setOut] = useState(0);
  const shown = tare ? -out : 12.4 - out;
  return (
    <div>
      <Svg label="Tehtnica za hladivo">
        <path d="M240,182 C260,182 270,170 270,160" stroke={C.dark} stroke-width="3" fill="none" />
        <rect x="92" y="54" width="96" height="118" rx="34" fill="#9aa3ad" stroke={C.metalDark} stroke-width="2" />
        <rect x="92" y="54" width="96" height="30" rx="20" fill={C.metalDark} />
        <Hit label="Ventil jeklenke – dodaj 0,1 kg" hint={[160, 30]} onClick={() => {
          if (!tare) {
            say('Najprej pritisni TARA, da tehtnica pokaže, koliko hladiva je šlo iz jeklenke.');
            return;
          }
          const n = Math.round((out + 0.1) * 100) / 100;
          setOut(n);
          say(n >= TARGET + 0.001 ? `Preveč: ${f1(n)} kg, tablica pravi ${f1(TARGET)} kg. Odvečno hladivo je treba zajeti.` : n >= TARGET - 0.001 ? 'Točno po tablici. Zapri ventil in zapiši količino v evidenco.' : `Napolnjeno ${f1(n)} kg od ${f1(TARGET)} kg.`);
        }}>
          <rect x="130" y="34" width="20" height="22" fill="#c9a227" stroke="#8a6d12" />
          <circle cx="140" cy="30" r="10" fill={C.blue} />
        </Hit>
        <rect x="36" y="172" width="208" height="22" rx="6" fill={C.metal} stroke={C.metalDark} stroke-width="2" />
        <rect x="236" y="112" width="74" height="60" rx="8" fill={C.dark} />
        <Screen x={242} y={118} w={62} h={28} lines={[f1(shown)]} size={15} alarm={out > TARGET + 0.001} />
        <Hit label="Gumb TARA" hint={[273, 160]} onClick={() => {
          setTare(true);
          setOut(0);
          say('TARA: tehtnica je na nič z jeklenko vred. Zdaj kaže, koliko hladiva je šlo v napravo (z minusom).');
        }}>
          <rect x="256" y="152" width="34" height="14" rx="4" fill="#5b6168" />
          <text x="273" y="162" font-size="8" font-weight="900" text-anchor="middle" fill="#fff">TARA</text>
        </Hit>
      </Svg>
      <Readout items={[
        ['Po tablici', `${f1(TARGET)} kg`],
        ['Napolnjeno', `${f1(out)} kg`, out > TARGET + 0.001 ? 'bad' : Math.abs(out - TARGET) < 0.001 ? 'ok' : ''],
      ]} />
    </div>
  );
};

// ---------- 14. naprava za zajem hladiva ----------
const Recovery: Sim = ({ say }) => {
  const [on, setOn] = useState(false);
  const [valve, setValve] = useState(false);
  const [fill, setFill] = useState(20);
  const [alarm, setAlarm] = useState('');
  useTicker(on, () => {
    if (!valve) {
      setOn(false);
      setAlarm('VISOK TLAK');
      say('Naprava se je ustavila: ventil na jeklenki je zaprt, tlak na izhodu je narasel. Pred zagonom vedno odpri ventil jeklenke.');
      return;
    }
    setFill((f) => {
      const n = f + 4;
      if (n >= 80) {
        setOn(false);
        setAlarm('80 %');
        say('Jeklenka je napolnjena do okoli 80 % – ustavi. Več ne smeš, ker se tekočina ob segrevanju razteza.');
        return 80;
      }
      return n;
    });
  }, 500);
  return (
    <div>
      <Svg label="Naprava za zajem hladiva in jeklenka">
        <Hose d="M110,186 C110,214 220,214 236,30" color={C.yellow} />
        <Hose d="M50,186 L50,218" color={C.blue} />
        <rect x="16" y="62" width="150" height="122" rx="10" fill={C.blue} stroke="#1f5fa3" stroke-width="2" />
        <Gauge cx={54} cy={100} r={22} ring={C.blue} v={on ? 0.15 : 0.35} />
        <Gauge cx={104} cy={100} r={22} ring={C.red} v={alarm === 'VISOK TLAK' ? 0.95 : on ? 0.6 : 0.3} />
        <Hit label={on ? 'Izklopi napravo' : 'Vklopi napravo za zajem'} hint={[146, 84]} onClick={() => {
          setAlarm('');
          setOn(!on);
          if (!on) say('Naprava črpa hladivo iz sistema v jeklenko. Jeklenka stoji na tehtnici.');
        }}>
          <rect x="138" y="88" width="16" height="26" rx="4" fill={on ? '#2c7a3f' : C.dark} />
        </Hit>
        {[50, 110].map((x) => <rect x={x - 6} y="180" width="12" height="10" fill="#c9a227" stroke="#8a6d12" />)}
        <text x="36" y="160" font-size="10" fill="#fff" font-weight="700">VHOD</text>
        <text x="94" y="160" font-size="10" fill="#fff" font-weight="700">IZHOD</text>
        <rect x="196" y="44" width="100" height="168" rx="34" fill="#9aa3ad" stroke={C.metalDark} stroke-width="2" />
        <rect x="200" y={212 - (fill / 100) * 160} width="92" height={(fill / 100) * 160 - 4} rx="10" fill="rgba(47,127,209,.35)" />
        <line x1="198" y1={212 - 0.8 * 160} x2="294" y2={212 - 0.8 * 160} stroke={C.red} stroke-dasharray="4 3" stroke-width="2" />
        <text x="246" y={206 - 0.8 * 160} font-size="9" font-weight="800" text-anchor="middle" fill={C.red}>80 %</text>
        <Hit label={valve ? 'Zapri ventil jeklenke' : 'Odpri ventil jeklenke'} hint={[266, 30]} onClick={() => {
          setValve(!valve);
          setAlarm('');
          say(!valve ? 'Ventil jeklenke je odprt – hladivo lahko teče v jeklenko.' : 'Ventil jeklenke je zaprt.');
        }}>
          <circle cx="266" cy="30" r="10" fill={valve ? '#2c7a3f' : C.red} />
        </Hit>
        <circle cx="226" cy="30" r="10" fill={C.blue} />
        <rect x="236" y="30" width="20" height="16" fill="#c9a227" />
      </Svg>
      <Readout items={[
        ['Jeklenka', `${fill} %`, fill >= 80 ? 'bad' : ''],
        ['Ventil jeklenke', valve ? 'odprt' : 'zaprt'],
        ['Alarm', alarm || '–', alarm ? 'bad' : ''],
      ]} />
    </div>
  );
};

// ---------- 15. dušik z reducirnim ventilom ----------
const Nitrogen: Sim = ({ say }) => {
  const MAX = 40; // primer: največji preizkusni tlak po navodilih proizvajalca
  const [open, setOpen] = useState(false);
  const [set, setSet] = useState(0);
  const out = open ? set : 0;
  const adj = (d: number) => {
    const n = Math.max(0, Math.min(60, set + d));
    setSet(n);
    say(n > MAX ? `Izhodni tlak ${n} bar je nad dovoljenim preizkusnim tlakom (primer ${MAX} bar). Zmanjšaj – lahko poškoduješ dele kroga.` : `Izhodni tlak nastavljen na ${n} bar. Polni postopoma in opazuj.`);
  };
  return (
    <div>
      <Svg label="Jeklenka dušika z reducirnim ventilom">
        <Hose d="M150,60 C220,60 250,120 310,150" color="#3a3f44" />
        <rect x="40" y="86" width="74" height="130" rx="30" fill="#3a3f44" stroke="#111" stroke-width="2" />
        <text x="77" y="160" font-size="20" font-weight="900" text-anchor="middle" fill="#fff">N₂</text>
        <Hit label={open ? 'Zapri ventil jeklenke' : 'Odpri ventil jeklenke'} hint={[96, 80]} onClick={() => {
          setOpen(!open);
          say(!open ? 'Ventil jeklenke je odprt – visokotlačni manometer kaže tlak v jeklenki (do 200 bar in več). Zato vedno reducirni ventil.' : 'Ventil jeklenke je zaprt.');
        }}>
          <rect x="68" y="70" width="18" height="18" fill={open ? '#2c7a3f' : '#c9a227'} stroke="#8a6d12" />
        </Hit>
        <rect x="50" y="48" width="104" height="24" rx="8" fill={C.metal} stroke={C.metalDark} stroke-width="2" />
        <Gauge cx={46} cy={38} r={22} ring={C.metal} v={open ? 0.75 : 0} />
        <Gauge cx={130} cy={30} r={22} ring={C.metal} v={out / 60} />
        <Hit label="Vijak reducirnega ventila – manj" hint={[78, 26]} onClick={() => adj(-5)}>
          <rect x="70" y="16" width="14" height="30" rx="4" fill="#5b6168" />
          <text x="77" y="12" font-size="12" font-weight="900" text-anchor="middle" fill={C.ink}>−</text>
        </Hit>
        <Hit label="Vijak reducirnega ventila – več" hint={[100, 26]} onClick={() => adj(5)}>
          <rect x="92" y="16" width="14" height="30" rx="4" fill={C.dark} />
          <text x="99" y="12" font-size="12" font-weight="900" text-anchor="middle" fill={C.ink}>+</text>
        </Hit>
      </Svg>
      <Readout items={[
        ['Jeklenka', open ? 'okoli 200 bar' : '–'],
        ['Izhod', `${out} bar`, out > MAX ? 'bad' : ''],
        ['Največ (primer)', `${MAX} bar – po navodilih`],
      ]} />
    </div>
  );
};

// ---------- 16. manometer vodnega kroga ----------
const WaterGauge: Sim = ({ say }) => {
  const [p, setP] = useState(1.5);
  const [empty, setEmpty] = useState(false);
  const change = (d: number, txt: string) => {
    let n = Math.round((p + d) * 10) / 10;
    if (n >= 3) {
      n = 2.8;
      say('Varnostni ventil se je odprl pri 3 bar in izpustil vodo. Če se to ponavlja ob segrevanju, je kriva raztezna posoda.');
    } else say(txt);
    setP(Math.max(0, n));
  };
  return (
    <div>
      <Svg label="Manometer vodnega kroga">
        <Pipe y={182} h={24} />
        <rect x="152" y="140" width="16" height="44" fill="#c9a227" stroke="#8a6d12" />
        <Gauge cx={160} cy={84} r={64} ring="#3a3f44" v={p / 4} label="bar" zones={[{ from: 0.25, to: 0.5, color: '#2c7a3f' }, { from: 0.75, to: 1, color: C.red }]} />
        {['0', '1', '2', '3', '4'].map((t, i) => {
          const a = ((-225 + i * 67.5) * Math.PI) / 180;
          return <text x={160 + 34 * Math.cos(a)} y={88 + 34 * Math.sin(a)} font-size="12" font-weight="700" text-anchor="middle" fill={C.ink}>{t}</text>;
        })}
      </Svg>
      <div class="tl-controls">
        <button type="button" onClick={() => change(empty ? 1.2 : 0.3, empty ? 'Ob segrevanju tlak močno naraste – raztezna posoda nima plina, ne sprejme raztezanja vode.' : 'Ob segrevanju se voda razširi, raztezna posoda to sprejme – tlak naraste le malo.')}>🔥 Segrej</button>
        <button type="button" onClick={() => change(empty ? -1.2 : -0.3, 'Ob ohlajanju tlak pade.')}>❄ Ohladi</button>
        <button type="button" onClick={() => change(0.2, 'Dolil si vodo – tlak naraste. Doliva se po navodilih inštalaterja, z ustrezno vodo.')}>💧 Dolij</button>
        <button type="button" class={empty ? 'on' : ''} onClick={() => { setEmpty(!empty); say(!empty ? 'Scenarij: raztezna posoda je izgubila predtlak.' : 'Scenarij: raztezna posoda je v redu.'); }}>{empty ? 'Raztezna: prazna' : 'Raztezna: v redu'}</button>
      </div>
      <Readout items={[['Tlak', `${f1(p)} bar`, p < 1 || p > 2.5 ? 'bad' : 'ok'], ['Zeleno polje', 'vrednost po navodilih inštalaterja']]} />
    </div>
  );
};

// ---------- 17. termokamera ----------
const ThermalCam: Sim = ({ say }) => {
  const CASES = ['ok', 'zrak', 'mulj'] as const;
  const [i, setI] = useState(0);
  const c = CASES[i];
  const stops = c === 'ok' ? ['#ff3b1f', '#ffb21f', '#4fd1c5', '#4f8fd1'] : c === 'zrak' ? ['#2f4bd1', '#ffb21f', '#ff7a1f', '#4fd1c5'] : ['#ff3b1f', '#ffb21f', '#2f4bd1', '#2f4bd1'];
  return (
    <div>
      <Svg label="Termokamera">
        <defs>
          <linearGradient id="tk-img" x1="0" y1="0" x2="0" y2="1">
            {stops.map((s, k) => <stop offset={k / 3} stop-color={s} />)}
          </linearGradient>
        </defs>
        <Hit label="Radiator – zamenjaj primer" hint={[266, 112]} onClick={() => {
          const n = (i + 1) % CASES.length;
          setI(n);
          say(CASES[n] === 'ok' ? 'Pravilno: radiator je zgoraj najtoplejši in se proti dnu enakomerno ohlaja.' : CASES[n] === 'zrak' ? 'Zgornji del je hladen – v radiatorju je zrak. Odzrači ga.' : 'Spodnja polovica je hladna – mulj ali slab pretok. Izpiranje ali uravnoteženje.');
        }}>
          <rect x="226" y="58" width="80" height="116" rx="6" fill="#f4f1ea" stroke={C.metalDark} />
          {[0, 1, 2, 3, 4, 5, 6].map((k) => <rect x={232 + k * 10.5} y="62" width="7" height="108" rx="2" fill="#e8e4dc" />)}
        </Hit>
        <rect x="70" y="150" width="50" height="62" rx="10" fill={C.dark} />
        <rect x="22" y="36" width="160" height="118" rx="14" fill={C.dark} stroke="#111" stroke-width="2" />
        <rect x="32" y="46" width="140" height="98" rx="6" fill="#111" />
        <rect x="62" y="54" width="80" height="84" rx="3" fill="url(#tk-img)" />
        {[0, 1, 2, 3, 4, 5].map((k) => <rect x={66 + k * 12.5} y="56" width="3" height="80" fill="rgba(0,0,0,.25)" />)}
      </Svg>
      <Readout items={[['Slika', c === 'ok' ? 'enakomerno' : c === 'zrak' ? 'hladno zgoraj' : 'hladno spodaj', c === 'ok' ? 'ok' : 'bad']]} />
    </div>
  );
};

export const TOOL_SIMS: Record<ToolId, Sim> = {
  'manometrska-baterija': Manifold,
  'digitalna-baterija': DigitalManifold,
  'termometer-cevni': PipeClamp,
  'termometer-vbodni': ProbeThermo,
  'ir-termometer': IrThermo,
  'klescni-ampermeter': ClampMeter,
  multimeter: Multimeter,
  'tester-napetosti': VoltTester,
  'merilnik-izolacije': InsulationTester,
  'vakuumska-crpalka': VacuumPump,
  vakuummeter: MicronGauge,
  'detektor-puscanja': LeakDetector,
  tehtnica: Scale,
  'naprava-za-zajem': Recovery,
  'dusik-regulator': Nitrogen,
  'manometer-vode': WaterGauge,
  termokamera: ThermalCam,
};
