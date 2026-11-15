import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  makeEnv,
  reading,
  scoreJob,
  shuffledDeck,
  supportEliminate,
  rng,
  TOOLS,
  LEVELS,
  DAY_MIN,
  START_REP,
  type Env,
  type FaultId,
  type Level,
  type Comp,
  type Reading,
  type JobResult,
} from '../../packages/engine/src/teren';
import type { PTPoint } from '../../packages/engine/src/ptcalc';
import './teren.css';

interface FaultText {
  id: FaultId;
  name: string;
  complaints: string[];
  indicators: string[];
  why: string;
  fix: string;
}
interface Props {
  faults: FaultText[];
  models: string[];
  customers: string[];
  places: string[];
  generic: { complaints: string[]; faults: FaultId[] };
  pts: PTPoint[];
  lessonSh: string;
}
interface Job {
  fault: FaultId;
  seed: number;
  env: Env;
  customer: string;
  place: string;
  model: string;
  age: number;
  complaint: string;
  drive: number;
}
interface LogItem {
  id: string;
  label: string;
  min: number;
  clock: string;
  r: Reading;
}
interface Stats {
  days: number;
  jobs: number;
  correct: number;
  measCorrect: number;
  bestDay: number;
  dayAcc: number[];
}
type Phase = 'start' | 'job' | 'result' | 'dayEnd' | 'over';

const KEY = 'akademija-tc:teren';
const loadStats = (): Stats => {
  try {
    return { days: 0, jobs: 0, correct: 0, measCorrect: 0, bestDay: 0, dayAcc: [], ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { days: 0, jobs: 0, correct: 0, measCorrect: 0, bestDay: 0, dayAcc: [] };
  }
};
const saveStats = (s: Stats) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* brez shranjevanja */
  }
};
const clock = (min: number) => {
  const t = 7 * 60 + min;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};
const ZONE_TXT: Record<string, string> = { ok: 'v redu', low: 'NIZKO', high: 'VISOKO', info: '' };
const AREAS: { label: string; comps: Comp[] }[] = [
  { label: 'Stranka in hiša', comps: ['stranka', 'radiator'] },
  { label: 'Notranja enota in voda', comps: ['krmilnik', 'manometer', 'pt', 'crpalka', 'lovilec', 'tripotni', 'raztezna', 'dogrevalnik'] },
  { label: 'Zunanja enota in hladivo', comps: ['uparjalnik', 'ventilator', 'zunanji-senzor', 'servisni', 'kompresor', 'eev', 'stiripotni', 'susilnik'] },
];
const COMP_NAME: Record<Comp, string> = {
  stranka: 'Stranka',
  radiator: 'Radiatorji / tla',
  krmilnik: 'Krmilnik',
  manometer: 'Manometer vode',
  pt: 'Ploščni prenosnik',
  crpalka: 'Obtočna črpalka',
  lovilec: 'Lovilec nesnage',
  tripotni: '3-potni ventil',
  raztezna: 'Raztezna posoda',
  dogrevalnik: 'Dogrevalnik',
  uparjalnik: 'Uparjalnik',
  ventilator: 'Ventilator',
  'zunanji-senzor': 'Zunanji senzor',
  servisni: 'Servisna priključka',
  kompresor: 'Kompresor',
  eev: 'Ekspanzijski ventil',
  stiripotni: '4-potni ventil',
  susilnik: 'Filter sušilnik',
};

export default function TerenGame({ faults, models, customers, places, generic, pts, lessonSh }: Props) {
  const faultText = useMemo(() => new Map(faults.map((f) => [f.id, f])), [faults]);
  const [stats, setStats] = useState<Stats>({ days: 0, jobs: 0, correct: 0, measCorrect: 0, bestDay: 0, dayAcc: [] });
  const [phase, setPhase] = useState<Phase>('start');
  const [level, setLevel] = useState<Level>('vajenec');
  const [learn, setLearn] = useState(true);
  const [minutes, setMinutes] = useState(0);
  const [money, setMoney] = useState(0);
  const [rep, setRep] = useState(START_REP);
  const [deck, setDeck] = useState<FaultId[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [onSite, setOnSite] = useState(0);
  const [log, setLog] = useState<LogItem[]>([]);
  const [comp, setComp] = useState<Comp | null>(null);
  const [support, setSupport] = useState<FaultId[] | null>(null);
  const [diagOpen, setDiagOpen] = useState(false);
  const [result, setResult] = useState<(JobResult & { guess: FaultId; meas: number }) | null>(null);
  const [dayJobs, setDayJobs] = useState<{ ok: boolean; meas: number; pay: number; fault: FaultId }[]>([]);
  const [hint, setHint] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => setStats(loadStats()), []);
  const scrollTop = () => top.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  const done = new Set(log.map((l) => l.id));

  function startGame() {
    setRep(START_REP);
    startDay(START_REP);
  }
  function startDay(r = rep) {
    setMinutes(0);
    setMoney(0);
    setDayJobs([]);
    setRep(r);
    nextJob(0, deck);
  }
  function nextJob(minNow: number, d: FaultId[]) {
    const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
    const r = rng(seed);
    const drive = r.int(15, 35);
    if (DAY_MIN - minNow < drive + 40) {
      endDay();
      return;
    }
    let pile = d;
    if (!pile.length) pile = shuffledDeck(seed);
    const [fault, ...rest] = pile;
    setDeck(rest);
    const env = makeEnv(fault, seed, level);
    const t = faultText.get(fault)!;
    setJob({ fault, seed, env, customer: r.pick(customers), place: r.pick(places), model: r.pick(models), age: r.int(1, 12), complaint: generic.faults.includes(fault) && r.chance(0.45) ? r.pick(generic.complaints) : r.pick(t.complaints), drive });
    setMinutes(minNow + drive);
    setOnSite(0);
    setLog([]);
    setComp(null);
    setSupport(null);
    setResult(null);
    setHint('');
    setPhase('job');
    scrollTop();
  }
  function endDay() {
    setPhase('dayEnd');
    scrollTop();
  }
  // shrani statistiko ob koncu dneva
  useEffect(() => {
    if (phase !== 'dayEnd' && phase !== 'over') return;
    const ok = dayJobs.filter((j) => j.ok);
    const s = { ...loadStats() };
    s.days += 1;
    s.bestDay = Math.max(s.bestDay, money);
    s.dayAcc = [...s.dayAcc, dayJobs.length ? Math.round((100 * ok.length) / dayJobs.length) : 0].slice(-10);
    saveStats(s);
    setStats(s);
  }, [phase]);

  function measure(id: string) {
    if (!job) return;
    const t = TOOLS.find((x) => x.id === id)!;
    if (done.has(id)) {
      setFlash(id);
      setTimeout(() => setFlash(null), 900);
      return;
    }
    if (t.needs && !done.has(t.needs)) return;
    const r = reading(id, job.env, pts);
    setLog([{ id, label: t.label, min: t.min, clock: clock(minutes + t.min), r }, ...log]);
    setMinutes(minutes + t.min);
    setOnSite(onSite + t.min);
    setHint('');
  }
  function callSupport() {
    if (!job || support) return;
    setSupport(supportEliminate(job.fault, job.seed));
    setMinutes(minutes + 15);
    setOnSite(onSite + 15);
  }
  function diagnose(guess: FaultId) {
    if (!job) return;
    const ok = guess === job.fault;
    const res = scoreJob(ok, onSite, log.length, rep);
    const newRep = Math.max(0, Math.min(5, rep + res.repDelta));
    setRep(newRep);
    setMoney(money + res.pay);
    setResult({ ...res, guess, meas: log.length });
    setDayJobs([...dayJobs, { ok, meas: log.length, pay: res.pay, fault: job.fault }]);
    const s = { ...loadStats() };
    s.jobs += 1;
    if (ok) {
      s.correct += 1;
      s.measCorrect += log.length;
    }
    saveStats(s);
    setStats(s);
    setDiagOpen(false);
    setPhase('result');
    scrollTop();
  }
  function afterResult() {
    if (rep <= 0) {
      setPhase('over');
      scrollTop();
      return;
    }
    nextJob(minutes, deck);
  }
  function giveHint() {
    if (!job) return;
    const abnormal = log.filter((l) => l.r.zone === 'high' || l.r.zone === 'low').map((l) => l.id);
    const has = (...ids: string[]) => ids.some((i) => done.has(i));
    let h: string;
    if (!has('zaslon', 'tlak-vode', 'zunanja', 'pogovor')) h = 'Najprej poceni in informativno: zaslon krmilnika, tlak vode, pregled zunanje enote. Skupaj 6 minut.';
    else if (abnormal.some((a) => ['tlak-vode', 'pretok', 'dt-vode', 'poslusaj'].includes(a))) h = 'Nekaj je narobe na vodni strani. Preveri pretok, ΔT, črpalko in lovilec – manometre na hladivo zaenkrat pusti.';
    else if (abnormal.some((a) => ['zunanja', 'nt'].includes(a))) h = 'Zunanja enota kaže težavo. Ventilator, led, odtajevanje (4-potni ventil) – ali pa SH/SC prek baterije.';
    else if (abnormal.some((a) => ['radiatorji', 'zaslon'].includes(a)) && !has('nastavitve', 'tripotni')) h = 'Hiša je hladna ali vroča, a naprava dela? Poglej nastavitve krivulje in 3-potni ventil.';
    else if (!has('baterija')) h = 'Voda in zunanja enota sta videti v redu. Zdaj se splača priklopiti baterijo in pogledati SH in SC skupaj.';
    else if (done.has('sh') && done.has('sc')) h = 'Beri SH in SC skupaj: visoko + nizko = premalo hladiva, visoko + visoko = zožitev (EEV ali filter sušilnik), nizko + visoko = preveč hladiva.';
    else h = 'Izmeri SH in SC – šele par pove, kaj se dogaja v krogu hladiva.';
    setHint(h);
  }

  const left = DAY_MIN - minutes;
  const header = (
    <div class="tg-head" aria-live="polite">
      <span title="Ura">🕒 {clock(minutes)}</span>
      <span title="Preostanek dneva">⏳ {Math.max(0, left)} min</span>
      <span title="Zaslužek dneva">💶 {money} €</span>
      <span title="Ugled" aria-label={`Ugled ${rep} od 5`}>
        {'★'.repeat(rep)}
        <span class="tg-dim">{'★'.repeat(5 - rep)}</span>
      </span>
      <div class="tg-daybar" aria-hidden="true">
        <span style={{ width: `${Math.min(100, (100 * minutes) / DAY_MIN)}%` }} />
      </div>
    </div>
  );

  // ---------- začetek ----------
  if (phase === 'start') {
    const acc = stats.jobs ? Math.round((100 * stats.correct) / stats.jobs) : null;
    return (
      <div class="tg" ref={top}>
        <div class="tg-card tg-intro">
          <h2>Delovni dan serviserja</h2>
          <p>
            Imaš <strong>480 minut</strong>. Vsak klic je skrita okvara. Vsaka meritev stane čas. Ko misliš, da veš, postavi diagnozo. Pravilna in hitra diagnoza prinese denar in
            ugled ★, ugibanje in napake ga vzamejo. Pri 0 ★ je igre konec.
          </p>
          <ul class="tg-rules">
            <li>Klikni del na shemi – pokažejo se orodja zanj.</li>
            <li>SH in SC zahtevata priklopljeno manometrsko baterijo (8 min).</li>
            <li>Koda na zaslonu je simptom – včasih je ni, včasih je v zgodovini stara, nepovezana.</li>
            <li>Enkrat na nalog lahko pokličeš podporo (−15 min, izloči 5 napačnih možnosti).</li>
          </ul>
          <fieldset class="tg-levels">
            <legend>Težavnost</legend>
            {(Object.keys(LEVELS) as Level[]).map((l) => (
              <label class={level === l ? 'on' : ''}>
                <input type="radio" name="lvl" checked={level === l} onChange={() => { setLevel(l); setLearn(LEVELS[l].learn); }} />
                <strong>{LEVELS[l].label}</strong>
                <span>{l === 'vajenec' ? 'učni način, malo šuma, kode pogosteje' : l === 'serviser' ? 'realen šum, stare kode v zgodovini' : 'brez učnega načina, več šuma, kode redko'}</span>
              </label>
            ))}
          </fieldset>
          <button type="button" class="btn wide" onClick={startGame}>
            ▶ Začni delovni dan
          </button>
          {stats.jobs > 0 && (
            <p class="tg-stats">
              Odigranih dni: {stats.days} · nalogov: {stats.jobs} · točnost: {acc} % · povprečno meritev pri pravilni diagnozi: {stats.correct ? (stats.measCorrect / stats.correct).toFixed(1) : '–'} · najboljši dan: {stats.bestDay} €
            </p>
          )}
        </div>
      </div>
    );
  }

  // ---------- konec dneva / igre ----------
  if (phase === 'dayEnd' || phase === 'over') {
    const ok = dayJobs.filter((j) => j.ok);
    return (
      <div class="tg" ref={top}>
        {header}
        <div class={`tg-card tg-summary ${phase === 'over' ? 'bad' : ''}`}>
          <h2>{phase === 'over' ? 'Konec igre – ugled 0 ★' : 'Konec delovnega dne'}</h2>
          <p class="tg-big">{money} €</p>
          <dl class="tg-kpi">
            <div><dt>Nalogov</dt><dd>{dayJobs.length}</dd></div>
            <div><dt>Pravilnih</dt><dd>{ok.length}</dd></div>
            <div><dt>Meritev / pravilna</dt><dd>{ok.length ? (ok.reduce((s, j) => s + j.meas, 0) / ok.length).toFixed(1) : '–'}</dd></div>
            <div><dt>Najboljši dan</dt><dd>{stats.bestDay} €</dd></div>
          </dl>
          <ul class="tg-daylist">
            {dayJobs.map((j, i) => (
              <li class={j.ok ? 'ok' : 'bad'}>
                {i + 1}. {faultText.get(j.fault)?.name} – {j.ok ? '✓' : '✗'} {j.pay} € ({j.meas} meritev)
              </li>
            ))}
          </ul>
          {stats.dayAcc.length > 1 && <p class="tg-stats">Točnost po dnevih: {stats.dayAcc.join(' % → ')} %</p>}
          <div class="tg-actions">
            {phase === 'dayEnd' && (
              <button type="button" class="btn" onClick={() => startDay(rep)}>
                ▶ Naslednji dan
              </button>
            )}
            <button type="button" class="btn secondary" onClick={() => setPhase('start')}>
              Na začetek
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;
  const t = faultText.get(job.fault)!;

  // ---------- rezultat ----------
  if (phase === 'result' && result) {
    const guessName = faultText.get(result.guess)?.name;
    const keyMeas = new Set(log.filter((l) => l.r.zone === 'high' || l.r.zone === 'low').map((l) => l.label));
    return (
      <div class="tg" ref={top}>
        {header}
        <div class={`tg-card tg-result ${result.correct ? 'ok' : 'bad'}`}>
          <p class="tg-verdict">{result.correct ? '✓ Pravilna diagnoza' : `✗ Narobe: ${guessName}`}</p>
          <h2>{t.name}</h2>
          <p class="tg-big">{result.pay > 0 ? '+' : ''}{result.pay} €</p>
          <ul class="tg-notes">{result.notes.map((n) => <li>{n}</li>)}</ul>
          <h3>3 ključni indikatorji</h3>
          <ol>{t.indicators.map((i) => <li>{i}</li>)}</ol>
          <h3>Zakaj</h3>
          <p>{t.why}</p>
          <h3>Popravilo</h3>
          <p>{t.fix}</p>
          <p class="tg-stats">
            Meritev: {result.meas} · na lokaciji {onSite} min{keyMeas.size ? ` · odstopanja: ${[...keyMeas].join(', ')}` : ''}
          </p>
          <div class="tg-actions">
            <button type="button" class="btn" onClick={afterResult}>
              {rep <= 0 ? 'Konec igre' : DAY_MIN - minutes < 55 ? 'Konec dneva →' : 'Naslednji nalog →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- nalog ----------
  const shown = comp ? TOOLS.filter((x) => x.comp === comp) : TOOLS;
  return (
    <div class="tg" ref={top}>
      {header}
      <div class="tg-cols">
        <div class="tg-left">
          <div class="tg-card tg-order">
            <p class="eyebrow">Delovni nalog · {job.place}</p>
            <p class="tg-quote">»{job.complaint}«</p>
            <dl class="tg-meta">
              <div><dt>Stranka</dt><dd>{job.customer}</dd></div>
              <div><dt>Naprava</dt><dd>{job.model}, {job.age} let</dd></div>
              <div><dt>Ogrevanje</dt><dd>{job.env.heating}</dd></div>
              <div><dt>Zunaj</dt><dd>{job.env.tOut} °C</dd></div>
              <div><dt>Na lokaciji</dt><dd>{onSite} min</dd></div>
            </dl>
          </div>
          <Schema env={job.env} done={done} comp={comp} onComp={(c) => setComp(comp === c ? null : c)} />
          <div class="tg-card">
            <div class="tg-toolhead">
              <h3>{comp ? COMP_NAME[comp] : 'Vsa orodja'}</h3>
              {comp && (
                <button type="button" class="tg-link" onClick={() => setComp(null)}>
                  pokaži vse
                </button>
              )}
            </div>
            {AREAS.map((a) => {
              const list = shown.filter((x) => a.comps.includes(x.comp));
              if (!list.length) return null;
              return (
                <div class="tg-area">
                  {!comp && <p class="tg-arealabel">{a.label}</p>}
                  <div class="tg-tools">
                    {list.map((x) => {
                      const locked = !!x.needs && !done.has(x.needs);
                      const isDone = done.has(x.id);
                      return (
                        <button type="button" class={`tg-tool ${isDone ? 'done' : ''} ${locked ? 'locked' : ''}`} disabled={locked} onClick={() => measure(x.id)} title={locked ? 'Najprej priklopi manometrsko baterijo' : ''}>
                          <span>{isDone ? '✓ ' : locked ? '🔒 ' : ''}{x.label}</span>
                          <span class="tg-cost">{isDone ? 'opravljeno' : `${x.min} min`}{x.confirm && !isDone ? ' · potrditev' : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div class="tg-right">
          <div class="tg-card tg-diagbox">
            <button type="button" class="btn wide" onClick={() => setDiagOpen(true)}>
              Postavi diagnozo
            </button>
            <div class="tg-row">
              <button type="button" class="btn secondary" disabled={!!support} onClick={callSupport}>
                📞 Podpora (−15 min)
              </button>
              {learn && (
                <button type="button" class="btn secondary" onClick={giveHint}>
                  💡 Namig
                </button>
              )}
            </div>
            <label class="tg-learn">
              <input type="checkbox" checked={learn} onChange={() => setLearn(!learn)} /> Učni način (normalna območja)
            </label>
            {hint && <p class="tg-hint">{hint}</p>}
            {support && <p class="tg-hint">Podpora: »Ni {support.map((s) => faultText.get(s)?.name.toLowerCase()).join(', ni ')}.«</p>}
          </div>
          <div class="tg-card">
            <h3>Servisni zapisnik</h3>
            {!log.length && <p class="tg-muted">Še ni meritev. Začni s poceni meritvami.</p>}
            <ol class="tg-log">
              {log.map((l) => (
                <li class={`z-${l.r.zone} ${flash === l.id ? 'flash' : ''}`}>
                  <div class="tg-logtop">
                    <span>{l.clock} · {l.label}</span>
                    <span>{l.min} min</span>
                  </div>
                  <p>
                    {l.r.text} {ZONE_TXT[l.r.zone] && <strong class="tg-zone">{ZONE_TXT[l.r.zone]}</strong>}
                  </p>
                  {learn && l.r.normal && <p class="tg-normal">Normalno: {l.r.normal}</p>}
                </li>
              ))}
            </ol>
          </div>
          {learn && (
            <details class="tg-card tg-ref">
              <summary>Referenčna tabela (zdrava naprava)</summary>
              <table>
                <tbody>
                  <tr><th>T uparjanja</th><td>T zunaj − 6…8 K</td></tr>
                  <tr><th>T kondenzacije</th><td>T dovoda + 2,5…4 K</td></tr>
                  <tr><th>Pregretje</th><td>4–6,5 K</td></tr>
                  <tr><th>Podhladitev</th><td>3–5 K</td></tr>
                  <tr><th>ΔT vode</th><td>4,5–6 K</td></tr>
                  <tr><th>Pretok</th><td>1,15–1,35 m³/h</td></tr>
                  <tr><th>Tlak vode</th><td>1,4–1,8 bar</td></tr>
                </tbody>
              </table>
              <a href={lessonSh}>Kako brati SH in SC →</a>
            </details>
          )}
        </div>
      </div>

      {diagOpen && (
        <div class="tg-modal" role="dialog" aria-modal="true" aria-label="Diagnoza" onClick={(e) => e.target === e.currentTarget && setDiagOpen(false)}>
          <div class="tg-modal-in">
            <h3>Kaj je vzrok?</h3>
            <p class="tg-muted">{log.length} meritev, {onSite} min na lokaciji. {log.length <= 1 ? 'Pozor: z ≤ 1 meritvijo je plačilo ×0,7.' : ''}</p>
            <div class="tg-options">
              {faults.map((f) => {
                const out = support?.includes(f.id);
                return (
                  <button type="button" disabled={out} class={out ? 'out' : ''} onClick={() => diagnose(f.id)}>
                    {f.name}
                  </button>
                );
              })}
            </div>
            <button type="button" class="btn secondary wide" onClick={() => setDiagOpen(false)}>
              Še bom meril
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- klikljiva shema, ki odraža izmerjeno ----------
function Schema({ env, done, comp, onComp }: { env: Env; done: Set<string>; comp: Comp | null; onComp: (c: Comp) => void }) {
  const seen = (...ids: string[]) => ids.some((i) => done.has(i));
  const fanStopped = !env.fanOn && seen('zunanja', 'ventilator');
  const ice = seen('zunanja') ? env.ice : 'ni';
  const radColor = !seen('radiatorji') ? '#e9e4da' : env.tRadIn > 34 ? '#f08a3c' : env.tRadIn > 27 ? '#f2c46a' : '#9cc3e6';
  const P = ({ id, x, y, w, h, label, children }: { id: Comp; x: number; y: number; w: number; h: number; label: string; children?: any }) => (
    <g
      class={`tg-comp ${comp === id ? 'sel' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={comp === id}
      onClick={() => onComp(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onComp(id);
        }
      }}
    >
      <rect class="tg-hitbox" x={x} y={y} width={w} height={h} rx="6" />
      {children}
      <text x={x + w / 2} y={y + h + 11} text-anchor="middle" class="tg-lbl">
        {label}
      </text>
    </g>
  );
  const gaugeNeedle = (cx: number, cy: number, v: number) => {
    const a = ((-225 + Math.max(0, Math.min(1, v)) * 270) * Math.PI) / 180;
    return <line x1={cx} y1={cy} x2={cx + 9 * Math.cos(a)} y2={cy + 9 * Math.sin(a)} stroke="#d9412b" stroke-width="2" />;
  };
  return (
    <div class="tg-card tg-schema">
      <div class="tg-svgwrap">
      <svg viewBox="0 0 640 300" role="group" aria-label="Shema naprave – klikni del">
        <rect x="0" y="0" width="640" height="300" fill="#eef3f7" />
        {/* cevi hladiva */}
        <path d="M150,70 H330" stroke="#d9412b" stroke-width="5" fill="none" />
        <path d="M150,210 H330" stroke="#2f7fd1" stroke-width="5" fill="none" />
        {/* zunanja enota */}
        <rect x="14" y="24" width="250" height="240" rx="10" fill="#fdfcf9" stroke="#b9c2c9" />
        <text x="22" y="18" class="tg-area-lbl">ZUNANJA ENOTA</text>
        <P id="uparjalnik" x={24} y={34} w={56} h={150} label="Uparjalnik">
          <rect x="24" y="34" width="56" height="150" fill="#b9c2c9" />
          {Array.from({ length: 10 }, (_, i) => <line x1={28 + i * 5} y1="36" x2={28 + i * 5} y2="182" stroke="#8f979e" />)}
          {ice === 'polno' && <rect x="22" y="32" width="60" height="154" fill="rgba(240,250,255,.92)" stroke="#9fc9e8" />}
          {ice === 'delno' && <rect x="22" y="130" width="60" height="56" fill="rgba(240,250,255,.92)" stroke="#9fc9e8" />}
        </P>
        <P id="ventilator" x={88} y={60} w={70} h={70} label="Ventilator">
          <circle cx="123" cy="95" r="32" fill="#e9e4da" stroke="#5b6168" />
          <g class={fanStopped ? '' : 'tg-spin'} style="transform-origin:123px 95px">
            {[0, 120, 240].map((d) => <rect x="119" y="66" width="8" height="28" rx="4" fill="#3a3f44" transform={`rotate(${d} 123 95)`} />)}
          </g>
          {fanStopped && <text x="123" y="140" text-anchor="middle" class="tg-alert">STOJI</text>}
        </P>
        <P id="zunanji-senzor" x={168} y={30} w={30} h={22} label="Senzor T">
          <rect x="176" y="32" width="14" height="18" rx="2" fill="#fff" stroke="#5b6168" />
          {seen('ntc') && !Number.isFinite(env.ntcOhm) && <text x="183" y="46" text-anchor="middle" class="tg-alert">∞</text>}
        </P>
        <P id="kompresor" x={176} y={150} w={44} h={60} label="Kompresor">
          <rect x="180" y="156" width="36" height="50" rx="16" fill="#2f4f3f" />
          {seen('tok') && !env.compRunning && <text x="198" y="186" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">0 A</text>}
        </P>
        <P id="stiripotni" x={176} y={100} w={44} h={28} label="4-potni">
          <rect x="182" y="106" width="32" height="14" rx="6" fill="#c9a227" />
          {seen('tuljava4') && !Number.isFinite(env.coil4) && <text x="198" y="117" text-anchor="middle" class="tg-alert">∞</text>}
        </P>
        <P id="eev" x={226} y={150} w={34} h={34} label="EEV">
          <rect x="232" y="156" width="22" height="22" rx="4" fill="#c9a227" />
          <rect x="236" y="148" width="14" height="10" fill="#1d1f22" />
        </P>
        <P id="susilnik" x={226} y={196} w={34} h={20} label="Sušilnik">
          <rect x="230" y="200" width="26" height="12" rx="5" fill="#6d7b3a" />
          {seen('susilnik') && env.dtDrier > 3 && <rect x="244" y="198" width="12" height="16" rx="4" fill="rgba(255,255,255,.8)" />}
        </P>
        <P id="servisni" x={226} y={56} w={34} h={34} label="Servis">
          <circle cx="236" cy="66" r="5" fill="#1d6fd1" />
          <circle cx="252" cy="66" r="5" fill="#d9412b" />
          {done.has('baterija') && (
            <g>
              <circle cx="236" cy="82" r="10" fill="#fff" stroke="#2f7fd1" stroke-width="3" />
              <circle cx="254" cy="82" r="10" fill="#fff" stroke="#d9412b" stroke-width="3" />
              {gaugeNeedle(236, 82, done.has('nt') ? 0.35 : 0)}
              {gaugeNeedle(254, 82, done.has('vt') ? 0.6 : 0)}
            </g>
          )}
        </P>
        {ice === 'sesalni' && <path d="M150,210 H200" stroke="rgba(240,250,255,.95)" stroke-width="10" />}
        {/* notranja enota */}
        <rect x="290" y="24" width="190" height="240" rx="10" fill="#fdfcf9" stroke="#b9c2c9" />
        <text x="298" y="18" class="tg-area-lbl">NOTRANJA ENOTA</text>
        <P id="pt" x={300} y={56} w={50} h={170} label="Prenosnik">
          {Array.from({ length: 8 }, (_, i) => <rect x={306 + i * 5} y="60" width="3" height="160" fill="#9aa3ad" />)}
        </P>
        <P id="krmilnik" x={362} y={34} w={70} h={42} label="Krmilnik">
          <rect x="364" y="36" width="66" height="38" rx="4" fill={done.has('zaslon') && env.code ? '#3a0e0a' : '#0d2a24'} />
          <text x="397" y="60" text-anchor="middle" font-size="10" font-weight="800" fill={done.has('zaslon') && env.code ? '#ff7b6b' : '#7dffcf'} font-family="monospace">
            {done.has('zaslon') ? (env.code ? env.code.split(' ')[0] : 'OK') : '— —'}
          </text>
        </P>
        <P id="manometer" x={440} y={34} w={34} h={34} label="Tlak">
          <circle cx="457" cy="51" r="14" fill="#fff" stroke="#3a3f44" stroke-width="3" />
          {gaugeNeedle(457, 51, done.has('tlak-vode') ? env.pWater / 4 : 0)}
        </P>
        <P id="dogrevalnik" x={362} y={92} w={56} h={22} label="Dogrevalnik">
          <rect x="366" y="96" width="48" height="12" rx="6" fill={done.has('poraba') && env.backupOn ? '#ff5a2a' : '#9aa3ad'} />
        </P>
        <P id="tripotni" x={428} y={92} w={40} h={30} label="3-potni">
          <rect x="436" y="96" width="24" height="20" fill="#c9a227" />
          {done.has('tripotni') && <path d={env.valve3 === 'bojler' ? 'M448,106 v12' : 'M448,106 h12'} stroke="#a4502a" stroke-width="3" />}
        </P>
        <P id="crpalka" x={362} y={138} w={44} h={44} label="Črpalka">
          <circle cx="384" cy="160" r="16" fill="#c0392b" />
          {done.has('poslusaj') && env.pumpSound === 'grgra' && <text x="384" y="164" text-anchor="middle" fill="#fff" font-size="12">≈</text>}
          {done.has('crpalka-pregled') && !env.pumpRunning && <text x="384" y="164" text-anchor="middle" fill="#fff" font-size="12" font-weight="800">✗</text>}
        </P>
        <P id="lovilec" x={414} y={150} w={40} h={24} label="Lovilec">
          <rect x="418" y="156" width="32" height="12" rx="5" fill="#c9a227" />
          {done.has('lovilec') && env.strainer === 'zamasen' && <circle cx="434" cy="162" r="7" fill="#5b3a1e" />}
        </P>
        <P id="raztezna" x={420} y={196} w={44} h={50} label="Raztezna">
          <rect x="430" y="200" width="24" height="40" rx="10" fill="#c0392b" />
        </P>
        {/* hiša */}
        <path d="M500,90 L565,40 L630,90 V264 H500 Z" fill="#fdfcf9" stroke="#b9c2c9" />
        <text x="508" y="84" class="tg-area-lbl">HIŠA</text>
        <path d="M480,120 H510 M480,200 H510" stroke="#f0a24a" stroke-width="4" />
        <P id="radiator" x={516} y={120} w={98} h={84} label={env.heating === 'radiatorji' ? 'Radiator' : 'Talno'}>
          {Array.from({ length: 8 }, (_, i) => <rect x={522 + i * 11} y="124" width="8" height="76" rx="3" fill={radColor} stroke="#b9c2c9" />)}
        </P>
        <P id="stranka" x={540} y={214} w={50} h={36} label="Stranka">
          <circle cx="565" cy="222" r="7" fill="#5b6168" />
          <rect x="556" y="230" width="18" height="16" rx="6" fill="#5b6168" />
        </P>
      </svg>
      </div>
      <p class="tg-muted tg-schemanote">Klikni del naprave – pokažejo se orodja zanj. Shema pokaže, kar si izmeril. Na telefonu shemo povleci levo in desno.</p>
    </div>
  );
}
