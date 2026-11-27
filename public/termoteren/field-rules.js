/* The same rules drive the aiming prompt and the completed physical action. */
window.FieldRules=(()=>{
 const names={inspect:'Svetilka',meter:'Servisni terminal',thermo:'Termometer',flow:'Merilnik pretoka',driver:'Izvijač',brush:'Servisna krtača'};
 const parts={control:'Regulator',filter:'Indikator filtra',pump:'Obtočni krog',fan:'Ventilator',valve:'Preklopni ventil',coil:'Uparjalnik',sensor:'Tipalo',power:'Napajalni sklop'};
 const jobs=['Izperi mrežico filtra','Odstrani listje z lamel','Prestavi zunanje tipalo','Sprosti rotor s servisnim programom','Zamenjaj pogon ventila','Zamenjaj merilnik pretoka'];
 const mechanical=[0,4,5],wet=[0,5];
 function fresh(){return {kitOpen:false,held:null,isolated:false,drained:false,opened:false,screws:[],reseat:false,removed:false,cleaned:[],spare:false,turn:1,fixed:false}}
 function target(f,j,c){
  if(Mentor.pending(j,c))return 'tablet';
  if(f.panel==='out')return 'panelRest';
  if(f.panel==='in')return 'panelMount';
  if(f.carry==='dirtyCartridge')return 'basinDrop';
  const n=f.caseIndex;
  const measurement=Measurements.next(f,j,c);if(measurement)return measurement;
  const tool=(t,d)=>f.held===t?d:f.kitOpen?'tool:'+t:'kit';
  // Pokrov z vijaki je eno dejanje: animacija sama odvije ali privije vijake in prestavi pokrov.
  const assemble=()=>f.opened||f.screws.length?'cover':f.drained?'water':'isolator';
  if(j.phase==='done'||j.phase==='diagnose'||j.phase==='repair')return 'tablet';
  if(j.phase==='measure'||j.phase==='verify'){
   if(f.opened||f.screws.length||f.isolated||f.drained)return assemble();
   const arr=j.phase==='verify'?j.verified:j.read;
   const t=c.independent?c.tests[j.chosenTest]:c.tests.find((t,i)=>t.required&&!arr.includes(i));
   if(!t)return c.independent?null:'tablet';
   let id=t.part;
   if(['filter','pump','valve'].includes(id)||(id==='sensor'&&n===5))id='test:'+id;
   return tool(t.tool,Measurements.forTest(f,j,t)||id);
  }
  if(c.independent)return c.adjustment?tool(c.adjustment.tool,c.adjustment.target):tool('meter','control');
  if(c.station){const id=c.station.targets[f.radStep||0];return id==='radVent'?tool('driver',id):id}
  if(f.fixed)return assemble();
  if(n===3)return tool('meter','control');
  if(!f.isolated)return 'isolator';
  if(mechanical.includes(n)&&!f.opened){
   return 'cover';
  }
  if(wet.includes(n)&&!f.drained)return 'water';
  if(n===0){if(!f.removed)return 'filterCap';if(f.cleaned.length<3)return tool('brush','dirty:'+([0,1,2].find(i=>!f.cleaned.includes(i))));return f.carry==='cartridge'?'filterSeat':'cleanFilter'}
  if(n===1)return tool('brush','leaf:'+([0,1,2].find(i=>!f.cleaned.includes(i))));
  if(n===2)return tool('driver',f.removed?'newMount':'oldSensor');
  if(!f.removed)return tool('driver',n===4?'oldDrive':'oldFlow');
  return !f.spare?'spare':n===4?'driveSeat':'flowSeat';
 }
 // Hladilni krog: samo ogled. Poseg vanj je dovoljen samo s spričevalom (F-plini).
 const REF={
  compressor:{name:'Kompresor (hladilni krog)',info:'Stisne paro hladiva, da se močno segreje. Na vseh enotah je spodaj, ker je najtežji; ponavadi v črni zvočni izolaciji. Samo ogled – poseg s spričevalom.'},
  schema:{name:'Nalepka: shema hladilnega kroga',info:'Postavitev delov se med proizvajalci razlikuje. Na objektu najprej poišči to nalepko – ponavadi je na notranji strani servisnega pokrova ali stranske stene.'},
  fourway:{name:'4-potni ventil s tuljavo',info:'Obrne tok hladiva: ogrevanje ali odtajevanje. Črna tuljava ga preklaplja (nalog 13). Samo ogled.'},
  eev:{name:'Elektronski ekspanzijski ventil (EEV)',info:'Spusti v uparjalnik ravno prav hladiva. Črna kapa je koračni motor. Zataknjen EEV = visoko pregrevanje. Samo ogled.'},
  dryer:{name:'Filter sušilnik',info:'Na tekočinskem vodu, lovi vlago in delce. Zamašen: cev za njim je hladnejša, pregrevanje visoko. Samo ogled.'},
  accumulator:{name:'Ločevalnik tekočine',info:'Pred kompresorjem. Zadrži kapljevito hladivo, da ne pride v kompresor. Samo ogled.'},
  plate:{name:'Ploščni izmenjevalnik (kondenzator)',info:'Tu hladivo odda toploto vodi za ogrevanje. Hladivo in voda se ne mešata.'},
  liquid:{name:'Tekočinski vod',info:'Tanjša cev: hladivo v tekočem stanju gre od izmenjevalnika skozi filter sušilnik do EEV.'},
  ports:{name:'Servisna priključka – visoki (rdeča) in nizki tlak (modra)',info:'Ponavadi ob stranskem pokrovu, da sta dosegljiva brez razstavljanja. Tu serviser s spričevalom priklopi manometre. Brez spričevala ne odpiraj kap.'},
  hp:{name:'Visokotlačno stikalo',info:'Izklopi kompresor, če tlak preveč naraste – na primer ko ni pretoka vode.'},
  lp:{name:'Tipalo nizkega tlaka',info:'Iz njega regulator izračuna temperaturo uparjanja.'},
  tdis:{name:'Tipalo vročega plina',info:'Na tlačni cevi kompresorja. Previsoko: premalo hladiva ali zataknjen EEV. Vrednost vidiš v servisnem meniju.'},
  tsuc:{name:'Tipalo sesalnega voda',info:'S tlakom uparjanja da pregrevanje. Vrednost vidiš v servisnem meniju regulatorja.'}
 };
 const labels={kit:'Servisni kovček',cover:'Servisni pokrov',isolator:'Glavno stikalo na fasadi',water:'Vodni servisni blok',filterCap:'Vložek filtra',filterSeat:'Ležišče filtra',oldSensor:'Zunanje tipalo',newMount:'Senčni nosilec · severna stena',oldDrive:'Pogon ventila',oldFlow:'Merilnik pretoka',driveSeat:'Gred ventila',flowSeat:'Priključek merilnika',spare:'Nadomestni del na pladnju',tablet:'Delovni nalog'};
 Object.assign(labels,{panelRest:'Stojalo za pokrov',panelMount:'Vodili servisnega pokrova',basinDrop:'Pralna kad',cleanFilter:'Opran filtrski vložek',instrument:'Zaslon instrumenta'});for(const [k,v] of Object.entries(Measurements.ports))labels['probe:'+k]=v;
 function label(id){const [type,v]=String(id||'').split(':');if(type==='ref')return REF[v]?.name||'Hladilni krog';if(type==='info')return window.PartInfo?.get(id)?.name||'Del naprave';if(type==='tool')return names[v];if(type==='screw')return 'Vijak pokrova '+(Number(v)+1);if(type==='dirty')return 'Mrežica · odsek '+(Number(v)+1);if(type==='leaf')return 'Listje na lamelah · '+(Number(v)+1);if(type==='test')return parts[v];return labels[id]||parts[id]||'Del naprave'}
 function action(f,j,c,id){
  const [type,value]=String(id||'').split(':'),n=f.caseIndex;
  const ok=(verb,seconds,change)=>({verb,seconds,change,enabled:true});
  const no=verb=>({verb,enabled:false,seconds:0});
  const need=t=>no('V kovčku vzemi orodje: '+names[t]+'.');
  const has=t=>f.held===t;
  if(!id)return no('Poglej proti predmetu.');
  if(type==='ref')return no(REF[value]?.info||'Samo za ogled.');
  if(type==='info')return no('Samo za ogled · pritisni I in preberi, kaj je to.');
  if(id==='regulatorScreen'||(id==='control'&&!f.held)){
   if(f.isolated)return no('Zaslon nima napajanja.');
   if(f.opened||f.panel||f.carry)return no('Zaslon je na servisnem pokrovu.');
   if(f.measurement)return no('Najprej dokončaj ali prekliči meritev na instrumentu.');
   return ok('Preberi zaslon regulatorja',.26,()=>{});
  }
  if(c.independent&&j.phase==='procedure'&&!['kit','tool'].includes(type)){
   if(c.adjustment){
    if(type!==c.adjustment.target)return no(c.adjustment.instruction);
    if(!has(c.adjustment.tool))return need(c.adjustment.tool);
    return ok(c.adjustment.open,.75,()=>{f.configOpen=true});
   }
   if(type!=='control')return no('Nastavitev spreminjaš na regulatorju.');
   if(!has('meter'))return need('meter');
   return ok('Odpri nastavitve ogrevanja',.65,()=>{f.configOpen=true});
  }
  if(c.independent&&['isolator','water','cover','screw'].includes(type))return no('Za servisno diagnostiko pusti napravo v obratovanju.');
  if(Mentor.pending(j,c))return no('Odpri delovni nalog (J) in presodi dokaze.');
  if(c.station&&j.phase==='procedure'&&!['tool','kit'].includes(type)){
   const step=f.radStep||0;
   if(id!==c.station.targets[step])return no('Odpri nalog za namen naslednjega koraka.');
   if(id==='radVent'&&!has('driver'))return need('driver');
   return ok(c.station.steps[step],step===2?2:1.1,()=>{
    f.radStep=step+1;f.held=null;
    if(f.radStep===c.station.steps.length){f.fixed=true;j.phase='verify';j.last=null}
   });
  }
  if(c.station&&['isolator','water','cover','screw'].includes(type))return no('Ta nalog poteka na radiatorski postaji.');
  const measurement=Measurements.action(f,j,c,id);if(measurement)return measurement;
  if(f.panel==='out')return id==='panelRest'?ok('Odloži pokrov na stojalo',1.2,()=>{f.panel=null}):no('Odnesi pokrov do stojala desno od naprave.');
  if(f.panel==='in')return id==='panelMount'?ok('Poravnaj pokrov z vodili in ga namesti',1.45,()=>{f.panel=null;f.opened=false;f.reseat=true}):no('Prinesi pokrov do vodil na sprednji strani naprave.');
  if(f.carry==='dirtyCartridge')return id==='basinDrop'?ok('Položi umazan vložek v pralno kad',1.15,()=>{f.carry=null}):no('Odnesi umazan vložek do kadi ob kovčku.');
  if(type==='kit')return ok(f.kitOpen?'Zapri kovček':'Odpri kovček',.22,()=>{f.kitOpen=!f.kitOpen});
  if(type==='tool'&&f.carry)return no('Najprej namesti del, ki ga nosiš.');
  if(type==='tool')return f.kitOpen&&names[value]?ok('Vzemi · '+names[value],.2,()=>{f.held=value}):no('Najprej odpri kovček.');
  if(type==='isolator'){
   if(f.isolated&&(f.opened||f.screws.length||f.drained||(f.removed&&!f.fixed)))return no('Za zagon sestavi napravo, pritrdi pokrov in obnovi vodni krog.');
   return ok(f.isolated?'Vključi in preizkusi napravo':'Ustavi in zavaruj napravo',.65,()=>{
    f.isolated=!f.isolated;
    if(!f.isolated&&f.fixed&&j.phase==='procedure'){j.phase='verify';j.last=null}
   });
  }
  if(type==='water'){
   if(!f.isolated)return no('Najprej izklopi in zavaruj napravo.');
   if(f.drained&&f.removed&&!f.fixed)return no('Najprej vgradi del in zapri ohišje.');
   return ok(f.drained?'Odpri ventila, napolni, odzrači in preskusi tesnost':'Izoliraj ohlajeni odsek in razbremeni tlak',.95,()=>{f.drained=!f.drained});
  }
  if(type==='screw')return action(f,j,c,'cover');
  if(type==='screwManual'){
   if(!f.isolated)return no('Najprej zavaruj napravo z glavnim stikalom.');
   if(!has('driver'))return need('driver');
   const i=Number(value),loose=f.screws.includes(i);
   if(f.opened)return no('Pokrov najprej položi na ohišje.');
   if(loose&&!f.reseat)return no('Vijak je odvit. Nadaljuj z drugim vijakom.');
   if(!loose&&f.reseat)return no('Ta vijak je že privit.');
   return ok(loose?'Privij vijak':'Odvij vijak',1.65,()=>{f.screws=loose?f.screws.filter(s=>s!==i):[...f.screws,i];if(!f.screws.length)f.reseat=false});
  }
  if(type==='cover'){
   if(!f.isolated)return no('Najprej ustavi in zavaruj napravo.');
   if(f.opened&&f.removed&&!f.fixed&&mechanical.includes(n))return no('Pred zapiranjem ponovno vgradi sestavni del.');
   return ok(f.opened?'Namesti pokrov in privij vijake':'Odvij vijake in snemi pokrov',3.4,()=>{if(f.opened){f.opened=false;f.screws=[]}else{f.opened=true;f.screws=[0,1,2,3]}f.panel=null;f.reseat=false});
  }
  if(j.phase==='measure'||j.phase==='verify'){
   const part=type==='test'?value:type;
   if(!parts[part])return no('Ta del trenutno ne zahteva posega.');
   if(!f.held)return no('Vzemi merilno orodje iz kovčka.');
   if(f.isolated||f.opened||f.screws.length||f.drained)return no('Za primerljivo meritev sestavi napravo in obnovi preizkusno stanje.');
   const i=c.tests.findIndex(t=>t.part===part&&t.tool===f.held);
   if(i<0)return no('To orodje na tem delu ne da uporabnega odčitka.');
   return ok(c.tests[i].label,.55,()=>{const list=j.phase==='verify'?j.verified:j.read;if(!list.includes(i))list.push(i);j.last=i});
  }
  if(j.phase!=='procedure')return no('Nadaljuj v delovnem nalogu.');
  if(n===3&&id==='control'){
   if(f.isolated||f.opened||f.screws.length||f.drained)return no('Obnovi stanje za servisni program pri zaprti napravi.');
   if(!has('meter'))return need('meter');
   return ok('Izvedi cikel deblokade pri mirujočem kompresorju',1.45,()=>{f.fixed=true;j.phase='verify';j.last=null});
  }
  if(!f.isolated)return no('Najprej ustavi in zavaruj napravo.');
  if(mechanical.includes(n)&&!f.opened)return no('Odvij in odstrani servisni pokrov.');
  if(wet.includes(n)&&!f.drained)return no('Najprej razbremeni vodni odsek na servisnem bloku.');
  if(f.fixed)return no('Poseg je izveden. Sestavi napravo in preveri delovanje.');
  if(n===0){
   if(id==='filterCap'&&!f.removed)return ok('Primi in izvleci umazan filtrski vložek',1.55,()=>{f.removed=true;f.carry='dirtyCartridge'});
   if(type==='dirty'&&f.removed&&!f.cleaned.includes(+value))return has('brush')?ok('Izperi in skrtači odsek mrežice',.8,()=>{f.cleaned.push(+value)}):need('brush');
   if(id==='cleanFilter'&&f.removed&&f.cleaned.length===3&&!f.carry)return ok('Vzemi opran vložek iz kadi',1.05,()=>{f.carry='cartridge'});
   if(id==='filterSeat'&&f.carry==='cartridge')return ok('Vstavi čist vložek in zatesni ohišje',1.45,()=>{f.fixed=true;f.carry=null});
  }
  if(n===1&&type==='leaf'&&!f.cleaned.includes(+value))return has('brush')?ok('S krtačo odstrani listje z lamel',.8,()=>{f.cleaned.push(+value);f.fixed=f.cleaned.length===3}):need('brush');
  if(n===2&&['oldSensor','newMount'].includes(id)){
   if(!has('driver'))return need('driver');
   if(id==='oldSensor'&&!f.removed)return ok('Snemi tipalo z osončene fasade',.85,()=>{f.removed=true;f.carry='probe'});
   if(id==='newMount'&&f.removed)return ok('Pritrdi tipalo na senčni nosilec',.85,()=>{f.fixed=true;f.carry=null});
  }
  if(n===4||n===5){
   if(id===(n===4?'oldDrive':'oldFlow')&&!f.removed)return has('driver')?ok('Odstrani okvarjeni del',.85,()=>{f.removed=true}):need('driver');
   if(id==='spare'&&f.removed&&!f.spare)return ok('Vzemi ustrezen nadomestni del',.35,()=>{f.spare=true;f.carry=n===4?'drive':'flowPart'});
   if(id===(n===4?'driveSeat':'flowSeat')&&f.spare){
    if(f.turn!==0)return no('Z R ali gumbom Zasuk poravnaj oznaki na delu in ležišču.');
    return ok('Vgradi in pritrdi poravnani del',.85,()=>{f.fixed=true;f.carry=null});
   }
  }
  return no('Poišči mesto naslednjega posega.');
 }
 Object.assign(parts,{radVessel:'Raztezna posoda',radHead:'Termostatska glava',radGauge:'Manometer',emitter:'Radiator',secondaryPump:'Sekundarna obtočna črpalka'});
 Object.assign(labels,{radVessel:'Raztezna posoda',radControl:'Stikalo obtočnega preizkusa',radCup:'Posodica in krpa',radVent:'Odzračevalnik',radPin:'Zatič ventila'});
 labels.regulatorScreen='Zaslon regulatorja';
 jobs.push('Odzrači radiator','Sprosti zatič ventila');
 return {names,jobs,label,target,action,fresh};
})();
