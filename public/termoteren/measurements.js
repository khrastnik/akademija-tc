/* Values belong to the simulated operating point of the current work order. */
window.Measurements=(()=>{
 const ports={up:'Oddajnik A · ravni odsek',down:'Sprejemnik B · ravni odsek',boiler:'Veja bojlerja',radiator:'Veja radiatorjev',supply:'Dvižni vod',return:'Povratni vod',air:'Referenčna sonda v senci'};
 const flow=[[[6],[19]],[[18],[18]],null,[[0],[18]],[[18],[18]],[[18,0],[18,0]]];
 function spec(n,t,after){
  const stage=after?1:0;
  if(t.display){
   const {title,points,rows}=t.display;
   return {title,points,note:after?'Kontrolni preizkus':'Ogrevanje prostorov',rows:rows.map(r=>({name:r[0],unit:r[1],value:r[2+stage]}))};
  }
  function specRows(title,points,names,units,values,note=''){
   return {title,points,note,rows:names.map((name,i)=>({name,unit:units[i],value:values[i]}))};
  }
  if(t.part==='emitter'&&t.tool==='thermo'){
   const r=CASES[n].station;
   return specRows('RADIATOR',['top','bottom'],['T1 · zgoraj','T2 · spodaj'],['°C','°C'],after?[r.afterTop,r.afterBottom]:[r.upper,r.lower],after?'15 min po zagonu':'Med ogrevanjem');
  }
  if(t.tool==='flow'){
   const vs=flow[n][stage];
   return specRows('ULTRAZVOK',['up','down'],vs.length===2?['Tek','Po ustavitvi']:['Pretok'],vs.map(()=>'l/min'),vs,'Obtočni preizkus');
  }
  if(t.tool==='thermo'){
   if(t.part==='hydro')return specRows('KONTAKTNI SONDI',['supply','return'],['T1 · dvižni','T2 · povratni'],['°C','°C'],after?[38,33]:[43,29]);
   if(t.part==='valve')return specRows('VEJI OGREVANJA',['boiler','radiator'],['T1 · bojler','T2 · radiatorji'],['°C','°C'],after?[28,39]:[44,22],'Zahteva: radiatorji');
   return specRows('SONDA ZA ZRAK',['air'],['T · senca'],['°C'],[6.1],after?'Po premestitvi':'Referenca v senci');
  }
  if(t.tool!=='meter')return null;
  if(n===0)return specRows('POMNILNIK CIKLA',[],['Dvižni','Povratni'],['°C','°C'],after?[38,33]:[43,29],after?'Cikel končan':'Alarm pretoka');
  if(n===1&&t.part==='fan')return specRows('VENTILATOR',[],['Zahteva','Odziv'],['rpm','rpm'],after?[490,488]:[680,675]);
  if(n===1)return specRows('UPARJANJE',[],['T uparjanja'],['°C'],[after?-3:-12]);
  if(n===2)return specRows('ZUNANJE TIPALO',[],['T zunaj'],['°C'],[after?6.3:21],after?'Ogrevanje aktivno':'Ogrevanje miruje');
  if(n===3)return specRows('POGON ČRPALKE',[],['Odziv'],['rpm'],[after?2100:0],after?'Pogon v teku':'Rotor blokiran');
  if(n===5&&t.part==='sensor')return specRows('TIPALO PRETOKA',[],['Tek','Mirovanje'],['l/min','l/min'],after?[18,0]:[0,0]);
  return specRows('DNEVNIK KRMILJA',[],[],[],[],n===4?(after?'Preklop A / B: OK':'Zahteva: radiatorji'):(after?'Pretok OK. Zagon.':'Zagon blokiran'));
 }
 const measuredPhase=j=>j.phase==='measure'||j.phase==='verify';
 const data=(f,j,c)=>f.measurement?spec(f.caseIndex,c.tests[f.measurement.index],j.phase==='verify'):null;
 const elapsed=m=>m.readyAt?Math.max(0,Date.now()-m.readyAt):0;
 const stable=m=>!!m?.readyAt&&elapsed(m)>=2300;
 const num=v=>String(v).replace('.',',');
 function next(f,j,c){
  const m=f.measurement;if(!m||!measuredPhase(j))return null;
  if(m.logged)return m.ports.length?'probe:'+m.ports[m.ports.length-1]:null;
  const d=data(f,j,c),missing=d.points.find(p=>!m.ports.includes(p));
  return missing?'probe:'+missing:'instrument';
 }
 function forTest(f,j,t){
  const d=spec(f.caseIndex,t,j.phase==='verify');return d?.points.length?'probe:'+d.points[0]:null
 }
 function action(f,j,c,id){
  if(!measuredPhase(j))return null;
  const m=f.measurement,port=id.startsWith('probe:')?id.slice(6):null;
  const no=verb=>({enabled:false,seconds:0,verb});
  const ok=(verb,seconds,change)=>({enabled:true,seconds,verb,change});
  if(m){
   const d=data(f,j,c);
   if(m.logged&&m.ports.includes(port))return ok('Snemi tipalo in zvij kabel',.5,()=>{m.ports=m.ports.filter(p=>p!==port);if(!m.ports.length)f.measurement=null});
   if(port&&d.points.includes(port)&&!m.ports.includes(port)&&!m.logged)return ok('Pritrdi '+ports[port],.8,()=>{m.ports.push(port);if(m.ports.length===d.points.length)m.readyAt=Date.now()});
   if(id==='instrument')return no(m.logged?'Odčitek shranjen. Snemi tipala.':'Dvigni instrument in prepiši odčitek.');
   return no(m.logged?'Snemi nameščeni tipali.':port&&!d.points.includes(port)?'To merilno mesto ne ustreza izbranemu preizkusu.':next(f,j,c)==='instrument'?'Dvigni instrument in zapiši odčitek.':'Namesti naslednje tipalo.');
  }
  if(!port&&!['meter','thermo','flow'].includes(f.held))return null;
  const part=id.startsWith('test:')?id.slice(5):id;
  const index=c.tests.findIndex(t=>{if(t.tool!==f.held)return false;const d=spec(f.caseIndex,t,j.phase==='verify');return d&&(port?d.points.includes(port):part===t.part)});
  if(index<0)return port?no('Za to mesto potrebuješ ustrezen instrument in sondo.'):null;
  if(f.opened||f.screws.length||f.isolated||f.drained)return no('Obnovi pogoje za kontrolni preizkus.');
  const d=spec(f.caseIndex,c.tests[index],j.phase==='verify');
  if(d.points.length&&!port)return no('Namesti tipala na označena merilna mesta.');
  return ok(port?'Namesti tipalo · '+ports[port]:'Poveži servisni terminal',.8,()=>{
   f.measurement={index,ports:port?[port]:[],phase:j.phase,readyAt:d.points.length<=1?Date.now():0,logged:false};j.last=null;
  });
 }
 function screen(f,j,c){
  const m=f.measurement;if(!m)return {heading:f.held==='flow'?'ULTRAZVOK':f.held==='thermo'?'TERMOMETER':'SERVISNI TERMINAL',status:'PRIPRAVLJEN',rows:[],note:f.held==='meter'?'Poveži z napravo':'Namesti tipala'};
  const d=data(f,j,c),t=Math.min(1,elapsed(m)/2300);
  const rows=d.rows.map(r=>({name:r.name,unit:r.unit,value:!m.readyAt?'—':num(t===1?r.value:Math.round((r.value+(1-t)*Math.max(1,Math.abs(r.value)*.14))*10)/10)}));
  return {heading:d.title,status:m.logged?'ZAPISANO':!m.readyAt?'NI STIKA':t<1?'USTALJANJE':'STABILNO',rows,note:d.note};
 }
 function record(f,j,c,values){
  const m=f.measurement;if(!m||m.logged||!stable(m))return false;
  const d=data(f,j,c);if(values.length!==d.rows.length||!values.every((v,i)=>v.trim()!==''&&Math.abs(Number(v.trim().replace(',','.'))-d.rows[i].value)<.001))return false;
  const log=j.phase==='verify'?j.verified:j.read;if(!log.includes(m.index))log.push(m.index);
  j.last=m.index;j.measureLog??={};j.measureLog[j.phase+':'+m.index]=d.rows.map(r=>r.name+' '+num(r.value)+' '+r.unit).join(' · ')||d.note;
  m.logged=true;if(!m.ports.length)f.measurement=null;return true;
 }
 Object.assign(ports,{top:'Radiator · zgornje merilno mesto',bottom:'Radiator · spodnje merilno mesto'});
 Object.assign(ports,{secUp:'Radiatorska veja · oddajnik A',secDown:'Radiatorska veja · sprejemnik B',bufferIn:'Dvižni vod iz TČ v zalogovnik',bufferOut:'Dvižni vod iz zalogovnika proti radiatorjem'});
 return {spec,ports,data,next,forTest,action,screen,record,stable};
})();
