import { useEffect, useState } from 'preact/hooks';
import { satTemp, superheat, subcooling, gaugeToAbs, check, type PTPoint } from '../../packages/engine/src/ptcalc';
import './shsc.css';

interface Refrigerant {
  id: string;
  name: string;
  safety?: string;
  source: string;
  points: PTPoint[];
}
interface Props {
  /** Preverjene P-T tabele iz data/refrigerants.json (lahko prazno). */
  tables: Refrigerant[];
  lessonSh: string;
  lessonSc: string;
}

const FLUIDS = [
  { id: 'R32', label: 'R32', safety: 'A2L', note: 'Rahlo gorljivo – brez virov vžiga, prezračevanje.' },
  { id: 'R410A', label: 'R410A', safety: 'A1', note: 'Mešanica s skoraj nič drsenja – polni v tekoči fazi.' },
  { id: 'R290', label: 'R290', safety: 'A3', note: 'Propan, močno gorljiv – detektor plina, orodje brez iskrenja, nikoli plamen na krogu s hladivom.' },
];
const KEY = 'akademija-tc:shsc';
const num = (s: string) => {
  const v = Number(s.replace(',', '.').trim());
  return s.trim() !== '' && Number.isFinite(v) ? v : null;
};
const f1 = (v: number) => v.toLocaleString('sl-SI', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function Field({ label, hint, value, onInput, unit }: { label: string; hint?: string; value: string; onInput: (v: string) => void; unit: string }) {
  return (
    <label class="sc-field">
      <span class="sc-label">{label}</span>
      <span class="sc-input">
        <input type="text" inputmode="decimal" autocomplete="off" value={value} onInput={(e) => onInput((e.target as HTMLInputElement).value)} placeholder="0,0" />
        <span class="sc-unit">{unit}</span>
      </span>
      {hint && <span class="sc-hint">{hint}</span>}
    </label>
  );
}

function Result({ value, name, formula, lowText }: { value: number | null; name: string; formula: string; lowText: string }) {
  if (value === null) return <p class="sc-result empty">Vpiši obe vrednosti.</p>;
  const v = check(value);
  return (
    <div class={`sc-result ${v}`} aria-live="polite">
      <p class="sc-big">
        {name} = {f1(value)} K
      </p>
      <p class="sc-formula">{formula}</p>
      {v === 'negative' && <p class="sc-warn">Negativna vrednost ni mogoča – preveri hladivo, tlak (nadtlak ali absolutni?) in mesto merjenja temperature.</p>}
      {v === 'zero' && <p class="sc-warn">{lowText}</p>}
      {v === 'ok' && <p class="sc-ok">Primerjaj z vrednostjo, ki jo za to napravo in obratovalno točko navaja proizvajalec.</p>}
    </div>
  );
}

export default function ShScCalc({ tables, lessonSh, lessonSc }: Props) {
  const [fluid, setFluid] = useState('R32');
  // s preverjeno P-T tabelo je privzeto vnos tlaka, sicer temperatura s skale
  const [mode, setMode] = useState<'p' | 't'>(tables.length ? 'p' : 't');
  const [lp, setLp] = useState('');
  const [tSuc, setTSuc] = useState('');
  const [hp, setHp] = useState('');
  const [tLiq, setTLiq] = useState('');

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (FLUIDS.some((f) => f.id === s.fluid)) setFluid(s.fluid);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ fluid }));
    } catch {}
  }, [fluid]);

  const table = tables.find((t) => t.id === fluid);
  const pMode = mode === 'p' && !!table;
  const meta = FLUIDS.find((f) => f.id === fluid)!;

  // temperatura nasičenja: iz tlaka (tabela) ali neposredno s skale manometra
  const satFrom = (s: string, phase: 'bubble' | 'dew') => {
    const v = num(s);
    if (v === null) return null;
    return pMode ? satTemp(table!.points, gaugeToAbs(v), phase) : v;
  };
  const tEvap = satFrom(lp, 'dew');
  const tCond = satFrom(hp, 'bubble');
  const outOfRange = (s: string, t: number | null) => pMode && num(s) !== null && t === null;
  // mešanice z drsenjem: pokaži tudi drugo fazo, da je jasno, katera je uporabljena
  const glide = (s: string, used: number | null, other: 'bubble' | 'dew') => {
    const v = num(s);
    if (!pMode || v === null || used === null) return '';
    const o = satTemp(table!.points, gaugeToAbs(v), other);
    return o !== null && Math.abs(o - used) >= 0.5 ? ` (${other === 'bubble' ? 'vrelišče' : 'rosišče'} ${f1(o)} °C, drsenje ${f1(Math.abs(o - used))} K)` : '';
  };
  const pointsLabel = (t: number | null, s: string, name: string, other: 'bubble' | 'dew') =>
    t !== null ? `${name} ${f1(t)} °C${glide(s, t, other)}` : outOfRange(s, t) ? 'Tlak je zunaj tabele.' : undefined;
  const ts = num(tSuc);
  const tl = num(tLiq);
  const sh = tEvap !== null && ts !== null ? superheat(ts, tEvap) : null;
  const sc = tCond !== null && tl !== null ? subcooling(tCond, tl) : null;

  return (
    <div class="sc">
      <div class="sc-fluids" role="radiogroup" aria-label="Hladivo">
        {FLUIDS.map((f) => (
          <button key={f.id} type="button" role="radio" aria-checked={fluid === f.id} class={fluid === f.id ? 'on' : ''} onClick={() => setFluid(f.id)}>
            <strong>{f.label}</strong>
            <span class={`sc-safety s-${f.safety}`}>{f.safety}</span>
          </button>
        ))}
      </div>
      <p class={`sc-note ${meta.safety === 'A3' ? 'danger' : ''}`}>{meta.note}</p>

      <div class="sc-mode" role="radiogroup" aria-label="Kaj vpišem">
        <button type="button" role="radio" aria-checked={mode === 't'} class={mode === 't' ? 'on' : ''} onClick={() => setMode('t')}>
          T nasičenja s skale
        </button>
        <button type="button" role="radio" aria-checked={mode === 'p'} class={mode === 'p' ? 'on' : ''} onClick={() => setMode('p')}>
          Tlak z manometra
        </button>
      </div>
      {mode === 'p' && !table && (
        <p class="sc-missing">
          P-T tabela za {meta.label} še ni objavljena, ker še ni preverjena z virom. Do takrat odčitaj temperaturo nasičenja s skale {meta.label} na
          manometru ali iz digitalne manometrske baterije.
        </p>
      )}

      <div class="sc-cards">
        <section class="sc-card">
          <h3>Pregrevanje (SH)</h3>
          <p class="sc-where">Nizkotlačna stran – sesalni vod na izstopu iz uparjalnika.</p>
          {pMode ? (
            <Field label="NT tlak (nadtlak)" unit="bar" value={lp} onInput={setLp} hint={pointsLabel(tEvap, lp, 'T uparjanja (rosišče)', 'bubble')} />
          ) : (
            <Field label="T uparjanja s skale" unit="°C" value={lp} onInput={setLp} hint="Na skali za izbrano hladivo, pri nizkem tlaku." />
          )}
          <Field label="T sesalnega voda (termometer)" unit="°C" value={tSuc} onInput={setTSuc} hint="Tipalo na cevi, izolirano od zraka." />
          <Result
            value={sh}
            name="SH"
            formula={sh !== null ? `${f1(ts!)} − (${f1(tEvap!)}) = ${f1(sh)} K` : ''}
            lowText="Pregrevanje blizu 0 K – v kompresor lahko pride kapljevina. Preveri ekspanzijski ventil in količino hladiva."
          />
          <a href={lessonSh}>Kaj pove pregrevanje →</a>
        </section>

        <section class="sc-card">
          <h3>Podhlajevanje (SC)</h3>
          <p class="sc-where">Visokotlačna stran – tekočinski vod na izstopu iz kondenzatorja.</p>
          {pMode ? (
            <Field
              label="VT tlak (nadtlak)"
              unit="bar"
              value={hp}
              onInput={setHp}
              hint={pointsLabel(tCond, hp, 'T kondenzacije (vrelišče)', 'dew')}
            />
          ) : (
            <Field label="T kondenzacije s skale" unit="°C" value={hp} onInput={setHp} hint="Na skali za izbrano hladivo, pri visokem tlaku." />
          )}
          <Field label="T tekočinskega voda (termometer)" unit="°C" value={tLiq} onInput={setTLiq} hint="Tipalo na cevi, izolirano od zraka." />
          <Result
            value={sc}
            name="SC"
            formula={sc !== null ? `${f1(tCond!)} − ${f1(tl!)} = ${f1(sc)} K` : ''}
            lowText="Podhlajevanja skoraj ni – v tekočinskem vodu je lahko para (premalo hladiva ali zožitev). Preveri skupaj s pregrevanjem."
          />
          <a href={lessonSc}>SH in SC berimo skupaj →</a>
        </section>
      </div>

      <section class="sc-card sc-patterns">
        <h3>Kako brati SH in SC skupaj</h3>
        <table>
          <thead>
            <tr>
              <th>SH</th>
              <th>SC</th>
              <th>Pogost vzrok</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>visoko</td>
              <td>nizko</td>
              <td>Premalo hladiva (puščanje)</td>
            </tr>
            <tr>
              <td>visoko</td>
              <td>visoko</td>
              <td>Zožitev pred ventilom – zaprt ekspanzijski ventil, zamašen filter sušilnik</td>
            </tr>
            <tr>
              <td>nizko</td>
              <td>visoko</td>
              <td>Preveč hladiva</td>
            </tr>
            <tr>
              <td>nizko</td>
              <td>nizko ali normalno</td>
              <td>Ekspanzijski ventil preveč odprt, premalo zraka na uparjalniku pri hlajenju</td>
            </tr>
          </tbody>
        </table>
        <p class="sc-small">»Visoko« in »nizko« pomeni glede na vrednost proizvajalca za isto obratovalno točko. Meri po ustalitvi, ne med odtajevanjem.</p>
      </section>

      {table && <p class="sc-source">P-T podatki: {table.source}</p>}
    </div>
  );
}
