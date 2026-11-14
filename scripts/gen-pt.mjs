// Ustvari P-T tabelo nasičenja s CoolProp (WASM) in jo preveri z referenčnimi točkami.
// Uporaba (ni odvisnost projekta – CoolProp namesti v ločeno mapo):
//   npm install coolprop-wasm@6.6.0 --ignore-scripts   (v ločeni mapi)
//   node scripts/gen-pt.mjs <pot>/node_modules/coolprop-wasm/simple.js data/refrigerants.json
// Skripta tabele ne zapiše, če katera referenčna točka odstopa več od dovoljenega.
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';

const [, , libPath, outPath] = process.argv;
const { PropsSI } = await import(pathToFileURL(libPath).href);

// Neodvisne referenčne točke (NIST / ASHRAE, zaokroženo).
//   p: [T °C, p kPa abs] – tlak vrelišča pri temperaturi, dovoljeno odstopanje 1 %
//   t: [faza, T °C] – temperatura pri 101,325 kPa (vrelišče Q=0 ali rosišče Q=1), dovoljeno odstopanje 0,5 K
const FLUIDS = [
  { id: 'R32', name: 'R32', cp: 'R32', safety: 'A2L', from: -40, to: 70, p: [[-51.65, 101.3], [0, 813], [40, 2478]] },
  { id: 'R410A', name: 'R410A', cp: 'R410A', safety: 'A1', from: -40, to: 70, p: [[-51.4, 101.3], [0, 799], [40, 2421]] },
  { id: 'R290', name: 'R290 (propan)', cp: 'n-Propane', safety: 'A3', from: -40, to: 70, p: [[-42.1, 101.3], [0, 474], [40, 1369]] },
  { id: 'R407C', name: 'R407C', cp: 'R407C', safety: 'A1', from: -40, to: 70, t: [[0, -43.8], [1, -36.7]] },
  // CO₂: trojna točka −56,6 °C, kritična 31,0 °C – tabela do 30 °C, nad tem ni kondenzacije
  { id: 'R744', name: 'R744 (CO₂)', cp: 'CarbonDioxide', safety: 'A1', from: -40, to: 30, p: [[-20, 1970], [0, 3485], [20, 5729]] },
  // Novejši mešanici – CoolProp nima vnaprej pripravljenih, zato mešanica iz sestavin (molski deleži iz masnih).
  // R454B = R32/R1234yf 68,9/31,1 masno. Reference: Chemours vrelišče −50,9 °C pri 1 atm; Honeywell pri 40 psig (377,1 kPa abs) vrelišče −20,3 °C, rosišče −19,2 °C.
  {
    id: 'R454B',
    name: 'R454B',
    cp: mix({ R32: [68.9, 52.024], R1234yf: [31.1, 114.04] }),
    safety: 'A2L',
    from: -40,
    to: 55,
    t: [[0, -50.9], [0, -20.3, 377.1], [1, -19.2, 377.1]],
  },
  // R452B = R32/R125/R1234yf 67/7/26 masno. Referenca ASHRAE 34: vrelišče −51,0 °C, rosišče −50,3 °C pri 1 atm.
  {
    id: 'R452B',
    name: 'R452B',
    cp: mix({ R32: [67, 52.024], R125: [7, 120.02], R1234yf: [26, 114.04] }),
    safety: 'A2L',
    from: -40,
    to: 53, // pri 54 °C postopek za mešanico ne konvergira
    t: [[0, -51.0], [1, -50.3]],
  },
];

/** Masni deleži [masa %, molska masa g/mol] → niz za CoolProp HEOS z molskimi deleži. */
function mix(parts) {
  const moles = Object.entries(parts).map(([n, [w, M]]) => [n, w / M]);
  const sum = moles.reduce((s, [, m]) => s + m, 0);
  return 'HEOS::' + moles.map(([n, m]) => `${n}[${(m / sum).toFixed(5)}]`).join('&');
}

const out = { _opomba: '', refrigerants: [] };
let fail = [];
for (const f of FLUIDS) {
  const points = [];
  for (let t = f.from; t <= f.to; t += 1) {
    // Pri mešanicah numerični postopek v redkih točkah ne konvergira – poskusi še ±0,01 K (napaka tlaka zanemarljiva).
    const sat = async (q) => {
      for (const dT of [0, 0.01, -0.01]) {
        const v = (await PropsSI('P', 'T', t + 273.15 + dT, 'Q', q, f.cp)) / 1e5;
        if (Number.isFinite(v)) return v;
      }
      return NaN;
    };
    const pb = await sat(0);
    const pd = await sat(1);
    if (!Number.isFinite(pb) || !Number.isFinite(pd)) throw new Error(`${f.id} ${t}: ni rezultata`);
    const p = { tC: t, pBarAbs: Math.round(pb * 1000) / 1000 };
    if (Math.abs(pb - pd) > 0.0005) p.pDewBarAbs = Math.round(pd * 1000) / 1000;
    points.push(p);
  }
  for (const [tc, kPa] of f.p ?? []) {
    const got = (await PropsSI('P', 'T', tc + 273.15, 'Q', 0, f.cp)) / 1000;
    const dev = Math.abs(got - kPa) / kPa;
    console.log(`${f.id} ${tc} °C: CoolProp ${got.toFixed(1)} kPa, referenca ${kPa} kPa, odstopanje ${(dev * 100).toFixed(2)} %`);
    if (dev > 0.01) fail.push(`${f.id} ${tc} °C`);
  }
  for (const [q, tRef, kPa = 101.325] of f.t ?? []) {
    const got = (await PropsSI('T', 'P', kPa * 1000, 'Q', q, f.cp)) - 273.15;
    const dev = Math.abs(got - tRef);
    console.log(`${f.id} ${q ? 'rosišče' : 'vrelišče'} pri ${kPa} kPa: CoolProp ${got.toFixed(2)} °C, referenca ${tRef} °C, odstopanje ${dev.toFixed(2)} K`);
    if (dev > 0.5) fail.push(`${f.id} Q=${q}`);
  }
  const r = {
    id: f.id,
    name: f.name,
    safety: f.safety,
    source: `CoolProp 6.6 (enačbe stanja kot v NIST REFPROP), tekočina "${f.cp}". Preverjeno z referenčnimi točkami NIST/ASHRAE.`,
    points,
  };
  if (f.id === 'R744') {
    r.tCritC = Math.round(((await PropsSI('Tcrit', '', 0, '', 0, f.cp)) - 273.15) * 100) / 100;
    r.pCritBarAbs = Math.round(((await PropsSI('pcrit', '', 0, '', 0, f.cp)) / 1e5) * 100) / 100;
    console.log(`R744 kritična točka: ${r.tCritC} °C, ${r.pCritBarAbs} bar abs`);
  }
  out.refrigerants.push(r);
}
if (fail.length) throw new Error(`Odstopanje od reference preveliko: ${fail.join(', ')} – tabela NI zapisana.`);
out._opomba =
  'Tabela tlak–temperatura nasičenja (absolutni tlak v bar). Ustvarjeno s scripts/gen-pt.mjs iz CoolProp in preverjeno z referenčnimi točkami. pBarAbs = vrelišče (tekočina), pDewBarAbs = rosišče (para), če se razlikujeta. Na terenu vedno velja tabela proizvajalca hladiva.';
fs.writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n');
console.log('zapisano', outPath);
