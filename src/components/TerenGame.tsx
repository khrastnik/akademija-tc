import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  makeEnv,
  reading,
  scoreDiagnosis,
  seasonDeck,
  seasonForDay,
  supportEliminate,
  comboPartner,
  rng,
  TOOLS,
  LEVELS,
  SEASONS,
  DAYS_PER_SEASON,
  DAY_MIN,
  START_REP,
  type Env,
  type FaultId,
  type Level,
  type Comp,
  type Reading,
  type JobResult,
  type Season,
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
interface Learn {
  faults: Record<string, { steps: string[]; confuse: { with: FaultId; how: string }; proof: string[]; lessons: string[]; parts: string[] }>;
  meanings: Record<string, { high?: string; low?: string }>;
}
interface Props {
  faults: FaultText[];
  models: string[];
  customers: string[];
  places: string[];
  generic: { complaints: string[]; faults: FaultId[] };
  learn: Learn;
  pts: PTPoint[];
  lessonSh: string;
  /** Povezave iz rezultata: naslovi lekcij, imena delov na strani okvar. */
  links: { lessonBase: string; okvare: string; lessons: Record<string, string>; parts: Record<string, string> };
}
interface Job {
  faults: FaultId[];
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
  campaignDay: number;
}
type Phase = 'start' | 'job' | 'result' | 'dayEnd' | 'over';
type Res = JobResult & { level: 'ok' | 'partial' | 'wrong'; guess: FaultId[]; meas: number };

const KEY = 'akademija-tc:teren';
const EMPTY: Stats = { days: 0, jobs: 0, correct: 0, measCorrect: 0, bestDay: 0, dayAcc: [], campaignDay: 0 };
const loadStats = (): Stats => {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...EMPTY };
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
const toolLabel = (id: string) => TOOLS.find((t) => t.id === id)?.label ?? id;

export default function TerenGame({ faults, models, customers, places, generic, learn: L, pts, lessonSh, links }: Props) {
  const faultText = useMemo(() => new Map(faults.map((f) => [f.id, f])), [faults]);
  const [stats, setStats] = useState<Stats>(EMPTY);
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
  const [picked, setPicked] = useState<FaultId[]>([]);
  const [result, setResult] = useState<Res | null>(null);
  const [dayJobs, setDayJobs] = useState<{ level: Res['level']; meas: number; pay: number; faults: FaultId[] }[]>([]);
  const [hint, setHint] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const top = useRef<HTMLDivElement>(null);

  // Vaja ene okvare: povezava s strani okvar (?vaja=<id>) – en nalog s to okvaro, brez vpliva na kampanjo in statistiko.
  const [practice, setPractice] = useState<FaultId | null>(null);
  const [practicing, setPracticing] = useState(false);
  useEffect(() => {
    setStats(loadStats());
    const v = new URLSearchParams(location.search).get('vaja') as FaultId | null;
    if (v && faultText.has(v)) setPractice(v);
  }, []);
  const season: Season = seasonForDay(stats.campaignDay);
  const S = SEASONS[season];
  const multi = LEVELS[level].combo > 0;
  const scrollTop = () => top.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  const done = new Set(log.map((l) => l.id));
  const meaning = (id: string, r: Reading) => (r.zone === 'high' || r.zone === 'low' ? L.meanings[id]?.[r.zone] : undefined);

  function startDay(r = rep) {
    setMinutes(0);
    setMoney(0);
    setDayJobs([]);
    setRep(r);
    const d = seasonDeck(season, (Date.now() >>> 0) ^ 0x9e3779b9);
    nextJob(0, d);
  }
  function startPractice() {
    if (!practice) return;
    setPracticing(true);
    setMoney(0);
    setRep(START_REP);
    setDayJobs([]);
    nextJob(0, deck, practice);
  }
  function nextJob(minNow: number, d: FaultId[], forced?: FaultId) {
    const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
    const r = rng(seed);
    const drive = r.int(15, 35);
    if (DAY_MIN - minNow < drive + 40) {
      setPhase('dayEnd');
      scrollTop();
      return;
    }
    const pile = d.length ? d : seasonDeck(season, seed);
    const [first, ...rest] = forced ? [forced, ...pile] : pile;
    const partner = !forced && r.chance(LEVELS[level].combo) ? comboPartner(first, r) : null;
    const fs = partner ? [first, partner] : [first];
    if (!forced) setDeck(rest);
    const env = makeEnv(fs, seed, level, S.tOut);
    const t = faultText.get(first)!;
    setJob({
      faults: fs,
      seed,
      env,
      customer: r.pick(customers),
      place: r.pick(places),
      model: r.pick(models),
      age: r.int(1, 12),
      complaint: generic.faults.includes(first) && r.chance(0.45) ? r.pick(generic.complaints) : r.pick(t.complaints),
      drive,
    });
    setMinutes(minNow + drive);
    setOnSite(0);
    setLog([]);
    setComp(null);
    setSupport(null);
    setPicked([]);
    setResult(null);
    setHint('');
    setPhase('job');
    scrollTop();
  }
  // shrani statistiko ob koncu dneva, premakni kampanjo naprej
  useEffect(() => {
    if (phase !== 'dayEnd' && phase !== 'over') return;
    const ok = dayJobs.filter((j) => j.level === 'ok');
    const s = { ...loadStats() };
    s.days += 1;
    s.bestDay = Math.max(s.bestDay, money);
    s.dayAcc = [...s.dayAcc, dayJobs.length ? Math.round((100 * ok.length) / dayJobs.length) : 0].slice(-10);
    if (phase === 'dayEnd') s.campaignDay += 1;
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
    setSupport(supportEliminate(job.faults, job.seed));
    setMinutes(minutes + 15);
    setOnSite(onSite + 15);
  }
  function togglePick(f: FaultId) {
    if (!multi) {
      diagnose([f]);
      return;
    }
    setPicked(picked.includes(f) ? picked.filter((x) => x !== f) : picked.length >= 2 ? [picked[1], f] : [...picked, f]);
  }
  function diagnose(guess: FaultId[]) {
    if (!job || !guess.length) return;
    const res = scoreDiagnosis(job.faults, guess, onSite, log.length, rep);
    const newRep = Math.max(0, Math.min(5, rep + res.repDelta));
    setRep(newRep);
    setMoney(money + res.pay);
    setResult({ ...res, guess, meas: log.length });
    setDayJobs([...dayJobs, { level: res.level, meas: log.length, pay: res.pay, faults: job.faults }]);
    if (!practicing) {
      const s = { ...loadStats() };
      s.jobs += 1;
      if (res.level === 'ok') {
        s.correct += 1;
        s.measCorrect += log.length;
      }
      saveStats(s);
      setStats(s);
    }
    setDiagOpen(false);
    setPhase('result');
    scrollTop();
  }
  function afterResult() {
    if (practicing) {
      setPracticing(false);
      setPhase('start');
      scrollTop();
      return;
    }
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
    if (!has('zaslon', 'tlak-vode', 'zunanja', 'pogovor')) h = 'Najprej poceni in informativno: zaslon krmilnika, tlak vode, pregled zunanje enote. Skupaj 6 minut – in že veš, na kateri strani iskati.';
    else if (abnormal.some((a) => ['tlak-vode', 'pretok', 'dt-vode', 'poslusaj'].includes(a))) h = 'Nekaj je narobe na vodni strani. Preveri pretok, ΔT, črpalko in lovilec – manometre na hladivo zaenkrat pusti. Vodna stran je cenejša in pogostejša.';
    else if (abnormal.some((a) => ['zunanja', 'nt'].includes(a))) h = 'Zunanja enota kaže težavo. Vrti se ventilator? Je led povsod (odtajevanje) ali le spodaj? Ali pa SH/SC prek baterije.';
    else if (abnormal.some((a) => ['radiatorji', 'zaslon'].includes(a)) && !has('nastavitve', 'tripotni')) h = 'Hiša je hladna ali pregreta, naprava pa dela? Poglej nastavitve krivulje, zunanjo T na zaslonu in 3-potni ventil.';
    else if (!has('baterija')) h = 'Voda in zunanja enota sta videti v redu. Zdaj se splača priklopiti baterijo in pogledati SH in SC skupaj.';
    else if (done.has('sh') && done.has('sc')) h = 'Beri SH in SC skupaj: visoko + nizko = premalo hladiva, visoko + visoko = zožitev (EEV ali filter sušilnik), nizko + visoko = preveč hladiva, SH ≈ 0 = odprt EEV.';
    else h = 'Izmeri SH in SC – šele par pove, kaj se dogaja v krogu hladiva.';
    if (multi && log.length >= 4) h += ' Pozor: na tej stopnji sta lahko dve okvari – ko eno najdeš, preveri, ali razloži VSE odstopanje.';
    setHint(h);
  }

  const left = DAY_MIN - minutes;
  const header = (
    <div class="tg-head" aria-live="polite">
      <span title={practicing ? 'Vaja' : 'Letni čas'}>{practicing ? '🎯 vaja' : `${S.icon} ${season}`}</span>
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
  const seasonCard = (
    <div class="tg-season">
      <p class="eyebrow">
        Kampanja · dan {stats.campaignDay + 1} · {S.icon} {S.label}
      </p>
      <p>{S.intro}</p>
      <p class="tg-muted">
        Zunaj {S.tOut[0]} do {S.tOut[1]} °C. Pogosteje: {S.typical.map((f) => faultText.get(f)?.name.toLowerCase()).join(', ')}.
        {' '}
        {DAYS_PER_SEASON - (stats.campaignDay % DAYS_PER_SEASON)} {DAYS_PER_SEASON - (stats.campaignDay % DAYS_PER_SEASON) === 1 ? 'dan' : 'dneva'} do naslednjega letnega časa.
      </p>
    </div>
  );

  // ---------- začetek ----------
  if (phase === 'start') {
    const acc = stats.jobs ? Math.round((100 * stats.correct) / stats.jobs) : null;
    return (
      <div class="tg" ref={top}>
        <div class="tg-card tg-intro">
          {practice && (
            <div class="tg-practice">
              <p class="eyebrow">Vaja ene okvare</p>
              <h3>{faultText.get(practice)?.name}</h3>
              <p class="tg-muted">En nalog s to okvaro – brez kombinacij, brez vpliva na kampanjo in statistiko. Stranka okvare ne pove, poiščeš jo z meritvami.</p>
              <button type="button" class="btn wide" onClick={startPractice}>
                ▶ Začni vajo
              </button>
            </div>
          )}
          <h2>Delovni dan serviserja</h2>
          {seasonCard}
          <p>
            Imaš <strong>480 minut</strong>. Vsak klic je skrita okvara. Vsaka meritev stane čas. Ko misliš, da veš, postavi diagnozo. Pravilna in hitra diagnoza prinese denar in
            ugled ★, ugibanje in napake ga vzamejo. Pri 0 ★ je igre konec.
          </p>
          <ul class="tg-rules">
            <li>Klikni del na shemi – pokažejo se orodja zanj.</li>
            <li>SH in SC zahtevata priklopljeno manometrsko baterijo (8 min).</li>
            <li>Koda na zaslonu je simptom – včasih je ni, včasih je v zgodovini stara, nepovezana.</li>
            <li>Enkrat na nalog lahko pokličeš podporo (−15 min, izloči 5 napačnih možnosti).</li>
            <li>Po vsakem nalogu izveš, kako bi do diagnoze prišel in zakaj je pravilna.</li>
          </ul>
          <fieldset class="tg-levels">
            <legend>Težavnost</legend>
            {(Object.keys(LEVELS) as Level[]).map((l) => (
              <label class={level === l ? 'on' : ''}>
                <input type="radio" name="lvl" checked={level === l} onChange={() => { setLevel(l); setLearn(LEVELS[l].learn); }} />
                <strong>{LEVELS[l].label}</strong>
                <span>
                  {l === 'vajenec'
                    ? 'učni način, malo šuma, kode pogosteje, vedno ena okvara'
                    : l === 'serviser'
                      ? 'realen šum, stare kode v zgodovini, včasih dve okvari hkrati'
                      : 'brez učnega načina, več šuma, kode redko, pogosto dve okvari'}
                </span>
              </label>
            ))}
          </fieldset>
          <button type="button" class="btn wide" onClick={() => startDay(START_REP)}>
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
    const ok = dayJobs.filter((j) => j.level === 'ok');
    const nextS = SEASONS[seasonForDay(stats.campaignDay)];
    return (
      <div class="tg" ref={top}>
        {header}
        <div class={`tg-card tg-summary ${phase === 'over' ? 'bad' : ''}`}>
          <h2>{phase === 'over' ? 'Konec igre – ugled 0 ★' : 'Konec delovnega dne'}</h2>
          <p class="tg-big">{money} €</p>
          <dl class="tg-kpi">
            <div><dt>Nalogov</dt><dd>{dayJobs.length}</dd></div>
            <div><dt>Pravilnih</dt><dd>{ok.length}</dd></div>
            <div><dt>Delno</dt><dd>{dayJobs.filter((j) => j.level === 'partial').length}</dd></div>
            <div><dt>Meritev / pravilna</dt><dd>{ok.length ? (ok.reduce((s, j) => s + j.meas, 0) / ok.length).toFixed(1) : '–'}</dd></div>
            <div><dt>Najboljši dan</dt><dd>{stats.bestDay} €</dd></div>
          </dl>
          <ul class="tg-daylist">
            {dayJobs.map((j, i) => (
              <li class={j.level === 'ok' ? 'ok' : j.level === 'partial' ? 'part' : 'bad'}>
                {i + 1}. {j.faults.map((f) => faultText.get(f)?.name).join(' + ')} – {j.level === 'ok' ? '✓' : j.level === 'partial' ? '½' : '✗'} {j.pay} € ({j.meas} meritev)
              </li>
            ))}
          </ul>
          {stats.dayAcc.length > 1 && <p class="tg-stats">Točnost po dnevih: {stats.dayAcc.join(' % → ')} %</p>}
          {phase === 'dayEnd' && (
            <p class="tg-stats">
              Naslednji dan: {nextS.icon} {nextS.label}
            </p>
          )}
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

  // ---------- rezultat z razlago ----------
  if (phase === 'result' && result) {
    const abnormal = log.filter((l) => l.r.zone === 'high' || l.r.zone === 'low');
    const wrongGuesses = result.guess.filter((g) => !job.faults.includes(g));
    const missed = job.faults.filter((f) => !result.guess.includes(f));
    return (
      <div class="tg" ref={top}>
        {header}
        <div class={`tg-card tg-result ${result.level === 'ok' ? 'ok' : result.level === 'partial' ? 'part' : 'bad'}`}>
          <p class="tg-verdict">
            {result.level === 'ok' ? '✓ Pravilna diagnoza' : result.level === 'partial' ? '½ Delno pravilno' : `✗ Narobe: ${result.guess.map((g) => faultText.get(g)?.name).join(' + ')}`}
          </p>
          <h2>{job.faults.map((f) => faultText.get(f)?.name).join(' + ')}</h2>
          {job.faults.length > 1 && <p class="tg-muted">Naprava je imela dve okvari hkrati.</p>}
          <p class="tg-big">{result.pay > 0 ? '+' : ''}{result.pay} €</p>
          <ul class="tg-notes">{result.notes.map((n) => <li>{n}</li>)}</ul>

          {abnormal.length > 0 && (
            <section class="tg-explain">
              <h3>Kaj so povedale tvoje meritve</h3>
              <ul class="tg-meas">
                {abnormal.map((l) => (
                  <li>
                    <strong>{l.label}:</strong> {l.r.text} <span class="tg-zone">{ZONE_TXT[l.r.zone]}</span>
                    {meaning(l.id, l.r) && <span class="tg-means">→ {meaning(l.id, l.r)}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {job.faults.map((f) => {
            const t = faultText.get(f)!;
            const u = L.faults[f];
            const proofDone = u.proof.filter((p) => done.has(p));
            return (
              <section class="tg-explain">
                <h3>{job.faults.length > 1 ? `${t.name}: ` : ''}Pot do pravilne diagnoze</h3>
                <ol class="tg-steps">{u.steps.map((s) => <li>{s}</li>)}</ol>
                <h3>Zakaj</h3>
                <p>{t.why}</p>
                <p class="tg-key">
                  <strong>3 ključni indikatorji:</strong> {t.indicators.join(' · ')}
                </p>
                <h3>Potrditev</h3>
                <ul class="tg-proof">
                  {u.proof.map((p) => (
                    <li class={done.has(p) ? 'ok' : 'miss'}>
                      {done.has(p) ? '✓' : '○'} {toolLabel(p)} {done.has(p) ? '' : '– tega nisi izmeril'}
                    </li>
                  ))}
                </ul>
                {proofDone.length === 0 && <p class="tg-muted">Brez potrditvene meritve je diagnoza ugibanje – tudi če je pravilna.</p>}
                <div class="tg-confuse">
                  <strong>Ne zamenjaj z: {faultText.get(u.confuse.with)?.name}</strong>
                  <p>{u.confuse.how}</p>
                </div>
                <h3>Popravilo</h3>
                <p>{t.fix}</p>
              </section>
            );
          })}

          {wrongGuesses.map((g) => {
            const gt = faultText.get(g)!;
            const gu = L.faults[g];
            return (
              <section class="tg-explain tg-why-not">
                <h3>Zakaj ne {gt.name.toLowerCase()}?</h3>
                <p>Pri tej okvari bi videl: {gt.indicators.join(' · ')}.</p>
                <p>Potrdila bi jo meritev: {gu.proof.map(toolLabel).join(', ')}.</p>
                {job.faults.includes(gu.confuse.with) && <p class="tg-key">{gu.confuse.how}</p>}
              </section>
            );
          })}
          {missed.length > 0 && result.level === 'partial' && <p class="tg-key">Spregledal si: {missed.map((m) => faultText.get(m)?.name).join(', ')}. Ko najdeš eno okvaro, preveri, ali razloži vsa odstopanja.</p>}

          {(() => {
            // lekcije in deli za vse dejanske okvare; pri dveh okvarah še 17.1, pri napaki 16.1 (hipoteza)
            const ls = [...new Set([...job.faults.flatMap((f) => L.faults[f].lessons), ...(job.faults.length > 1 ? ['m17-l01'] : []), ...(result.level !== 'ok' ? ['m16-l01'] : [])])].filter((l) => links.lessons[l]);
            const ps = [...new Set(job.faults.flatMap((f) => L.faults[f].parts))].filter((p) => links.parts[p]);
            return (
              <section class="tg-explain tg-more">
                <h3>Nauči se več</h3>
                {ls.length > 0 && (
                  <>
                    <p class="tg-more-label">📘 Lekcije</p>
                    <ul class="tg-more-list">
                      {ls.map((l) => (
                        <li>
                          <a href={`${links.lessonBase}${l}/`} target="_blank" rel="noopener">{links.lessons[l]} ↗</a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {ps.length > 0 && (
                  <>
                    <p class="tg-more-label">🔧 Okvare in popravila delov</p>
                    <ul class="tg-more-list">
                      {ps.map((p) => (
                        <li>
                          <a href={`${links.okvare}#${p}`} target="_blank" rel="noopener">{links.parts[p]} ↗</a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <p class="tg-muted">Povezave se odprejo v novem zavihku – delovni dan ostane, kjer je.</p>
              </section>
            );
          })()}

          <p class="tg-stats">
            Meritev: {result.meas} · na lokaciji {onSite} min
          </p>
          <div class="tg-actions">
            {practicing ? (
              <>
                <button type="button" class="btn" onClick={startPractice}>
                  ↻ Še enkrat ista okvara
                </button>
                <button type="button" class="btn secondary" onClick={afterResult}>
                  Na začetek igre
                </button>
              </>
            ) : (
              <button type="button" class="btn" onClick={afterResult}>
                {rep <= 0 ? 'Konec igre' : DAY_MIN - minutes < 55 ? 'Konec dneva →' : 'Naslednji nalog →'}
              </button>
            )}
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
            <button type="button" class="btn wide" onClick={() => { setPicked([]); setDiagOpen(true); }}>
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
              <input type="checkbox" checked={learn} onChange={() => setLearn(!learn)} /> Učni način (normalna območja in pomen meritev)
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
                  {learn && meaning(l.id, l.r) && <p class="tg-means">💡 {meaning(l.id, l.r)}</p>}
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
              <p class="tg-muted">SH + SC: visoko + nizko = premalo hladiva · visoko + visoko = zožitev · nizko + visoko = preveč hladiva · SH ≈ 0 = odprt EEV.</p>
              <a href={lessonSh}>Kako brati SH in SC →</a>
            </details>
          )}
        </div>
      </div>

      {diagOpen && (
        <div class="tg-modal" role="dialog" aria-modal="true" aria-label="Diagnoza" onClick={(e) => e.target === e.currentTarget && setDiagOpen(false)}>
          <div class="tg-modal-in">
            <h3>Kaj je vzrok?</h3>
            <p class="tg-muted">
              {log.length} meritev, {onSite} min na lokaciji. {log.length <= 1 ? 'Pozor: z ≤ 1 meritvijo je plačilo ×0,7. ' : ''}
              {multi ? 'Na tej stopnji ima lahko naprava dve okvari – označi eno ali dve in potrdi.' : ''}
            </p>
            <div class="tg-options">
              {faults.map((f) => {
                const out = support?.includes(f.id);
                const on = picked.includes(f.id);
                return (
                  <button type="button" disabled={out} aria-pressed={multi ? on : undefined} class={`${out ? 'out' : ''} ${on ? 'on' : ''}`} onClick={() => togglePick(f.id)}>
                    {multi && <span class="tg-check">{on ? '☑' : '☐'}</span>} {f.name}
                  </button>
                );
              })}
            </div>
            {multi && (
              <button type="button" class="btn wide" disabled={!picked.length} onClick={() => diagnose(picked)}>
                Potrdi diagnozo ({picked.length})
              </button>
            )}
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
function Part({ id, x, y, w, h, label, comp, onComp, children }: { id: Comp; x: number; y: number; w: number; h: number; label: string; comp: Comp | null; onComp: (c: Comp) => void; children?: any }) {
  return (
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
}
function Schema({ env, done, comp, onComp }: { env: Env; done: Set<string>; comp: Comp | null; onComp: (c: Comp) => void }) {
  const seen = (...ids: string[]) => ids.some((i) => done.has(i));
  const fanStopped = !env.fanOn && seen('zunanja', 'ventilator');
  const ice = seen('zunanja') ? env.ice : 'ni';
  const radColor = !seen('radiatorji') ? '#e9e4da' : env.tRadIn > 34 ? '#f08a3c' : env.tRadIn > 27 ? '#f2c46a' : '#9cc3e6';
  const gaugeNeedle = (cx: number, cy: number, v: number) => {
    const a = ((-225 + Math.max(0, Math.min(1, v)) * 270) * Math.PI) / 180;
    return <line x1={cx} y1={cy} x2={cx + 9 * Math.cos(a)} y2={cy + 9 * Math.sin(a)} stroke="#d9412b" stroke-width="2" />;
  };
  const code = env.code?.split(';')[0].split(' ')[0];
  return (
    <div class="tg-card tg-schema">
      <div class="tg-svgwrap">
        <svg viewBox="0 0 640 300" role="group" aria-label="Shema naprave – klikni del">
          <rect x="0" y="0" width="640" height="300" fill="#eef3f7" />
          <path d="M150,70 H330" stroke="#d9412b" stroke-width="5" fill="none" />
          <path d="M150,210 H330" stroke="#2f7fd1" stroke-width="5" fill="none" />
          <rect x="14" y="24" width="250" height="240" rx="10" fill="#fdfcf9" stroke="#b9c2c9" />
          <text x="22" y="18" class="tg-area-lbl">ZUNANJA ENOTA</text>
          <Part comp={comp} onComp={onComp} id="uparjalnik" x={24} y={34} w={56} h={150} label="Uparjalnik">
            <rect x="24" y="34" width="56" height="150" fill="#b9c2c9" />
            {Array.from({ length: 10 }, (_, i) => <line x1={28 + i * 5} y1="36" x2={28 + i * 5} y2="182" stroke="#8f979e" />)}
            {ice === 'polno' && <rect x="22" y="32" width="60" height="154" fill="rgba(240,250,255,.92)" stroke="#9fc9e8" />}
            {ice === 'delno' && <rect x="22" y="130" width="60" height="56" fill="rgba(240,250,255,.92)" stroke="#9fc9e8" />}
          </Part>
          <Part comp={comp} onComp={onComp} id="ventilator" x={88} y={60} w={70} h={70} label="Ventilator">
            <circle cx="123" cy="95" r="32" fill="#e9e4da" stroke="#5b6168" />
            <g class={fanStopped ? '' : 'tg-spin'} style="transform-origin:123px 95px">
              {[0, 120, 240].map((d) => <rect x="119" y="66" width="8" height="28" rx="4" fill="#3a3f44" transform={`rotate(${d} 123 95)`} />)}
            </g>
            {fanStopped && <text x="123" y="140" text-anchor="middle" class="tg-alert">STOJI</text>}
          </Part>
          <Part comp={comp} onComp={onComp} id="zunanji-senzor" x={168} y={30} w={30} h={22} label="Senzor T">
            <rect x="176" y="32" width="14" height="18" rx="2" fill="#fff" stroke="#5b6168" />
            {seen('ntc') && !Number.isFinite(env.ntcOhm) && <text x="183" y="46" text-anchor="middle" class="tg-alert">∞</text>}
          </Part>
          <Part comp={comp} onComp={onComp} id="kompresor" x={176} y={150} w={44} h={60} label="Kompresor">
            <rect x="180" y="156" width="36" height="50" rx="16" fill="#2f4f3f" />
            {seen('tok') && !env.compRunning && <text x="198" y="186" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">0 A</text>}
          </Part>
          <Part comp={comp} onComp={onComp} id="stiripotni" x={176} y={100} w={44} h={28} label="4-potni">
            <rect x="182" y="106" width="32" height="14" rx="6" fill="#c9a227" />
            {seen('tuljava4') && !Number.isFinite(env.coil4) && <text x="198" y="117" text-anchor="middle" class="tg-alert">∞</text>}
          </Part>
          <Part comp={comp} onComp={onComp} id="eev" x={226} y={150} w={34} h={34} label="EEV">
            <rect x="232" y="156" width="22" height="22" rx="4" fill="#c9a227" />
            <rect x="236" y="148" width="14" height="10" fill="#1d1f22" />
          </Part>
          <Part comp={comp} onComp={onComp} id="susilnik" x={226} y={196} w={34} h={20} label="Sušilnik">
            <rect x="230" y="200" width="26" height="12" rx="5" fill="#6d7b3a" />
            {seen('susilnik') && env.dtDrier > 3 && <rect x="244" y="198" width="12" height="16" rx="4" fill="rgba(255,255,255,.8)" />}
          </Part>
          <Part comp={comp} onComp={onComp} id="servisni" x={226} y={56} w={34} h={34} label="Servis">
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
          </Part>
          {ice === 'sesalni' && <path d="M150,210 H200" stroke="rgba(240,250,255,.95)" stroke-width="10" />}
          <rect x="290" y="24" width="190" height="240" rx="10" fill="#fdfcf9" stroke="#b9c2c9" />
          <text x="298" y="18" class="tg-area-lbl">NOTRANJA ENOTA</text>
          <Part comp={comp} onComp={onComp} id="pt" x={300} y={56} w={50} h={170} label="Prenosnik">
            {Array.from({ length: 8 }, (_, i) => <rect x={306 + i * 5} y="60" width="3" height="160" fill="#9aa3ad" />)}
          </Part>
          <Part comp={comp} onComp={onComp} id="krmilnik" x={362} y={34} w={70} h={42} label="Krmilnik">
            <rect x="364" y="36" width="66" height="38" rx="4" fill={done.has('zaslon') && env.code ? '#3a0e0a' : '#0d2a24'} />
            <text x="397" y="60" text-anchor="middle" font-size="10" font-weight="800" fill={done.has('zaslon') && env.code ? '#ff7b6b' : '#7dffcf'} font-family="monospace">
              {done.has('zaslon') ? (code ?? 'OK') : '— —'}
            </text>
          </Part>
          <Part comp={comp} onComp={onComp} id="manometer" x={440} y={34} w={34} h={34} label="Tlak">
            <circle cx="457" cy="51" r="14" fill="#fff" stroke="#3a3f44" stroke-width="3" />
            {gaugeNeedle(457, 51, done.has('tlak-vode') ? env.pWater / 4 : 0)}
          </Part>
          <Part comp={comp} onComp={onComp} id="dogrevalnik" x={362} y={92} w={56} h={22} label="Dogrevalnik">
            <rect x="366" y="96" width="48" height="12" rx="6" fill={done.has('poraba') && env.backupOn ? '#ff5a2a' : '#9aa3ad'} />
          </Part>
          <Part comp={comp} onComp={onComp} id="tripotni" x={428} y={92} w={40} h={30} label="3-potni">
            <rect x="436" y="96" width="24" height="20" fill="#c9a227" />
            {done.has('tripotni') && <path d={env.valve3 === 'bojler' ? 'M448,106 v12' : 'M448,106 h12'} stroke="#a4502a" stroke-width="3" />}
          </Part>
          <Part comp={comp} onComp={onComp} id="crpalka" x={362} y={138} w={44} h={44} label="Črpalka">
            <circle cx="384" cy="160" r="16" fill="#c0392b" />
            {done.has('poslusaj') && env.pumpSound === 'grgra' && <text x="384" y="164" text-anchor="middle" fill="#fff" font-size="12">≈</text>}
            {done.has('crpalka-pregled') && !env.pumpRunning && <text x="384" y="164" text-anchor="middle" fill="#fff" font-size="12" font-weight="800">✗</text>}
          </Part>
          <Part comp={comp} onComp={onComp} id="lovilec" x={414} y={150} w={40} h={24} label="Lovilec">
            <rect x="418" y="156" width="32" height="12" rx="5" fill="#c9a227" />
            {done.has('lovilec') && env.strainer === 'zamasen' && <circle cx="434" cy="162" r="7" fill="#5b3a1e" />}
          </Part>
          <Part comp={comp} onComp={onComp} id="raztezna" x={420} y={196} w={44} h={50} label="Raztezna">
            <rect x="430" y="200" width="24" height="40" rx="10" fill="#c0392b" />
          </Part>
          <path d="M500,90 L565,40 L630,90 V264 H500 Z" fill="#fdfcf9" stroke="#b9c2c9" />
          <text x="508" y="84" class="tg-area-lbl">HIŠA</text>
          <path d="M480,120 H510 M480,200 H510" stroke="#f0a24a" stroke-width="4" />
          <Part comp={comp} onComp={onComp} id="radiator" x={516} y={120} w={98} h={84} label={env.heating === 'radiatorji' ? 'Radiator' : 'Talno'}>
            {Array.from({ length: 8 }, (_, i) => <rect x={522 + i * 11} y="124" width="8" height="76" rx="3" fill={radColor} stroke="#b9c2c9" />)}
          </Part>
          <Part comp={comp} onComp={onComp} id="stranka" x={540} y={214} w={50} h={36} label="Stranka">
            <circle cx="565" cy="222" r="7" fill="#5b6168" />
            <rect x="556" y="230" width="18" height="16" rx="6" fill="#5b6168" />
          </Part>
        </svg>
      </div>
      <p class="tg-muted tg-schemanote">Klikni del naprave – pokažejo se orodja zanj. Shema pokaže, kar si izmeril. Na telefonu shemo povleci levo in desno.</p>
    </div>
  );
}
