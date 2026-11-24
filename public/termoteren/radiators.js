/* The two service calls deliberately share the same complaint. Values are simulated. */
(() => {
  const calls = [
    {
      title:'Hladna soba na podstrešju', location:'Radovljica', air:true,
      upper:22, lower:36, afterTop:39, afterBottom:34,
      head:'Termostatska glava je odprta. Zgoraj v radiatorju šumi. Drugi radiatorji grejejo normalno.',
      cause:'Zgoraj v radiatorju se je nabral zrak.', effect:'Topla voda je grela samo spodnji del. Zgoraj je bil zrak, zato je radiator dal manj toplote.',
      fix:'Po odzračevanju se je ogrel tudi vrh radiatorja. Šumenja ni več.',
      lesson:'Spodaj topel, zgoraj hladen in šumenje pomeni zrak v radiatorju. Voda pride noter, zrak pa ji ne pusti na vrh.',
      steps:['Ustavi kroženje in počakaj, da se učni radiator ohladi.','Pod odzračevalnik namesti posodico in krpo.','Počasi odpri odzračevalnik in ga zapri, ko priteče enakomeren curek.','Preveri hladni tlak na manometru in tesnost odzračevalnika.','Znova vključi ogrevanje in ponovi meritvi.'],
      reasons:['Ko voda miruje, se zrak zbere na vrhu. Radiator naj se ohladi, da se ne opečeš.','Posodica ujame vodo, ki priteče iz odzračevalnika.','Zrak gre ven na vrhu. Ko priteče enakomeren curek vode, je zraka konec – zapri.','Pri odzračevanju izteče nekaj vode, zato preveri tlak. Če je prenizek, doliješ.','Po zagonu počakaj, da se radiator ogreje, nato izmeri na istih mestih kot prej.']
    },
    {
      title:'Hladna soba v pritličju', location:'Vrhnika', air:false,
      upper:21, lower:21, afterTop:38, afterBottom:33,
      head:'Termostatska glava je na največ. Cev pred ventilom je topla. Zatič pod glavo se po pritisku ne vrne. Drugi radiatorji grejejo.',
      cause:'Zatič pod termostatsko glavo se je čez poletje zataknil in ventil ostal zaprt.',effect:'Topla voda je prišla do ventila, v radiator pa ne. Cel radiator je bil hladen.',
      fix:'Po sprostitvi zatiča voda spet teče skozi radiator. Najprej se je ogrel vrh, nato ves radiator.',
      lesson:'Topla cev pred ventilom in hladen cel radiator pomenita, da se voda ustavi pri ventilu. Preveri, ali se zatič premika.',
      steps:['Ustavi ogrevanje učnega kroga in počakaj na ohladitev.','Snemi termostatsko glavo z nosilca.','Z nežnim pritiskom sprosti zatič in preveri njegovo samodejno vrnitev.','Ponovno namesti termostatsko glavo in odpri ventil za preizkus.','Zaženi ogrevanje in preveri segrevanje radiatorja.'],
      reasons:['Počakaj, da se radiator ohladi, da se ne opečeš.','Sname se samo glava. Ventil ostane zaprt, voda ne izteče.','Zatič rahlo pritisni – mora sam priti nazaj. Ne vleci ga s kleščami, ker poškoduješ tesnilo.','Glavo vrni in nastavi tako kot prej, da bo primerjava poštena.','Po zagonu počakaj, nato izmeri radiator na istih mestih kot prej.']
    }
  ];
  const targets=[['radControl','radCup','radVent','radGauge','radControl'],['radControl','radHead','radPin','radHead','radControl']];
  for (const [i,r] of calls.entries()) {
    const temp={part:'emitter',tool:'thermo',label:'Temperaturi radiatorja po višini',required:true,
      before:'Pri zahtevi za ogrevanje izmeriš zgoraj '+r.upper+' °C in spodaj '+r.lower+' °C.',
      after:'Po 15 simuliranih minutah ogrevanja je zgoraj '+r.afterTop+' °C in spodaj '+r.afterBottom+' °C.'};
    const c={title:r.title,location:r.location,customer:'V tej sobi je hladno. Termostatsko glavo sem odprl do konca, pa še vedno ne greje dovolj.',
      model:'Radiatorski krog z monoblokom',weather:'5 °C · oblačno',source:'https://khrastnik.github.io/akademija-tc/okvare/#radiator',sourceTitle:'Radiator in termostatski ventil',
      tests:[temp,{part:'radHead',tool:'inspect',label:'Lokalni pregled in odziv ventila',required:true,before:r.head,after:r.air?'Šumenja ni več. Glava je odprta, odzračevalnik je suh.':'Glava se odziva na nastavitev, zatič se vrne in spoji so suhi.'},
        {part:'radGauge',tool:'inspect',label:'Tlak na hladnem sistemu',required:false,before:'Zapisnik hladnega kroga in manometer učnega sistema kažeta 1,5 bar.',after:'Pri hladnem kontrolnem preizkusu je tlak 1,5 bar, kot v zapisniku.'}],
      diagnoses:['Zrak v zgornjem delu radiatorja','Zataknjen zatič termostatskega ventila','Obtočna črpalka celotnega objekta miruje'],cause:i,
      repairs:['Sprosti zatič termostatskega ventila','Odzrači radiator in preveri hladni tlak','Zvišaj temperaturo dvižnega voda za celo hišo'],fix:r.air?1:0,
      procedure:[r.steps[0],r.steps.slice(1,4).join(' '),r.steps[4]],explanation:r.lesson,
      station:{...r,targets:targets[i]},lesson:{cause:r.cause,effect:r.effect,fix:r.fix,lesson:r.lesson,questions:{
        'emitter.thermo':'Eno tipalo daj zgoraj, drugo spodaj na isti radiator. Hladen samo vrh pomeni zrak. Hladen cel radiator pomeni, da voda ne pride noter.',
        'radHead.inspect':'Poglej termostatsko glavo, poslušaj radiator in preveri, ali se ventil odpre.',
        'radGauge.inspect':'Preberi tlak vode, ko je sistem hladen, in ga primerjaj z zapisnikom. Tlak velja za vso hišo, ne samo za ta radiator.'
      }}};
    CASES.push(c);
  }
})();
