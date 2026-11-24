/* The two service calls deliberately share the same complaint. Values are simulated. */
(() => {
  const calls = [
    {
      title:'Hladna soba na podstrešju', location:'Radovljica', air:true,
      upper:22, lower:36, afterTop:39, afterBottom:34,
      head:'Glava je odprta. Zgoraj se sliši pretakanje. Na preostalih radiatorjih stranka težave ne opaža.',
      cause:'V zgornjem delu radiatorja se je ujel zrak.', effect:'Voda je ogrevala spodnji del, zgoraj pa je ostal hladen žep. Radiator je v prostor oddajal manj toplote.',
      fix:'Po odzračenju, preverjanju hladnega tlaka in ponovnem zagonu se je ogrel tudi vrh. Šumenje je prenehalo.',
      lesson:'Kadar je spodaj toplo, zgoraj pa hladno, voda vsaj deloma priteka. Razlika po višini in šumenje skupaj usmerjata pregled k zraku v radiatorju.',
      steps:['Ustavi kroženje in počakaj, da se učni radiator ohladi.','Pod odzračevalnik namesti posodico in krpo.','Počasi odpri odzračevalnik in ga zapri, ko priteče enakomeren curek.','Preveri hladni tlak na manometru in tesnost odzračevalnika.','Znova vključi ogrevanje in ponovi meritvi.'],
      reasons:['Mirujoča voda omogoči zbiranje zraka na vrhu. Vaja s časovnim preskokom ohladi radiator pred odpiranjem.','Zadržiš iztekajočo vodo in vidiš, kdaj začne teči enakomerno.','Zrak zapušča najvišjo točko. Enakomeren curek je znak, da lahko odzračevalnik zapreš.','Pri odzračevanju izteče tudi nekaj vode. Primerjaj hladni tlak z zapisnikom tega sistema in poglej, ali priključek ostaja suh.','Po zagonu temperatura potrebuje čas. Vaja preskoči 15 minut, preden primerjaš ista merilna mesta.']
    },
    {
      title:'Hladna soba v pritličju', location:'Vrhnika', air:false,
      upper:21, lower:21, afterTop:38, afterBottom:33,
      head:'Glava je nastavljena na največ. Dovod pred ventilom je topel. Pri funkcijskem preizkusu se zatič po sprostitvi ne vrne. Drugi radiatorji grejejo.',
      cause:'Zatič pod termostatsko glavo je po mirovanju obtičal v zaprtem položaju.',effect:'Topla voda je prišla do ventila, v radiator pa ni vstopila. Ves radiator je ostal blizu sobne temperature.',
      fix:'Po sprostitvi zatiča in vrnitvi glave je skozi radiator spet stekla voda. Pri ponovljenem preizkusu se je najprej ogrel vrh radiatorja.',
      lesson:'Topla cev pred ventilom potrjuje dovod do ventila. Za odločitev o posegu potrebuješ še temperaturo radiatorja in preizkus gibljivosti zatiča.',
      steps:['Ustavi ogrevanje učnega kroga in počakaj na ohladitev.','Snemi termostatsko glavo z nosilca.','Z nežnim pritiskom sprosti zatič in preveri njegovo samodejno vrnitev.','Ponovno namesti termostatsko glavo in odpri ventil za preizkus.','Zaženi ogrevanje in preveri segrevanje radiatorja.'],
      reasons:['Pred delom naj se dostopni vroči deli ohladijo. Vaja preskoči čas ohlajanja.','Za dostop do zatiča se sname le suha termostatska glava. Telo ventila ostane zatesnjeno.','Zatič mora po rahlem pritisku sam priti nazaj. Njegova povratna pot omogoči odpiranje ventila; vlečenje s kleščami lahko poškoduje tesnilo.','Glava mora po montaži znova upravljati ventil. Za primerljivo meritev nastavi enako zahtevo kot na začetku.','Vaja preskoči 15 minut ogrevanja. Ponovi kontaktni meritvi na istih mestih in preveri, da je toplota prišla v radiator.']
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
        'emitter.thermo':'Pritrdi kontaktni sondi zgoraj in spodaj na istem radiatorju. Če voda vstopa le v del radiatorja, bo temperaturni vzorec drugačen, kot če je zaprt celoten dovod.',
        'radHead.inspect':'S svetilko preglej termostatsko glavo, poslušaj radiator in preveri odziv ventila. Išči neodvisen dokaz za razlago obeh temperatur.',
        'radGauge.inspect':'Primerjaj hladni tlak z zapisnikom te naprave. Skupni tlak dopolni lokalni pregled; iz njega samega ne moreš določiti, kaj je narobe v eni sobi.'
      }}};
    CASES.push(c);
  }
})();
