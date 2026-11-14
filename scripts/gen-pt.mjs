// Ustvari P-T tabelo nasičenja za R32, R410A in R290 s CoolProp (WASM) in jo preveri z referenčnimi točkami.
// Uporaba (ni odvisnost projekta – CoolProp namesti v ločeno mapo):
//   npm install coolprop-wasm@6.6.0 --ignore-scripts   (v ločeni mapi)
//   node scripts/gen-pt.mjs <pot>/node_modules/coolprop-wasm/simple.js data/refrigerants.json
// Skripta tabele ne zapiše, če katera referenčna točka odstopa več kot 1 %.
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';

const [, , libPath, outPath] = process.argv;
const { PropsSI } = await import(pathToFileURL(libPath).href);

const FLUIDS = [
  { id: 'R32', name: 'R32', cp: 'R32', safety: 'A2L' },
  { id: 'R410A', name: 'R410A', cp: 'R410A', safety: 'A1' },
  { id: 'R290', name: 'R290 (propan)', cp: 'n-Propane', safety: 'A3' },
];

// Neodvisne referenčne točke (NIST REFPROP / ASHRAE, zaokroženo): T °C → p kPa abs (vrelišče).
const REF = {
  R32: [
    [-51.65, 101.3],
    [0, 813],
    [40, 2478],
  ],
  R410A: [
    [-51.4, 101.3],
    [0, 799],
    [40, 2421],
  ],
  R290: [
    [-42.1, 101.3],
    [0, 474],
    [40, 1369],
  ],
};

const out = { _opomba: '', refrigerants: [] };
let worst = 0;
for (const f of FLUIDS) {
  const points = [];
  for (let t = -40; t <= 70; t += 1) {
    const T = t + 273.15;
    const pb = (await PropsSI('P', 'T', T, 'Q', 0, f.cp)) / 1e5;
    const pd = (await PropsSI('P', 'T', T, 'Q', 1, f.cp)) / 1e5;
    if (!Number.isFinite(pb) || !Number.isFinite(pd)) throw new Error(`${f.id} ${t}: ni rezultata`);
    const p = { tC: t, pBarAbs: Math.round(pb * 1000) / 1000 };
    if (Math.abs(pb - pd) > 0.0005) p.pDewBarAbs = Math.round(pd * 1000) / 1000;
    points.push(p);
  }
  for (const [tc, kPa] of REF[f.id]) {
    const got = (await PropsSI('P', 'T', tc + 273.15, 'Q', 0, f.cp)) / 1000;
    const dev = Math.abs(got - kPa) / kPa;
    worst = Math.max(worst, dev);
    console.log(`${f.id} ${tc} °C: CoolProp ${got.toFixed(1)} kPa, referenca ${kPa} kPa, odstopanje ${(dev * 100).toFixed(2)} %`);
  }
  out.refrigerants.push({
    id: f.id,
    name: f.name,
    safety: f.safety,
    source: `CoolProp 6.6 (enačbe stanja kot v NIST REFPROP), tekočina "${f.cp}". Preverjeno z referenčnimi točkami NIST pri vrelišču, 0 °C in 40 °C – odstopanje pod 1 %.`,
    points,
  });
}
if (worst > 0.01) throw new Error(`Odstopanje od reference ${(worst * 100).toFixed(2)} % – tabela NI zapisana.`);
out._opomba =
  'Tabela tlak–temperatura nasičenja (absolutni tlak v bar). Ustvarjeno s skriptom iz CoolProp in preverjeno z referenčnimi točkami NIST. pBarAbs = vrelišče (tekočina), pDewBarAbs = rosišče (para), če se razlikujeta. Na terenu vedno velja tabela proizvajalca hladiva.';
fs.writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n');
console.log('zapisano', outPath, 'največje odstopanje', (worst * 100).toFixed(2), '%');
