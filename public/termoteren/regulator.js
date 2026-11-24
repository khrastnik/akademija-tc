/* Values on the built-in controller. External clamp-on probes are deliberately separate. */
window.Regulator=(()=>{
 const tabs={overview:'Stanje',sensors:'Podatki',alarms:'Napake'};
 const flowAlarm={code:'V01',message:'Pretok vode ni potrjen',effect:'Zaščita zadržuje zagon kompresorja.'};
 const cases=[
  {status:'Prekinitev ogrevanja',history:'Kratek ogrevalni cikel se je prekinil.',alarm:flowAlarm},
  {status:'Ogrevanje',history:'V zadnjem ciklu je bilo zabeleženo odtajevanje.'},
  {status:'Mirovanje',history:'Regulator je dosegel zunanjo mejo za izklop ogrevanja.'},
  {status:'Zagon zadržan',history:'Po zahtevi za obtočni preizkus zagon ni bil dovoljen.',alarm:{code:'P02',message:'Pogon črpalke brez vrtljajev',effect:'Kompresor čaka na potrjen pretok.'}},
  {status:'Zahteva za ogrevanje',history:'Regulator je poslal zahtevo za preklop na ogrevanje prostorov.'},
  {status:'Zagon zadržan',history:'Po vklopu obtočne črpalke regulator ni prejel potrditve pretoka.',alarm:flowAlarm}
 ];
 cases[10]={status:'Ogrevanje',history:'Ob zagonu po menjavi radiatorja je bila zabeležena napaka pretoka, nato je kroženje steklo.'};
 cases[11]={status:'Ogrevanje',history:'Ogrevanje deluje. Regulator napak ne beleži.'};
 cases[12]={status:'Ogrevanje',history:'V 24 urah 6 zahtev za odtajevanje, nobeno ni bilo končano.',alarm:{code:'D03',message:'Odtajevanje ni končano',effect:'Naprava ponavlja zahtevo, ker se led ne stali.'}};
 function snapshot(f,c){
  const entry=cases[f.caseIndex]||{status:'Ogrevanje',history:'Zahteva za ogrevanje prostorov je aktivna.'};
  const repaired=!!f.fixed,off=!!f.isolated;
  const samples=c.tests.flatMap((test,index)=>{
   if(test.tool!=='meter')return [];
   const d=Measurements.spec(f.caseIndex,test,repaired);
   return [{index,title:test.label,rows:d.rows.map(r=>({name:r.name,value:MeasurementsText(r.value)+' '+r.unit})),note:d.note}];
  });
  const outdoor=f.caseIndex===2?(repaired?'6,3 °C':'21 °C'):c.weather.split(' · ')[0];
  const alarm=entry.alarm||null,status=off?'Brez napajanja':repaired?'Ogrevanje':entry.status;
  const history=[entry.history];
  if(alarm)history.push(alarm.code+' · '+alarm.message);
  if(repaired)history.push(alarm?'Po kontrolnem zagonu je zaščita sproščena.':'Po posegu je bil opravljen ponovni zagon oziroma kontrolni preizkus.');
  return {off,status,samples,outdoor,alarm:!repaired&&!off?alarm:null,history,active:!off&&!repaired&&!!alarm};
 }
 function MeasurementsText(value){return String(value).replace('.',',')}
 function draw(ctx,w,h,data,page){
  ctx.fillStyle=data.off?'#101a1b':'#102e34';ctx.fillRect(0,0,w,h);if(data.off)return;
  ctx.fillStyle='#a4d8cc';ctx.font='600 25px sans-serif';ctx.fillText('TOPLOLOG  /  '+tabs[page].toUpperCase(),22,38);
  ctx.fillStyle=data.active?'#ffc491':'#def5df';ctx.font='bold 43px sans-serif';
  let main=data.status,sub='ZUNAJ   '+data.outdoor;
  if(page==='sensors'&&data.samples.some(s=>s.rows.length)){const s=data.samples.find(s=>s.rows.length);main=s.rows[0].name+'  '+s.rows[0].value;sub=s.rows[1]?s.rows[1].name+'   '+s.rows[1].value:s.title}
  if(page==='alarms'){main=data.alarm?data.alarm.code:'0 aktivnih';sub=data.alarm?data.alarm.message:'DNEVNIK DOGODKOV'}
  ctx.fillText(main,22,105,w-42);ctx.font='24px sans-serif';ctx.fillStyle='#9cc9c5';ctx.fillText(sub,22,157,w-44);
 }
 return {tabs,snapshot,draw};
})();
