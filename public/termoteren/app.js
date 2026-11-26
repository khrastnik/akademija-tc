'use strict';
const $ = id => document.getElementById(id);
const shape = {
 scan:'<path d="M8 3H4v4m12-4h4v4M4 17v4h4m12-4v4h-4M4 12h16"/>',
 layers:'<path d="m3 8 9-5 9 5-9 5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
 book:'<path d="M4 4h13a2 2 0 0 1 2 2v15H6a2 2 0 0 1-2-2zM4 17h15M8 8h7m-7 3h5"/>',
 rank:'<path d="m5 12 7-6 7 6m-14 5 7-6 7 6"/>',cloud:'<path d="M6 18a4 4 0 0 1-.7-7.9 6.3 6.3 0 0 1 12.1-.9A4.4 4.4 0 0 1 18.4 18z"/>',
 focus:'<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="1.5"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>',
 pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0z"/><circle cx="12" cy="10" r="2.5"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.2.8-1.5 1.1-1.5 2.7m0 2.8v.1"/>',
 expand:'<path d="M3 9V3h6m6 0h6v6m0 6v6h-6m-6 0H3v-6"/>',
 zoom:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6m-3-3v6"/>',reset:'<path d="M4 10a8 8 0 1 1 0 5m0-10v5h5"/>',
 case:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v3h4v-3"/>',
 external:'<path d="M13 4h7v7m0-7-9 9M9 5H5v14h14v-5"/>',save:'<path d="M4 4h13l3 3v13H4zM8 4v5h8V4M8 20v-7h8v7"/>',
 x:'<path d="m6 6 12 12M18 6 6 18"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 check:'<path d="m4 12 5 5L20 6"/>',play:'<path d="m8 4 12 8-12 8z" fill="currentColor" stroke="none"/>',
 clipboard:'<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6m-6 4h4"/>',
 inspect:'<circle cx="10" cy="9" r="6.5"/><circle cx="10" cy="9" r="4.6" stroke-width=".7"/><path d="m14 14 2 2m-1 1 1.8-1.8 5.1 5.1-1.8 1.8z"/>',
 meter:'<g transform="rotate(15 12 12)"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M8.5 5h7v6h-7zM9 18h1m4 0h1"/><circle cx="12" cy="14.5" r="1.6"/></g>',
 thermo:'<path d="M13 2a2.8 2.8 0 0 1 2.8 2.8v9.7a4.5 4.5 0 1 1-5.6 0V4.8A2.8 2.8 0 0 1 13 2zM13 7v10m5-11h2m-2 4h2"/><circle cx="13" cy="18" r="1.6"/>',
 flow:'<path d="M3 17V9l4-3 4 3v8l-4 3zM5 10l2-1.5L9 10v3H5zM11 16c7 9 8-5 8-6"/><path d="M16 3h5v7h-5zM16 6h5M5 16h2"/>'
};
function icon(n){return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(['inspect','thermo','flow','meter'].includes(n)?1.25:1.7)+'" stroke-linecap="round" stroke-linejoin="round">'+shape[n]+'</svg>'}
document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon)});
const toolInfo={inspect:['Vizualni pregled','Pregled komponent'],meter:['Servisni terminal','Podatki regulatorja'],thermo:['Termometer','Meritev temperature'],flow:['Merilnik pretoka','Obtočni preizkus']};
const parts={control:'Regulator',filter:'Vodni filter',pump:'Obtočna črpalka',coil:'Uparjalnik',fan:'Ventilator',sensor:'Tipalo',valve:'Ventili',power:'Napajalni sklop',hydro:'Dvižni in povratni vod'};
Object.assign(parts,{emitter:'Radiator',radHead:'Termostatska glava',radGauge:'Manometer'});
parts.secondaryPump='Sekundarna obtočna črpalka';parts.radVessel='Raztezna posoda';
const key='termoteren.v1';
const fresh=()=>({phase:'measure',read:[],verified:[],step:0,mistakes:0,started:false,part:'control',tool:'inspect',last:null,opened:false});
let db={active:0,jobs:{},scores:{}};
try{const old=JSON.parse(localStorage.getItem(key));if(old&&Number.isInteger(old.active)&&CASES[old.active]&&old.jobs&&old.scores)db=old}catch{}
let inModel=false, modelFallback=false, toastTimer, feedback='',meterRaised=false;
const current=()=>CASES[db.active];
function job(){return db.jobs[db.active]||(db.jobs[db.active]=fresh())}
function save(){try{localStorage.setItem(key,JSON.stringify(db))}catch{$('saveMsg').textContent='Napredek velja za to sejo'}}
const seq=n=>String(n+1).padStart(2,'0');
const required=()=>current().tests.map((t,i)=>t.required?i:-1).filter(i=>i>=0);
const evidence=arr=>required().filter(i=>arr.includes(i)).length;
const done=i=>Number.isFinite(db.scores[i]);
const starsOf=s=>Number.isFinite(s)?(s>=100?3:s>=70?2:1):0;
const starRow=(n,big)=>'<span class="stars'+(big?' big':'')+'" role="img" aria-label="'+n+' od 3 zvezdic">'+[0,1,2].map(k=>'<b class="'+(k<n?'on':'')+'">★</b>').join('')+'</span>';
function resultCard(j){
 const n=starsOf(j.score),msg=n===3?'Brez napačne odločitve. Tako dela diagnostik.':n===2?'Nalog je rešen, nekaj odločitev pa si moral ponoviti.':'Nalog je rešen. Ponovi ga in poskusi brez napačnih odločitev.';
 return '<section class="resultCard"><small>Nalog zaključen</small>'+starRow(n,true)+'<strong>'+j.score+' XP</strong><p>'+msg+'</p><span>Napačne odločitve · '+j.mistakes+'</span></section>';
}
const available=i=>!!CASES[i]&&(!i||CASES[i].station||CASES[i].independent||done(i-1));
const linkedCase=Number(new URLSearchParams(location.search).get('nalog'))-1;
if(Number.isInteger(linkedCase)&&CASES[linkedCase])db.active=linkedCase;
// Kratek zvok in utrip ob opravljenem koraku. Tiho, če brskalnik zvoka ne dovoli.
let audioCtx=null,muted=false;try{muted=localStorage.getItem('termoteren.mute')==='1'}catch{}
function ping(ok=true){
 if(muted)return;
 try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();const t=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=ok?'triangle':'sine';o.frequency.setValueAtTime(ok?660:200,t);if(ok)o.frequency.setValueAtTime(990,t+.07);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+(ok?.2:.28));
  o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+.3)}catch{}
}
function pulse(id){const el=$(id);if(!el)return;el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse')}
function notice(msg){$('toast').textContent=msg;$('toast').className='show';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').className='',3400)}
function btn(label,action,cls='secondary',value=''){return '<button class="'+cls+'" data-action="'+action+'" data-value="'+value+'">'+label+'</button>'}
function refresh(){
 const c=current(),j=job();$('weather').textContent=c.weather;$('place').textContent=c.location;$('xp').textContent=Object.values(db.scores).reduce((a,b)=>a+b,0)+' XP';
 const cleared=Object.keys(db.scores).length;$('rank').textContent=cleared>=6?'Diagnostik':cleared>=3?'Serviser':cleared?'Pomočnik':'Vajenec';
 $('brief').innerHTML='<div class="briefTop"><i>'+icon('clipboard')+'</i>Delovni nalog<span>'+seq(db.active)+' / '+seq(CASES.length-1)+'</span></div><div class="briefBody"><h1>'+c.title+'</h1><p>»'+c.customer+'«</p><div class="objective"><i>'+icon('focus')+'</i><span>'+({measure:'Ugotovi vzrok težave z ogrevanjem.',diagnose:'Določi vzrok iz zbranih ugotovitev.',repair:'Izberi ustrezen servisni poseg.',procedure:'Izvedi servisni poseg.',verify:'Potrdi delovanje po posegu.',done:'Servisni nalog je zaključen.'}[j.phase])+'</span></div>'+btn(icon(j.phase==='done'?'check':'play')+(j.phase==='done'?'Odpri poročilo':j.started?'Nadaljuj diagnostiko':'Začni diagnostiko'),'start','primary')+'</div>';
 $('tools').innerHTML=Object.entries(toolInfo).map(([k,v],i)=>'<button class="tool '+(j.tool===k?'active':'')+'" aria-pressed="'+(j.tool===k)+'" data-tool="'+k+'"><i>'+icon(k)+'</i><span><strong>'+v[0]+'</strong><small>'+v[1]+'</small></span><kbd>'+String(i+1)+'</kbd></button>').join('');
 if(inModel){if(modelFallback)bench();else fieldHud()}
 if(!inModel){
  if(c.independent&&j.phase==='measure')$('brief').querySelector('.objective').remove();
  const el=$('brief').querySelector('.primary');if(j.phase!=='done')el.innerHTML=icon('play')+(j.started?'Nadaljuj na terenu':'Vstopi na teren');
  const total=CASES.reduce((s,_,i)=>s+starsOf(db.scores[i]),0),solved=Object.keys(db.scores).length,xp=Object.values(db.scores).reduce((a,b)=>a+b,0);
  const go=j.phase==='done'?'Odpri poročilo':j.started?'Nadaljuj nalog':solved?'Naslednji nalog':'Začni igro';
  $('titleMenu').innerHTML='<div class="tmMenu"><div class="tmLogo"><span class="brandmark" aria-hidden="true"><b></b><b></b><b></b></span><h1>Toplolog<span>Simulator</span></h1></div><p class="tmTag">Servis toplotnih črpalk v 3D. Meri, ugotovi vzrok, popravi in preveri.</p>'+
   '<dl class="tmStats"><div><dt>Zvezdice</dt><dd>★ '+total+' / '+CASES.length*3+'</dd></div><div><dt>Rešeni nalogi</dt><dd>'+solved+' / '+CASES.length+'</dd></div><div><dt>Naziv</dt><dd>'+$('rank').textContent+'</dd></div><div><dt>Točke</dt><dd>'+xp+' XP</dd></div></dl>'+
   '<nav class="tmButtons" aria-label="Meni">'+btn(icon(j.phase==='done'?'check':'play')+go,'start','primary tmGo')+(j.phase==='done'&&db.active<CASES.length-1?btn(icon('play')+'Naslednji nalog','next','tmBtn'):'')+btn(icon('layers')+'Izberi nalog','missions','tmBtn')+btn(icon('book')+'Servisni dnevnik','notes','tmBtn')+btn(icon('help')+'Kako igrati','howto','tmBtn')+(j.started||j.phase==='done'?btn('<span class="tmIcon">↺</span>Začni nalog znova','reset','tmBtn'):'')+'</nav></div>'+
   '<article class="tmMission"><small>'+(j.phase==='done'?'Rešen nalog':j.started?'Nalog v teku':'Naslednji nalog')+' · '+seq(db.active)+' / '+seq(CASES.length-1)+'</small><h2>'+c.title+'</h2><p class="tmWhere">'+icon('pin')+c.location+' · '+c.weather+'</p><blockquote>»'+c.customer+'«</blockquote>'+(done(db.active)?starRow(starsOf(db.scores[db.active])):'')+'</article>';
  $('tools').innerHTML='<div class="fieldIntro"><b>Prvoosebni servis</b><span><kbd>W A S D</kbd> Hoja</span><span><kbd>Miška</kbd> Razgled in delo na napravi</span><span><kbd>H</kbd> Smer do cilja</span></div>';
  document.querySelector('.beltHead h2').innerHTML=icon('case')+'Terenska oprema';document.querySelector('.beltHead>span').textContent='Orodje prevzameš na lokaciji';
 }
}
function physical(){
 const j=job();if(!j.field){j.field=FieldRules.fresh();j.field.fixed=['verify','done'].includes(j.phase)}
 j.field.phase=j.phase;j.field.caseIndex=db.active;return j.field
}
function readField(){return {f:physical(),j:job(),c:current()}}
function targetName(id){return id==='cleanFilter'?'Opran filtrski vložek':FieldRules.label(id)}
// Pregled notranjosti enote: vse → samo vodni del → samo hladilni krog.
let innerLayer='all';const LAYERS={all:'vse',water:'vodni del',refrigerant:'hladilni krog'};
function setLayer(m){innerLayer=m;PumpView.layer?.(m);const b=$('layerBtn');if(b)b.innerHTML='Notranjost: '+LAYERS[m]+' <kbd>V</kbd>'}
function cycleLayer(){setLayer(innerLayer==='all'?'water':innerLayer==='water'?'refrigerant':'all');notice(innerLayer==='all'?'Notranjost: vse.':innerLayer==='water'?'Poudarjen vodni del – hladilni krog je prosojen.':'Poudarjen hladilni krog – vodni del je prosojen.')}
function fieldHud(){
 const {f,j,c}=readField(),next=FieldRules.target(f,j,c);
 $('fieldNumber').textContent='Nalog '+seq(db.active)+' / '+seq(CASES.length-1)+' · '+c.location;
 $('fieldTitle').textContent=c.title;
 const PH=[['Pregled',['measure']],['Diagnoza',['diagnose','repair']],['Poseg',['procedure']],['Kontrola',['verify']],['Poročilo',['done']]],at=PH.findIndex(p=>p[1].includes(j.phase));
 if($('phaseBar'))$('phaseBar').innerHTML=PH.map((p,i)=>'<li class="'+(i<at?'past':i===at?'now':'')+'"'+(i===at?' aria-current="step"':'')+'>'+p[0]+'</li>').join('');
 $('fieldGoal').textContent=next==='tablet'?(j.phase==='done'?'Nalog je zaključen. Odpri poročilo.':'Odpri delovni nalog in presodi ugotovitve.'):(f.turn!==0&&f.spare&&!f.fixed?'Poravnaj nadomestni del z ležiščem.':(j.phase==='procedure'?FieldRules.jobs[db.active]+'. ':'')+'Naslednji cilj · '+targetName(next));
 $('equipmentStatus').textContent=f.isolated?'Napajanje izključeno':'Naprava pod napajanjem';
 $('tabletButton').classList.toggle('ready',next==='tablet');
 $('rotateBtn').hidden=!f.spare||f.fixed;
 if($('layerBtn')){$('layerBtn').hidden=!f.opened;if(!f.opened&&innerLayer!=='all')setLayer('all')}
 const carryNames={dirtyCartridge:'Umazan filtrski vložek',cartridge:'Opran vložek',probe:'Zunanje tipalo',drive:'Novi pogon',flowPart:'Novi merilnik'};
 const held=f.panel?'Servisni pokrov':carryNames[f.carry]||FieldRules.names[f.held]||'Prazne roke';$('heldLabel').textContent=held;
 $('meterBtn').hidden=!!(f.panel||f.carry)||!['flow','thermo','meter'].includes(f.held);
 if($('meterBtn').hidden)meterRaised=false;
 if(next==='instrument')$('fieldGoal').textContent='Dvigni instrument (I) in prepiši ustaljeni odčitek z njegovega zaslona.';
 else if(f.measurement?.logged)$('fieldGoal').textContent='Zapisano. Snemi tipala z merilnih mest.';
 const decision=Mentor.pending(j,c);
 if(decision)$('fieldGoal').textContent='Odpri nalog (J) · '+Mentor.get(db.active,decision).title;
 if(c.station&&j.phase==='procedure'){
  $('fieldGoal').textContent=c.station.steps[f.radStep||0];
  $('equipmentStatus').textContent=f.radStep?'Učni krog ohlajen':'Ogrevanje deluje';
 }
 const testing=['measure','verify'].includes(j.phase)&&!decision&&next!=='tablet';
 $('guidance').hidden=!testing;
 $('guidance').textContent=j.unaided?'Vključi vodenje':'Poskusi brez namiga';
 if(testing&&j.unaided&&!f.measurement)$('fieldGoal').textContent='Sam izberi naslednji preizkus. V dnevniku primerjaj ugotovitve.';
 if(c.independent){
  $('guidance').hidden=!['measure','verify'].includes(j.phase)||!!f.measurement;
  $('guidance').textContent='Izberi preiskavo';
  const hint=$('fieldUI').querySelector('[data-action=why]');
  hint.textContent='Namig';hint.title='Odpri namig (Z)';hint.hidden=!['measure','verify','procedure'].includes(j.phase);
  $('guideBtn').hidden=!next||next==='tablet';
  if(['measure','verify'].includes(j.phase)&&!next)$('fieldGoal').textContent=j.phase==='measure'?'»'+c.customer+'«':'Poseg je izveden. S kontrolno meritvijo preveri njegov učinek.';
  if(j.phase==='procedure')$('fieldGoal').textContent=c.adjustment?.instruction||'S terminalom odpri nastavitve na regulatorju.';
 }
 drawMeterForm();
 $('tools').innerHTML='<div class="fieldIntro"><b>'+held+'</b><span><kbd>W A S D</kbd> Hoja</span><span><kbd>Povlek</kbd> Pogled</span><span><kbd>Drži klik / E</kbd> Delo na predmetu</span></div>';
 document.querySelector('.beltHead h2').innerHTML=icon('case')+'V roki';document.querySelector('.beltHead>span').textContent=f.opened?'Servisni pokrov je odložen':'Pokrov na napravi';
}
function drawMeterForm(){
 if(!$('meterForm'))return;const {f,j,c}=readField(),m=f.measurement;
 $('stage').classList.toggle('readingMeter',meterRaised);$('meterForm').hidden=!meterRaised;
 $('meterBtn').innerHTML=(meterRaised?'Spusti instrument':'Dvigni instrument')+' <kbd>I</kbd>';
 if(!meterRaised)return;
 const d=m?Measurements.data(f,j,c):null,canRead=m?.readyAt&&!m.logged;
 $('meterInputs').innerHTML=canRead?d.rows.map((r,i)=>'<label>'+r.name+' ('+r.unit+')<input name="channel'+i+'" inputmode="decimal" autocomplete="off" required></label>').join(''):'';
 $('meterMessage').textContent=!m?'Izberi merilno mesto na napravi.':m.logged?'Odčitek je v dnevniku. Snemi nameščena tipala.':!m.readyAt?'Namesti še drugo tipalo.':'Počakaj na oznako STABILNO in prepiši vrednosti z instrumenta.';
 $('meterSave').hidden=!canRead;$('meterSave').disabled=!Measurements.stable(m);$('meterAbort').hidden=!m||m.logged;
}
function toggleReading(){
 if(!inModel||modelFallback||$('meterBtn').hidden)return;meterRaised=!meterRaised;PumpView.releaseMouse();drawMeterForm()
}
function saveReading(e){
 e.preventDefault();const {f,j,c}=readField(),values=[...$('meterInputs').querySelectorAll('input')].map(i=>i.value);
 if(!Measurements.record(f,j,c,values)){$('meterMessage').textContent='Številka se ne ujema z instrumentom. Preveri predznak (minus) in decimalno vejico.';ping(false);return}
 ping();pulse('fieldOrder');
 if(c.independent)delete j.chosenTest;
 meterRaised=false;save();fieldHud();PumpView.sync();notice('Odčitek je shranjen v servisni dnevnik.')
}
function fieldChanged(id,verb){
 const {f,j,c}=readField();
 if(verb==='Preberi zaslon regulatorja'){showRegulator();return}
 if(['measure','verify'].includes(j.phase)&&j.last!==null&&c.tests[j.last]?.label===verb){
  if(c.independent)delete j.chosenTest;
  const t=c.tests[j.last];$('readTitle').textContent=t.label;$('readValue').textContent=j.phase==='verify'?t.after:t.before;$('readout').hidden=false;
 }else{$('readout').hidden=true;notice(verb+' · opravljeno')}
 ping();pulse('fieldOrder');
 save();fieldHud();if(c.independent&&j.phase==='procedure'&&f.configOpen)showConfiguration();
}
function rotatePart(){const f=physical();if(!f.spare||f.fixed)return;f.turn=(f.turn+1)%4;PumpView.sync();fieldHud();save();notice('Lega dela · '+f.turn*90+'°')}
function lessonReport(c,j) {
 const lesson=ServiceLesson.lessons[db.active];
 const sections=[['Vzrok',lesson.cause],['Posledica',lesson.effect],['Rešitev in njen učinek',lesson.fix],['Kaj smo se naučili?',lesson.lesson]];
 if(c.independent){
  const reading=j.measureLog?.['measure:'+c.decisive]||c.tests[c.decisive].before;
  const check=j.measureLog?.['verify:'+c.decisive]||c.tests[c.decisive].after;
  sections.unshift(['Odločilna meritev',c.tests[c.decisive].label+' · '+reading+'. '+c.reportDiagnosis],
   ['Kontrola po posegu',check+'. '+c.reportCheck]);
 }
 const pair=c.comparison;
 const comparison=pair?'<section class="lessonCompare"><h3>'+pair.title+'</h3><h4>Tržič · referenčni primer</h4><p>'+pair.tržič+'</p><h4>Žiri · tvoj servis</h4><p>'+pair.žiri+'</p><ul>'+
  j.read.filter(i=>c.tests[i].required).map(i=>'<li><b>'+c.tests[i].label+'</b><br>'+(j.measureLog?.['measure:'+i]||c.tests[i].before)+'</li>').join('')+'</ul><h4>Na naslednjem servisu</h4><p>'+pair.rule+'</p></section>':'';
 return '<section class="lessonReport"><h3>Od prijave do rešitve</h3><blockquote>»'+c.customer+'«</blockquote>'+
   sections.map(([heading,body])=>'<div><h4>'+heading+'</h4><p>'+body+'</p></div>').join('')+
   '<details><summary>Tvoji preizkusi pred posegom in po njem</summary>'+j.read.map(i=>{
     const t=c.tests[i],before=j.measureLog?.['measure:'+i]||t.before,after=j.measureLog?.['verify:'+i]||t.after;
     return '<div class="record"><strong>'+t.label+'</strong><small>Pred posegom · '+before+'</small>'+
       (j.verified.includes(i)?'<small>Po posegu · '+after+'</small>':'')+'</div>';
   }).join('')+'</details>'+comparison+reasoningReview(j)+'</section>';
}
function reasoningReview(j){
 if(!j.reason)return '';
 const rows=Mentor.stages.filter(s=>j.reason[s]?.done).map(s=>{
  const q=Mentor.get(db.active,s),first=q.options[j.reason[s].first],answer=q.options.find(o=>o.correct);
  return '<div class="record"><strong>'+q.question+'</strong>'+(j.reason[s].note?'<p>Tvoj zapis · '+escapeText(j.reason[s].note)+'</p>':'')+'<small>Prvi odgovor · '+first.label+'</small><p>'+
   (first.correct?answer.why:'Ob ponovitvi · '+answer.label+' '+answer.why)+'</p></div>';
 });
 const firstPass=Mentor.stages.filter(s=>j.reason[s]?.done&&Mentor.get(db.active,s).options[j.reason[s].first]?.correct).length;
 return rows.length?'<details><summary>Kako sem razmišljal? V prvem poskusu '+firstPass+' / '+rows.length+'</summary>'+rows.join('')+'</details>':'';
}
function escapeText(s){return String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]))}
function showRegulator(page,storeReading=false){
 const {c,j,f}=readField();
 if(f.isolated||f.opened){openDialog('Regulator','<p>Zaslon je trenutno nedostopen.</p>');return}
 if(!Object.hasOwn(Regulator.tabs,page))page=f.screenPage||'overview';
 const data=Regulator.snapshot(f,c);
 f.screenPage=page;
 const nav=Object.entries(Regulator.tabs).map(([key,title])=>'<button type="button" class="hmiTab" aria-pressed="'+(key===page)+'" data-action="regPage" data-value="'+key+'">'+title+'</button>').join('');
 const row=(label,value)=>'<div class="hmiRow"><span>'+escapeText(label)+'</span><strong>'+escapeText(value)+'</strong></div>';
 let body='';
 if(page==='overview'){
  body='<h3>'+data.status+'</h3>'+row('Zunanje tipalo',data.outdoor)+row('Aktivne napake',String(data.active?1:0));
 }else if(page==='sensors'){
  body=row('Zunanje tipalo',data.outdoor)+data.samples.map(s=>'<h4>'+s.title+'</h4>'+s.rows.map(r=>row(r.name,r.value)).join('')+(s.note?'<p>'+escapeText(s.note)+'</p>':'')).join('');
  const reading=data.samples.find(s=>c.tests[s.index].part==='control');
  if(reading&&['measure','verify'].includes(j.phase)&&!f.measurement&&!Mentor.pending(j,c)){
   const arr=j.phase==='measure'?j.read:j.verified;
   if(storeReading&&!arr.includes(reading.index)){
    const values=reading.rows.map(r=>r.name+' '+r.value).join(' · ')||reading.note;
    j.measureLog??={};j.measureLog[j.phase+':'+reading.index]=values+' (regulator)';arr.push(reading.index);j.last=reading.index;delete j.chosenTest;
    save();refresh();if(!modelFallback)PumpView.sync();
   }
   body+=arr.includes(reading.index)?'<p>Odčitek je zapisan v servisnem dnevniku.</p>':btn('Zapiši odčitek regulatorja','regRecord');
  }
 }else{
  body='<h4>Aktivne napake</h4>'+(data.alarm?row(data.alarm.code,data.alarm.message)+'<p>'+data.alarm.effect+'</p>':'<p>Ni aktivnih napak.</p>')+'<h4>Zgodovina dogodkov</h4><ol>'+data.history.map(h=>'<li>'+escapeText(h)+'</li>').join('')+'</ol>';
 }
 openDialog('Regulator na napravi','<section class="hmiPanel"><div class="hmiHeader"><span>TOPLOLOG</span><small>Učni regulator</small></div><div class="hmiDisplay">'+body+'</div><nav aria-label="Strani regulatorja">'+nav+'</nav></section>');
 save();if(inModel&&!modelFallback)PumpView.sync();
}
function lessonStep(c,f,j) {
 if(c.independent)return c.procedure[j.phase==='procedure'?1:2];
 return ServiceLesson.why(db.active,c,f,j,FieldRules.target(f,j,c));
}
function independentPanel(c,j){
 const verify=j.phase==='verify',arr=verify?j.verified:j.read;
 let html=verify?'<p>Poseg je izveden. Kako boš preveril njegov učinek?</p>':'<blockquote>»'+c.customer+'«</blockquote>';
 for(const i of arr){
  const t=c.tests[i],reading=j.measureLog?.[j.phase+':'+i];
  html+='<div class="record"><strong>'+t.label+'</strong><small>'+(reading?reading+' · ':'')+(verify?t.after:t.before)+'</small></div>';
 }
 return html+btn('Izberi meritev ali pregled','testMenu','primary')+btn(verify?'Zaključi nalog':'Postavi diagnozo',verify?'finish':'diagnose')+btn('Namig','hint','smallBtn');
}
function showTestMenu(){
 const c=current(),j=job(),arr=j.phase==='verify'?j.verified:j.read;
 openDialog('Moje preiskave',c.tests.map((t,i)=>btn(t.label+'<small>'+FieldRules.names[t.tool]+(arr.includes(i)?' · že zapisano':'')+'</small>','pickTest','choice',i)).join(''));
}
function independentHint(c,j,more=false){
 if(j.phase==='done'){notes();return}
 const stage=j.phase==='procedure'?'procedure':j.phase==='verify'?'verify':'measure';
 const hints=c.hints[stage]||['Poišči odmik v zapisniku zagona in ga vnesi na servisnem terminalu.'];
 j.hints??={};let count=j.hints[stage]||0;
 if(!count||more)count=Math.min(hints.length,count+1);
 j.hints[stage]=count;save();
 openDialog('Namig',hints.slice(0,count).map((h,i)=>'<div class="record"><strong>Namig '+(i+1)+'</strong><p>'+h+'</p></div>').join('')+(count<hints.length?btn('Podrobnejši namig','moreHint'):''));
}
function stepDialog(c,j,msg){
 const a=c.adjustment,done=a.steps.slice(0,j.adjStep),rest=a.steps.map((_,i)=>i).filter(i=>i>=j.adjStep).sort((x,y)=>((x*7+3)%5)-((y*7+3)%5));
 openDialog(a.stepsTitle,'<p>'+a.stepsIntro+'</p>'+(done.length?'<ol class="adjDone">'+done.map(s=>'<li><b>'+s.text+'</b><small>'+s.who+' · '+s.why+'</small></li>').join('')+'</ol>':'')+'<p class="adjAsk">Korak '+(j.adjStep+1)+' od '+a.steps.length+' · kaj narediš zdaj?</p>'+rest.map(i=>btn(a.steps[i].text+'<small>'+a.steps[i].who+'</small>','adjStep','choice',i)).join('')+(msg?'<p class="bad" role="status">'+msg+'</p>':''));
}
function showConfiguration(){
 const j=job(),c=current();if(!c.independent||j.phase!=='procedure')return;
 if(c.adjustment?.steps&&(j.adjStep||0)<c.adjustment.steps.length){j.adjStep??=0;stepDialog(c,j);return}
 if(c.adjustment?.choices){
  const a=c.adjustment;
  openDialog(a.title,'<p>'+a.intro+'</p><form id="pumpSetting"><label for="pumpLevel">'+(a.label||'Izbira')+'</label><select id="pumpLevel" required><option value="">Izberi</option>'+a.choices.map((s,i)=>'<option value="'+i+'">'+s+'</option>').join('')+'</select><button class="primary">'+(a.confirm||'Potrdi')+'</button><p id="settingMessage" role="status"></p></form>');
  $('pumpSetting').onsubmit=e=>{
   e.preventDefault();
   if($('pumpLevel').value===''||Number($('pumpLevel').value)!==a.expected){$('settingMessage').textContent=a.wrong||'Ta izbira ne ustreza nalogu.';return}
   finishAdjustment();
  };return;
 }
 if(c.adjustment){
  openDialog(c.adjustment.title,'<p>Trenutna stopnja je III. Na servisni kartici za ta objekt sta zapisani stopnja II in cilj 14 l/min.</p><form id="pumpSetting"><label for="pumpLevel">Nova stopnja</label><select id="pumpLevel" required><option value="">Izberi stopnjo</option><option value="1">I</option><option value="2">II</option><option value="3">III</option></select><button class="primary">Nastavi črpalko</button><p id="settingMessage" role="status"></p></form>');
  $('pumpSetting').onsubmit=e=>{
   e.preventDefault();
   if(Number($('pumpLevel').value)!==c.adjustment.expected){$('settingMessage').textContent='Izbrana stopnja odstopa od zagonske nastavitve. Preveri servisno kartico.';return}
   finishAdjustment();
  };return;
 }
 openDialog('Servisni terminal','<div class="step">Regulator · ogrevalna krivulja</div><p>Trenutni vzporedni odmik je −6 K. Vnesi vrednost iz zapisnika zagona.</p><form id="curveForm"><label for="offset">Novi vzporedni odmik (K)</label><input id="offset" type="number" min="-15" max="15" step="0.5" required><button class="primary">Shrani v regulator</button><p id="curveFeedback" role="status"></p></form>');
 $('curveForm').onsubmit=e=>{
  e.preventDefault();
  if($('offset').valueAsNumber!==current().referenceOffset){$('curveFeedback').textContent='Vrednost se ne ujema z zapisnikom zagona. Preveri svoj zapis v dnevniku.';return}
  finishAdjustment();
 };
}
function finishAdjustment(){
 const f=physical(),j=job();f.configOpen=false;f.fixed=true;j.phase='verify';j.last=null;delete j.chosenTest;save();
 $('dialog').close();if(inModel&&!modelFallback)PumpView.sync();refresh();notice(current().adjustment?.done||'Nastavitev shranjena. Preteklo je 20 simuliranih minut.');
}
function chooseEvidence(c,j){
 return '<p>'+(c.evidenceQuestion||'Katera tvoja meritev najbolje loči to razlago od nezadostne moči naprave?')+'</p>'+j.read.map(i=>btn(c.tests[i].label,'support','choice',i)).join('')+btn('Nazaj k meritvam','backToTests','smallBtn');
}
function reasoningPanel(j,c,stage){
 const d=Mentor.get(db.active,stage),record=j.reason?.[stage],last=d.options[record?.last];
 let html='<section class="mentor"><div class="step">'+d.title+'</div><h3>'+d.question+'</h3>';
 if(stage==='plan')html+='<blockquote>»'+c.customer+'«</blockquote>';
 else if(stage==='interpret')html+='<details open><summary>Tvoji dokazi</summary>'+j.read.map(i=>'<p><b>'+c.tests[i].label+'</b><br>'+(j.measureLog?.['measure:'+i]?j.measureLog['measure:'+i]+'<br>':'')+c.tests[i].before+'</p>').join('')+'</details>';
 if(!record?.revealed&&!last){
  return html+'<label for="reasonNote">Kako bi to pojasnil vajencu?</label><textarea id="reasonNote" maxlength="360" rows="2" placeholder="Najprej odgovori zase. Če želiš, svojo razlago zapiši."></textarea>'+btn('Primerjaj z možnostmi','thinkReveal','primary')+'</section>';
 }
 if(!last?.correct)html+=d.options.map((o,i)=>btn(o.label,'think','choice',i)).join('');
 if(last)html+='<aside class="lessonTip" role="status"><strong>'+(last.correct?'Tvoja utemeljitev drži':'Poglej še enkrat')+'</strong><p>'+last.why+'</p></aside>';
 if(last?.correct)html+=btn(({plan:'Vzemi orodje',interpret:'Postavi diagnozo',transfer:'Odpri zaključno poročilo'})[stage],'thinkNext','primary');
 return html+'</section>';
}
function reasoningAction(action,val,j,c){
 const stage=Mentor.pending(j,c);if(!stage)return;
 const q=Mentor.get(db.active,stage);
 j.reason??={};const r=j.reason[stage]??={};
 if(action==='thinkReveal'){
  r.note=($('reasonNote')?.value||'').trim().slice(0,360);r.revealed=true;
 }else if(action==='think'&&r.revealed&&q.options[Number(val)]&&!q.options[r.last]?.correct){
  r.last=Number(val);r.first??=r.last;
 }else if(action==='thinkNext'&&q.options[r.last]?.correct){
  r.done=true;save();
  if(stage==='interpret'){perform('diagnose');return}
  if(stage==='transfer'){perform('finish');return}
  if(inModel&&!modelFallback){$('dialog').close();PumpView.sync()}
  refresh();return;
 }
 save();if(inModel&&!modelFallback)fieldTablet();else bench();
}
function fieldTablet(){
 const j=job(),c=current(),f=physical();let html='<div class="step">Nalog '+seq(db.active)+' · '+c.location+'</div><h3>'+c.title+'</h3>';
 const stage=Mentor.pending(j,c);
 if(c.independent&&['measure','verify'].includes(j.phase))html+=independentPanel(c,j);
 else if(c.independent&&j.phase==='diagnose'&&j.awaitEvidence)html+=chooseEvidence(c,j);
 else if(stage)html+=reasoningPanel(j,c,stage);
 else if(j.phase==='measure'||j.phase==='verify'){
  const arr=j.phase==='measure'?j.read:j.verified;html+='<p class="prose">»'+c.customer+'«</p><p>Odločilne ugotovitve · '+evidence(arr)+' / '+required().length+'</p>';
  html+=arr.map(i=>'<div class="record"><strong>'+c.tests[i].label+'</strong><small>'+((j.measureLog?.[j.phase+':'+i]||'')+' '+(j.phase==='verify'?c.tests[i].after:c.tests[i].before))+'</small></div>').join('');
  if(f.measurement)html+='<p class="muted">Dokončaj odčitek in pospravi sonde, preden nadaljuješ.</p>';
  else if(evidence(arr)===required().length)html+=btn(j.phase==='measure'?'Postavi diagnozo':'Zaključi nalog',j.phase==='measure'?'diagnose':'finish','primary');
  else html+=btn('Načrt preizkusov','hint');
  html+='<aside class="lessonTip"><strong>Zakaj ta korak?</strong><p>'+lessonStep(c,f,j)+'</p></aside>';
 }else if(j.phase==='diagnose'||j.phase==='repair'){
  const diagnosis=j.phase==='diagnose';html+='<p>'+(diagnosis?'Kateri vzrok pojasni zbrane ugotovitve?':c.diagnoses[c.cause]+'. Izberi ustrezen poseg.')+'</p>';
  html+=(diagnosis?c.diagnoses:c.repairs).map((s,i)=>btn(s,diagnosis?'cause':'fix','choice',i)).join('');
  if(diagnosis)html+=btn('Preberi meritve','notes','smallBtn');
  if(diagnosis&&c.independent)html+=btn('Nazaj k meritvam','backToTests','smallBtn');
 }else if(j.phase==='done'){
  html+=resultCard(j)+lessonReport(c,j)+'<div class="reportActions">'+btn(db.active<CASES.length-1?'Naslednji nalog':'Vsi nalogi',db.active<CASES.length-1?'next':'missions','primary')+btn('Servisni dnevnik','notes')+btn('↺ Ponovi nalog','replay')+'</div>';
 }else html+='<p>'+c.repairs[c.fix]+'</p><ol class="prose">'+c.procedure.map(s=>'<li>'+s+'</li>').join('')+'</ol><p class="meta">Naslednji cilj · '+targetName(FieldRules.target(f,j,c))+'</p><aside class="lessonTip"><strong>Zakaj ta korak?</strong><p>'+lessonStep(c,f,j)+'</p></aside>';
 if(feedback)html+='<p class="bad">'+feedback+'</p>';openDialog('Delovni nalog',html)
}
function enter(){
 if(inModel)return;
 meterRaised=false;
 if(!document.fullscreenElement&&document.fullscreenEnabled)document.documentElement.requestFullscreen().catch(()=>{});
 inModel=true;const j=job();j.started=true;save();$('stage').classList.add('working');$('camera').hidden=false;$('workbench').hidden=false;$('viewLabel').textContent='Servisni pogled · 3D';
 PumpView.setState({caseIndex:db.active,repaired:['verify','done'].includes(j.phase),opened:j.opened});
 $('stage').append($('fieldTemplate').content.cloneNode(true));innerLayer='all';$('stage').classList.add('fps');document.body.classList.add('playing');
 {const c=current(),card=document.createElement('div');card.id='missionIntro';card.setAttribute('aria-hidden','true');
  card.innerHTML='<small>Nalog '+seq(db.active)+' / '+seq(CASES.length-1)+' · '+c.location+' · '+c.weather+'</small><strong>'+c.title+'</strong><p>»'+c.customer+'«</p>';
  $('fieldUI').append(card);setTimeout(()=>card.remove(),4200)}
 modelFallback=false;
 PumpView.open($('model'),{state:readField,reading:()=>meterRaised,toggleReading,readiness:stable=>{if(meterRaised&&!$('meterSave').hidden)$('meterSave').disabled=!stable},pose:()=>j.field?.pose,savePose:p=>{physical().pose=p;save()},message:notice,rotate:rotatePart,changed:fieldChanged,
  aim:(title,verb,enabled)=>{$('aimTitle').textContent=title;$('aimVerb').textContent=verb;$('actPrompt').classList.toggle('ready',enabled)},
  progress:p=>{$('actPrompt').style.setProperty('--p',p)},
  guide:g=>{const b=$('beacon');if(!g||!g.visible||j.unaided&&['measure','verify'].includes(j.phase)){b.hidden=true;return}b.hidden=false;b.style.left=((g.x+1)*50)+'%';b.style.top=((1-g.y)*50)+'%';b.querySelector('b').textContent=targetName(g.id)+' · '+g.distance.toFixed(1).replace('.',',')+' m'},
  onPart:p=>choosePart(p,false),onError:err=>{console.warn('Servisna shema:',err.message);modelFallback=true;$('viewLabel').textContent='Servisna shema';$('stage').classList.remove('fps');$('fieldUI').remove();document.body.classList.remove('playing')}});
 if(!modelFallback){
  $('guidance').onclick=()=>{if(current().independent){showTestMenu();return}j.unaided=!j.unaided;save();fieldHud()};
  $('meterBtn').onclick=toggleReading;$('meterForm').onsubmit=saveReading;$('meterAbort').onclick=()=>{physical().measurement=null;meterRaised=false;save();PumpView.sync();fieldHud()};
  $('screenBtn').onclick=toggleScreen;screenLabel();
  $('tabletButton').onclick=fieldTablet;$('guideBtn').onclick=()=>PumpView.direction();$('duckBtn').onclick=()=>PumpView.crouch();if($('layerBtn'))$('layerBtn').onclick=cycleLayer;$('rotateBtn').onclick=rotatePart;
  $('lockBtn').onclick=()=>PumpView.lookLock();$('exitField').onclick=leave;$('dismissRead').onclick=()=>$('readout').hidden=true;
  document.querySelectorAll('[data-move]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);PumpView.move(b.dataset.move,true)};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>PumpView.move(b.dataset.move,false)});
  if(['diagnose','repair','done'].includes(j.phase)||Mentor.pending(j,current()))fieldTablet();
 }
 $('cover').querySelector('span').textContent=j.opened?'Zapri pokrov':'Odpri pokrov';refresh()
}
function leave(){if(!inModel)return;PumpView.close();$('fieldUI')?.remove();document.body.classList.remove('playing');inModel=false;modelFallback=false;$('stage').classList.remove('working','fps');$('camera').hidden=true;$('workbench').hidden=true;$('viewLabel').textContent='Terenski pogled';if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});refresh()}
function chooseTool(k){if(!toolInfo[k])return;const j=job();j.tool=k;j.last=null;feedback='';if(!inModel)enter();save();refresh()}
function choosePart(p,focus=true){
 if(!parts[p])return;
 const j=job();j.part=p;j.last=null;feedback='';
 if(focus)PumpView.select(p);
 if(['filter','pump','valve','power'].includes(p)||(p==='sensor'&&db.active===5))j.opened=true;
 if(p==='control')j.opened=false;
 $('cover').querySelector('span').textContent=j.opened?'Zapri pokrov':'Odpri pokrov';
 save();bench()
}
const serviceParts=['filter','coil','sensor','pump','valve','sensor','emitter','radHead'];
const manualJobs=[
 {name:'Izpiranje mrežice',hint:'Izberi onesnažena polja na mrežici in jih speri.',zones:[0,2,3,5]},
 {name:'Čiščenje lamel',hint:'Odstrani listje s sesalne površine uparjalnika.',zones:[1,2,4,5]},
 {name:'Postavitev tipala',hint:'Izberi merilno mesto za zunanjo temperaturo.',choices:['Nad izpihom enote','Senčna severna fasada','Osončena lesena stena'],correct:1},
 {name:'Servisni način črpalke',hint:'Izberi ukaz za sprostitev rotorja na servisnem terminalu.',choices:['Polna moč kompresorja','Ponastavitev ure','Cikel deblokade rotorja'],correct:2},
 {name:'Poravnava pogona',hint:'Gred je v položaju ogrevanja prostorov. Nastavi pogon na isto končno lego.',choices:['Ogrevanje radiatorjev','Priprava sanitarne vode','Srednja lega'],correct:0},
 {name:'Smer merilnika',hint:'Voda v tem odseku teče od povratnega voda proti črpalki. Poravnaj oznako na merilniku.',choices:['Proti povratnemu vodu','Proti črpalki'],correct:1}
];
function manualTask(){
 const j=job(),m=manualJobs[db.active];
 let html='<h2>'+m.name+'</h2>';
 if(!j.targeted)return html+'<p class="muted">Na modelu ali seznamu izberi sestavni del za poseg.</p><label for="part">Del naprave</label><select id="part">'+Object.entries(parts).map(([k,p])=>'<option value="'+k+'" '+(j.part===k?'selected':'')+'>'+p+'</option>').join('')+'</select>'+btn('Uporabi izbrani del','target','primary');
 html+='<p>'+m.hint+'</p>';
 if(m.zones){
  const cleaned=j.cleaned||[];html+='<div class="repairGrid '+(db.active===0?'meshGrid':'finGrid')+'">';
  for(let i=0;i<6;i++){const dirty=m.zones.includes(i)&&!cleaned.includes(i);html+='<button data-action="manual" data-value="'+i+'" '+(dirty?'':'disabled')+' class="'+(dirty?'dirty':'clean')+'" aria-label="'+(dirty?'Očisti':'Čist')+' odsek '+(i+1)+'"><span></span></button>'}
  return html+'</div><div class="meta">Očiščeni odseki · '+cleaned.length+' / '+m.zones.length+'</div>'
 }
 return html+m.choices.map((s,i)=>btn(s,'manual','choice',i)).join('')
}
manualJobs.push(
 {name:'Odzračevanje radiatorja',hint:'Kdaj zapreš odzračevalnik?',choices:['Ob prvem pisku zraka','Ko priteče enakomeren curek vode','Šele ko se radiator izprazni'],correct:1},
 {name:'Preizkus zatiča',hint:'Kateri odziv potrdi, da je zatič prost?',choices:['Po rahlem pritisku se sam vrne','Po pritisku ostane ugreznjen','Glava se odvije z nosilca'],correct:0}
);
manualJobs[10]={name:'Dolivanje vode',hint:'Do katerega tlaka doliješ hladen sistem?',choices:['Do zagonskega tlaka iz zapisnika','Do 3 bar, da je rezerva','Dokler ne kaplja varnostni ventil'],correct:0};
manualJobs[11]={name:'Predtlak raztezne posode',hint:'Kdaj izmeriš predtlak posode?',choices:['Ko na vodni strani ni tlaka','Med ogrevanjem','Kadarkoli, ni pomembno'],correct:0};
const phases=['measure','diagnose','repair','procedure','verify','done'];
function bench(){
 const j=job(),c=current(),ix=phases.indexOf(j.phase),checking=j.phase==='verify',arr=checking?j.verified:j.read;
 let html='<div class="workTop"><b class="step">Nalog '+seq(db.active)+'</b><span class="meta">'+c.model+'</span></div><div class="meter">'+phases.slice(0,5).map((_,i)=>'<span class="'+(i<=ix?'on':'')+'"></span>').join('')+'</div>';
 const stage=Mentor.pending(j,c);
 if(c.independent&&['measure','verify'].includes(j.phase)){
  html+=independentPanel(c,j);
  if(c.tests[j.chosenTest])html+=btn('Izvedi · '+c.tests[j.chosenTest].label,'measure','primary');
 }else if(c.independent&&j.phase==='diagnose'&&j.awaitEvidence)html+=chooseEvidence(c,j);
 else if(c.independent&&j.phase==='procedure')html+=btn(c.adjustment?.open||'Odpri nastavitve na terminalu','configuration','primary')+btn('Servisni dnevnik','notes');
 else if(stage)html+=reasoningPanel(j,c,stage);
 else if(j.phase==='measure'||checking){
  html+='<h2>'+(checking?'Kontrolni preizkus':'Pregled naprave')+'</h2><p class="muted">'+(checking?'Ponovi odločilne preizkuse in primerjaj rezultate pred posegom in po njem.':'Izberi del na modelu ali seznamu. V kovčku izberi instrument in opravi preizkus.')+'</p><label for="part">Del naprave</label><select id="part">'+Object.entries(parts).map(([k,p])=>'<option value="'+k+'" '+(j.part===k?'selected':'')+'>'+p+'</option>').join('')+'</select>';
  html+='<div class="meta" style="margin-top:12px">Orodje · '+toolInfo[j.tool][0]+'</div>';
  html+=btn(j.tool==='inspect'?'Preglej del':'Izvedi meritev','measure','primary');
  if(j.last!==null&&c.tests[j.last]){let t=c.tests[j.last];html+='<div class="reading" role="status"><b>'+t.label+'</b>'+(checking?'<small>Pred posegom</small><br>'+t.before+'<br><small>Po posegu</small><br>'+t.after:t.before)+'</div>'}
  html+='<div class="meta">Odločilne ugotovitve · '+evidence(arr)+' / '+required().length+'</div>';
  html+=btn(checking?'Zaključi nalog':'Postavi diagnozo',checking?'finish':'diagnose')+btn('Poglej načrt preizkusov','hint','smallBtn');
 }else if(j.phase==='diagnose'||j.phase==='repair'){
  const diag=j.phase==='diagnose';html+='<h2>'+(diag?'Kaj je vzrok?':'Izberi poseg')+'</h2><p class="muted">'+(diag?'Primerjaj ugotovitve in izberi razlago, ki jo podpirajo meritve.':'Potrjena diagnoza · '+c.diagnoses[c.cause])+'</p>';
  html+=(diag?c.diagnoses:c.repairs).map((s,i)=>btn(s,diag?'cause':'fix','choice',i)).join('')+btn('Odpri zapiske meritev','notes','smallBtn');
  if(diag&&c.independent)html+=btn('Nazaj k meritvam','backToTests','smallBtn');
 }else if(j.phase==='procedure'&&j.manual){
  html+=manualTask()
 }else if(j.phase==='procedure'){
  html+='<h2>Izvedba posega</h2><p class="muted">'+c.repairs[c.fix]+'. Izberi naslednji korak.</p><div class="meta">Korak '+(j.step+1)+' / '+c.procedure.length+'</div>';
  const order=[[2,0,1],[2,1,0],[1,2,0]][db.active%3];html+=order.filter(i=>i>=j.step).map(i=>btn(c.procedure[i],'step','choice',i)).join('');
 }else if(j.phase==='done'){
  html+='<h2>'+c.title+'</h2>'+resultCard(j)+lessonReport(c,j)+'<div class="reportActions">'+btn(db.active<CASES.length-1?'Naslednji nalog':'Pregled vseh nalogov',db.active<CASES.length-1?'next':'missions','primary')+btn('Servisni dnevnik','notes')+btn('↺ Ponovi nalog','replay')+'</div>';
 }
 if(!physical().isolated&&!physical().opened)html+=btn('Zaslon regulatorja','regPage','smallBtn','overview');
 if(feedback)html+='<p role="status" class="bad">'+feedback+'</p>';$('workbench').innerHTML=html;
 $('part')?.addEventListener('change',e=>choosePart(e.target.value))
}
function perform(action,val){
 if(action==='howto'){$('help').click();return}
 // Ponastavitev naloga: kadar koli, s potrditvijo. Zvezdice (najboljši rezultat) ostanejo.
 if(action==='reset'){const i=val===undefined||val===''?db.active:Number(val);
  openDialog('Začni nalog znova?','<p class="prose">Nalog <b>'+seq(i)+' · '+CASES[i].title+'</b> se začne od začetka: meritve, odločitve in stanje naprave se pobrišejo. Zvezdice, ki si jih že dobil, ostanejo.</p><div class="actions">'+btn('Začni znova','resetYes','primary',i)+btn('Prekliči','resetNo')+'</div>');return}
 if(action==='resetNo'){$('dialog').close();return}
 if(action==='resetYes'){const i=Number(val),wasIn=inModel;$('dialog').close();if(inModel)leave();db.jobs[i]=fresh();db.active=i;feedback='';save();refresh();notice('Nalog '+seq(i)+' se začne od začetka.');if(wasIn)enter();return}
 const c=current(),j=job();feedback='';
 if(action==='regPage'||action==='regRecord'){showRegulator(action==='regRecord'?'sensors':val,action==='regRecord');return}
 if(c.independent){
  if(['why','hint','moreHint'].includes(action)){independentHint(c,j,action==='moreHint');return}
  if(action==='configuration'){showConfiguration();return}
  if(action==='adjStep'&&j.phase==='procedure'&&c.adjustment?.steps){
   const v=Number(val);j.adjStep??=0;
   if(v===j.adjStep){j.adjStep++;save();if(j.adjStep>=c.adjustment.steps.length)showConfiguration();else stepDialog(c,j);}
   else{j.mistakes++;save();stepDialog(c,j,'»'+c.adjustment.steps[v].text+'« pride kasneje. Kaj mora biti narejeno prej?');}
   return;
  }
  if(action==='testMenu'&&['measure','verify'].includes(j.phase)){showTestMenu();return}
  if(action==='pickTest'&&['measure','verify'].includes(j.phase)&&c.tests[Number(val)]){
   if(physical().measurement){openDialog('Meritev v teku','<p>Dokončaj odčitek in odstrani sonde ali prekliči meritev na instrumentu.</p>');return}
   const i=Number(val),t=c.tests[i];j.chosenTest=i;j.part=t.part;j.tool=t.tool;j.last=null;save();
   $('dialog').close();if(inModel&&!modelFallback)PumpView.sync();refresh();return;
  }
 }
 if(['thinkReveal','think','thinkNext'].includes(action)){reasoningAction(action,val,j,c);return}
 if(['measure','diagnose','finish'].includes(action)&&Mentor.pending(j,c)){if(inModel&&!modelFallback)fieldTablet();else bench();return}
 if(action==='start'){enter();return}
 if(action==='why'){const f=physical();openDialog('Zakaj ta korak?','<div class="step">'+c.title+'</div><h3>'+targetName(FieldRules.target(f,j,c))+'</h3><p class="prose">'+lessonStep(c,f,j)+'</p>');return}
 if(action==='hint'){openDialog('Načrt preizkusov',c.tests.map(t=>'<div class="record"><strong>'+t.label+'</strong><small>'+parts[t.part]+' · '+FieldRules.names[t.tool]+' · '+(t.required?'Odločilni preizkus':'Dodatni preizkus')+'</small><p>'+ServiceLesson.purpose(db.active,t)+'</p></div>').join(''));return}
 if(action==='notes'){notes();return}
 if(action==='missions'){missions();return}
 if(action==='next'||action==='job'){loadCase(action==='next'?db.active+1:Number(val));return}
 if(action==='replay'){$('dialog').close();leave();db.jobs[db.active]=fresh();save();refresh();return}
 if(action==='measure'&&['measure','verify'].includes(j.phase)){
  const n=c.tests.findIndex(t=>t.part===j.part&&t.tool===j.tool);j.last=n>=0?n:null;
  if(n<0)feedback='S tem orodjem na izbranem delu za ta nalog ni uporabnega odčitka. Preveri načrt preizkusov.';
  else{const arr=j.phase==='verify'?j.verified:j.read;if(!arr.includes(n))arr.push(n);if(c.independent)delete j.chosenTest}
 }else if(action==='diagnose'&&j.phase==='measure'){
  if(c.independent){
   if(physical().measurement)feedback='Pred presojo dokončaj meritev in pospravi sonde.';
   else if(!j.read.length)feedback='Diagnozo utemelji z vsaj enim lastnim odčitkom ali pregledom.';
   else{j.phase='diagnose';j.awaitEvidence=false;delete j.chosenTest}
  }else if(evidence(j.read)<required().length)feedback='Manjka odločilna ugotovitev. Primerjaj meritve z drugim preizkusom.';else j.phase='diagnose';
 }else if(c.independent&&action==='backToTests'&&j.phase==='diagnose'){
  j.phase='measure';j.awaitEvidence=false;
 }else if(c.independent&&action==='support'&&j.phase==='diagnose'&&j.awaitEvidence){
  if(!j.read.includes(Number(val))||Number(val)!==c.decisive)feedback=c.weakEvidence||'Ta ugotovitev sama ne loči nizke zahteve od premajhne moči. Lahko se vrneš na teren.';
  else if(evidence(j.read)<required().length)feedback=c.missingEvidence||'Odčitek podpira tvojo razlago. Preveri še, kakšno vrednost je ta sistem pri današnjih pogojih predvideval ob zagonu.';
  else{j.awaitEvidence=false;j.phase='repair'}
 }else if(action==='cause'&&j.phase==='diagnose'){
  if(Number(val)===c.cause){if(c.independent)j.awaitEvidence=true;else j.phase='repair'}else{j.mistakes++;feedback='Ta vzrok ne pojasni vseh ugotovitev. Ponovno odpri zapiske meritev.'}
 }else if(action==='fix'&&j.phase==='repair'){
  if(Number(val)===c.fix)j.phase='procedure';else{j.mistakes++;feedback='Ta poseg ne odpravi potrjenega vzroka. Izberi poseg na prizadetem delu.'}
 }else if(action==='target'&&j.manual){
  if(j.part!==serviceParts[db.active])feedback='Ta del ne ustreza izbranemu posegu. Preveri potrjeno diagnozo.';
  else{j.targeted=true;choosePart(j.part)}
 }else if(action==='manual'&&j.manual&&j.targeted){
  const m=manualJobs[db.active],v=Number(val);let finished=false;
  if(m.zones){j.cleaned=j.cleaned||[];if(m.zones.includes(v)&&!j.cleaned.includes(v))j.cleaned.push(v);finished=j.cleaned.length===m.zones.length}
  else if(v===m.correct)finished=true;
  else{j.mistakes++;feedback='Nastavitev se ne ujema s pogoji tega naloga. Ponovno preveri smer, lego ali način delovanja.'}
  if(finished){j.step=2;j.manual=false;notice('Poseg na delu je izveden. Pripravi napravo za preizkus.')}
 }else if(action==='step'&&j.phase==='procedure'&&!j.manual){
  if(Number(val)!==j.step){j.mistakes++;feedback='Pred tem je potreben drug korak. Preveri vrstni red priprave, posega in zagona.'}
  else if(j.step===1){j.manual=true;j.targeted=false}
  else if(++j.step===c.procedure.length){j.phase='verify';j.last=null;PumpView.setState({caseIndex:db.active,repaired:true,opened:j.opened});notice('Poseg izveden. Preveri delovanje.')}
 }else if(action==='finish'&&j.phase==='verify'){
  if(c.independent&&physical().measurement)feedback='Dokončaj meritev in pospravi sonde.';
  else if(evidence(j.verified)<required().length)feedback=c.verifyPrompt||(c.independent?'Za zaključek potrebuješ dokaz o shranjeni spremembi in o odzivu naprave.':'Ponovi odločilne preizkuse, preden zaključiš nalog.');
  else{j.phase='done';j.score=Math.max(40,100-10*j.mistakes);db.scores[db.active]=Math.max(j.score,db.scores[db.active]||0)}
 }
 if(feedback)ping(false);
 if(action==='finish'&&j.phase==='done'){ping();setTimeout(ping,170);setTimeout(ping,340)}
 if(inModel&&!modelFallback){
  PumpView.sync();
  if(action==='fix'&&j.phase==='procedure'){$('dialog').close();notice('Poseg je potrjen. Nadaljuj na napravi.')}
  else fieldTablet()
 }
 save();refresh()
}
function loadCase(i){if(!available(i))return;$('dialog').close();leave();db.active=i;if(new URLSearchParams(location.search).has('nalog')){const url=new URL(location.href);url.searchParams.set('nalog',i+1);history.replaceState(null,'',url)}feedback='';save();refresh();window.scrollTo(0,0)}
function openDialog(title,html){if(inModel&&!modelFallback)PumpView.releaseMouse();$('dialogTitle').textContent=title;$('dialogBody').innerHTML=html;if(!$('dialog').open)$('dialog').showModal()}
function missions(){
 const total=CASES.reduce((s,_,i)=>s+starsOf(db.scores[i]),0);
 openDialog('Servisni nalogi','<p class="missionSum">Zbrane zvezdice · <b>'+total+' / '+CASES.length*3+'</b> · rešenih nalogov '+Object.keys(db.scores).length+' / '+CASES.length+'</p><div class="missionGrid">'+CASES.map((c,i)=>{const locked=!available(i);
  const state=locked?'Reši prejšnji nalog':done(i)?db.scores[i]+' XP':i===db.active?'Aktivni nalog':c.independent?'Samostojni nalog':c.station?'Radiatorska postaja':'Na voljo';
  const progress=!locked&&(db.jobs[i]?.started||done(i));
  return '<div class="missionCell">'+'<button class="mission'+(i===db.active?' current':'')+(done(i)?' solved':'')+'" '+(locked?'disabled':'')+' data-action="job" data-value="'+i+'"><span class="mTop"><span class="mNum">'+seq(i)+'</span>'+(locked?'<i>'+icon('lock')+'</i>':starRow(starsOf(db.scores[i])))+'</span><strong>'+c.title+'</strong><small>'+c.location+' · '+c.weather+'</small><span class="mState">'+state+'</span></button>'+(progress?'<button class="mReset" data-action="reset" data-value="'+i+'" title="Začni ta nalog znova">↺ Znova</button>':'')+'</div>'}).join('')+'</div>')}
function notes(){
 const j=job(),c=current();
 let html='<div class="step">Nalog '+seq(db.active)+'</div><h3>'+c.title+'</h3>';
 if(j.phase==='done'){
   html+=lessonReport(c,j)+'<a href="'+c.source+'" target="_blank" rel="noopener">'+c.sourceTitle+' · Akademija TČ</a>';
 }else{
   html+='<p class="prose">»'+c.customer+'«</p>';
   html+=j.read.length?j.read.map(i=>{
     const t=c.tests[i];
     return '<div class="record"><strong>'+t.label+'</strong>'+(c.independent?'':'<p>'+ServiceLesson.purpose(db.active,t)+'</p>')+'<small>Pred posegom · '+(j.measureLog?.['measure:'+i]?j.measureLog['measure:'+i]+'. ':'')+t.before+'</small>'+
       (j.verified.includes(i)?'<small class="success">Po posegu · '+(j.measureLog?.['verify:'+i]?j.measureLog['verify:'+i]+'. ':'')+t.after+'</small>':'')+'</div>';
   }).join(''):'<p class="muted">Prva meritev se bo zapisala sem.</p>';
 }
 openDialog('Servisni dnevnik',html);
}
function instructions(){openDialog('Kako igrati','<div class="prose howto"><p><b>Cilj:</b> kot serviser na terenu izmeri, ugotovi vzrok, popravi in s kontrolno meritvijo dokaži, da deluje.</p><h4>Potek naloga</h4><ol><li>Preberi prijavo stranke in pritisni <b>Začni igro</b>.</li><li>Pri kovčku nameri orodje in drži <kbd>E</kbd>. Zgoraj levo vedno piše naslednji cilj.</li><li>Namesti tipala na označena mesta, dvigni instrument z <kbd>I</kbd>, počakaj na <b>STABILNO</b> in prepiši vrednosti.</li><li>V delovnem nalogu (<kbd>J</kbd>) izberi vzrok. Popravi na napravi. Pokrov: drži <kbd>E</kbd> in serviser sam odvije vijake in ga odnese.</li><li>Ponovi odločilne meritve in zaključi nalog. Poročilo pokaže, kaj je bilo narobe in zakaj je poseg pomagal.</li></ol><h4>Tipke</h4><table class="keys"><tr><td><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd></td><td>hoja · <kbd>Shift</kbd> hitreje</td></tr><tr><td><kbd>miška</kbd></td><td>povleci za razgled ali vklopi <b>Zajem miške</b></td></tr><tr><td><kbd>E</kbd></td><td>drži: primi, odvij, namesti (ali drži klik)</td></tr><tr><td><kbd>C</kbd></td><td>počep – za nizke priključke</td></tr><tr><td><kbd>H</kbd></td><td>pokaži smer do naslednjega cilja</td></tr><tr><td><kbd>Z</kbd></td><td>zakaj ta korak</td></tr><tr><td><kbd>I</kbd></td><td>dvigni instrument in beri</td></tr><tr><td><kbd>J</kbd></td><td>delovni nalog</td></tr><tr><td><kbd>R</kbd></td><td>zavrti nadomestni del pred vgradnjo</td></tr><tr><td><kbd>V</kbd></td><td>pri odprti enoti: poudari vodni del ali hladilni krog</td></tr></table><h4>Dobro je vedeti</h4><ul><li>Za servisnim pokrovom je tudi hladilni krog – samo za ogled. Poseg vanj je dovoljen samo s spričevalom.</li><li><b>Kompas</b> na vrhu zaslona: <b>S</b> je sever. Zunanje tipalo je na severni steni, vsaj 2 m visoko.</li><li><b>↺ Znova</b> začne nalog od začetka; zvezdice ostanejo.</li><li>Napredek se shrani v tem brskalniku.</li></ul></div>')}
document.addEventListener('click',e=>{const b=e.target.closest('[data-tool],[data-action]');if(!b||b.disabled)return;if(b.dataset.tool)chooseTool(b.dataset.tool);else perform(b.dataset.action,b.dataset.value)});
$('terrain').onclick=()=>{if($('dialog').open)$('dialog').close();leave()};$('missions').onclick=missions;$('journal').onclick=notes;$('hotspot').onclick=enter;$('help').onclick=instructions;$('close').onclick=()=>$('dialog').close();$('dialog').onclick=e=>{if(e.target===$('dialog')){let r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}};
$('back').onclick=leave;$('cover').onclick=()=>{const j=job();j.opened=PumpView.toggleCover();$('cover').querySelector('span').textContent=j.opened?'Zapri pokrov':'Odpri pokrov';save()};$('zoom').onclick=()=>PumpView.zoom(1);$('homecam').onclick=()=>PumpView.reset();
async function toggleScreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{notice('Igra zaseda celotno okno brskalnika.')} }
function screenLabel(){if($('screenBtn')){$('screenBtn').textContent=document.fullscreenElement?'Okenski način':'Cel zaslon';$('screenBtn').hidden=!document.fullscreenEnabled}}
document.addEventListener('fullscreenchange',screenLabel);
function soundLabel(){const b=$('sound');if(b){b.textContent=muted?'🔇':'🔊';b.title=muted?'Vklopi zvok':'Izklopi zvok';b.setAttribute('aria-label',b.title)}}
if($('sound')){$('sound').onclick=()=>{muted=!muted;try{localStorage.setItem('termoteren.mute',muted?'1':'0')}catch{}soundLabel();if(!muted)ping()};soundLabel()}$('fullscreen').onclick=toggleScreen;
$('sources').onclick=()=>openDialog('O simulaciji','<div class="prose"><p>Toplolog Simulator je vaja v diagnosticiranju toplotnih črpalk zrak–voda. Servisni nalogi so prirejeni po priročniku <a href="https://khrastnik.github.io/akademija-tc/okvare/" target="_blank" rel="noopener">Okvare in popravila · Akademija TČ</a> (khrastnik). Prirejeni scenariji so objavljeni pod licenco <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a>.</p><p>Panorama Kloppenheim 06 ter fotografski teksturi Gravel Floor in Weathered Brown Planks so iz zbirke <a href="https://polyhaven.com/" target="_blank" rel="noopener">Poly Haven</a> (CC0).</p><p>Prijave, odčitki, oznake napak in lokacije so simulirani. 3D model prikazuje poenostavljeno servisno postavitev. Pri dejanskem delu upoštevaj servisna navodila konkretnega modela in posege najprej vadi pod strokovnim nadzorom. Dela na električnih delih (230/400 V) izvaja le elektro usposobljena oseba, posege v krog hladiva le serviser s spričevalom.</p></div>');
document.addEventListener('keydown',e=>{if($('dialog').open||e.altKey||e.ctrlKey||e.metaKey||e.repeat||/SELECT|INPUT|TEXTAREA/.test(e.target.tagName))return;if(modelFallback&&/^[1-4]$/.test(e.key))chooseTool(Object.keys(toolInfo)[Number(e.key)-1]);if(inModel&&!modelFallback&&e.code==='Tab'&&document.pointerLockElement){e.preventDefault();fieldTablet()}if(inModel&&!modelFallback&&e.code==='KeyJ')fieldTablet();if(inModel&&!modelFallback&&e.code==='KeyV'&&readField().f.opened)cycleLayer();if(inModel&&!modelFallback&&e.code==='KeyZ')perform('why')});
$('help').onclick=()=>openDialog('Prvoosebni servis','<div class="prose"><p>Hodi s tipkami WASD. Za razgled povleci po prizoru ali uporabi smerne tipke. Na telefonu uporabi smerne gumbe. S C počepneš.</p><p>Približaj se kovčku. Drži klik na pokrovu, nato na orodju. Enako delaj na napravi. Uporabiš lahko tudi merilni križ in tipko E. H usmeri pogled k naslednjemu cilju.</p><p>Na sprednjem pokrovu nameri osvetljeni zaslon in drži E ali klik. Prelistaj stanje, podatke in zgodovino napak. Servisni terminal povežeš na ločeni priključek pod zaslonom.</p><p>Tipala pritrdi na označena mesta na ceveh. Z I dvigni instrument, počakaj na oznako STABILNO in prepiši izmerjene vrednosti. Snemi tipala, nato primerjaj odčitke v delovnem nalogu (J). Po diagnozi zavaruj napravo, izvedi ustrezen poseg in ponovi preizkuse. Pri menjavi z R poravnaj novi del z ležiščem.</p></div>');
refresh();
