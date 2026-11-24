/* For each decision the first pair is the supported one. Display order varies by case and stage. */
window.Mentor = (() => {
 const decisions = [
 [
 ['Kako ugotoviš, ali vode res teče premalo ali pa samo vgrajeni merilnik kaže narobe?',
 'Z drugim merilnikom izmerim pretok na cevi, pri isti hitrosti črpalke.','Dva neodvisna merilnika na isti cevi povesta, ali je težava v vodi ali v merilniku.',
 'Isti alarm preberem še v drugem meniju.','Oba menija kažeta podatek istega merilnika. Če ta kaže narobe, kažeta narobe oba.',
 'Zvišam temperaturo vode.','S tem spremeniš pogoje, pretoka pa še vedno nisi izmeril.'],
 ['Katera ugotovitev najbolj natančno pokaže, kje se voda zatika?',
 'Kazalec na filtru je v rdečem polju že pri 6 l/min.','Majhen pretok pove, da se voda nekje zatika. Rdeč kazalec pove, da prav na filtru.',
 'Voda se na poti ohladi za 14 K.','To pove, da teče premalo vode, ne pa, kje se zatika.',
 'Stranka je pred kratkim zamenjala radiatorja.','To je dober namig za pogovor, ni pa meritev.'],
 ['Na drugi hiši je pretok 6 l/min, kazalec na filtru pa zelen. Kaj preveriš?',
 'Ventile in ali črpalka res deluje.','Zelen kazalec pomeni, da filter ni kriv. Vzrok je drugje.',
 'Takoj zamenjam filter.','Zelen kazalec pravi, da filter vode ne ovira.',
 'Rečem, da je pretok normalen.','6 l/min je še vedno premalo za to napravo.']]
 ,[
 ['Zunanja enota je po neurju glasnejša. Kako ugotoviš, zakaj?',
 'Preverim vrtljaje ventilatorja in pogledam, ali je med lamelami prosto.','Ventilator in lamele sta dve različni možni mesti težave. Preveriš obe.',
 'Po zvoku ocenim, ali je motor v redu.','Zvok se spremeni tudi, če zrak težje teče skozi lamele.',
 'Spremenim, kako pogosto naprava odtaja.','S tem ne odkriješ, zakaj naprava odtaja pogosteje.'],
 ['Ventilator ima 675 od zahtevanih 680 vrtljajev, lamele pa so pokrite z listjem. Kaj to pomeni?',
 'Motor dela pravilno, listje pa zapira pot zraku.','Ventilator se lahko vrti pravilno, zrak pa vseeno ne gre skozi.',
 'Zraka je dovolj, saj se ventilator vrti.','Vrtljaji ne povedo, koliko zraka gre skozi zamašene lamele.',
 'Motor je obstal.','Motor se vrti skoraj s polno hitrostjo.'],
 ['Na drugi enoti so lamele čiste, ventilator pa ima 0 vrtljajev, čeprav dobi ukaz. Kaj preveriš?',
 'Motor ventilatorja.','Zdaj je problem v tem, da se ventilator ne vrti.',
 'Še enkrat očistim lamele.','Lamele so že čiste.',
 'Radiatorje v hiši.','Najprej razišči ventilator, ki se ne vrti.']]
 ,[
 ['Naprava neha ogrevati samo ob sončnem poldnevu. Kako to preveriš?',
 'Opoldne primerjam temperaturo na regulatorju s svojim termometrom v senci.','Če meriš hkrati, vreme ne pokvari primerjave.',
 'Zvečer preberem temperaturo enkrat.','Zvečer ni sonca, zato napake ne vidiš.',
 'Svoj termometer položim na toplo steno.','Potem oba merita isto segreto steno in napake ne opaziš.'],
 ['Regulator kaže 21 °C, v senci je 6 °C. Kaj pokaže, če tipalo za nekaj minut zasenčiš?',
 'Ali tipalo greje sonce – njegova temperatura pade proti 6 °C.','Spremenil si samo sonce na tipalu in videl, kako se je spremenila meritev.',
 'Kakšna mora biti nastavitev ogrevanja.','Senčenje ne spremeni nastavitev.',
 'Ali je zamašen filter.','Ta meritev nima zveze z vodo.'],
 ['Na drugi hiši obe temperaturi tudi opoldne kažeta 6 °C, ogrevanje pa vseeno stoji. Kaj preveriš?',
 'Nastavitve regulatorja: urnik in mejo, nad katero neha ogrevati.','Tipalo meri pravilno, zato je vzrok v tem, kako regulator uporabi to temperaturo.',
 'Še enkrat prestavim tipalo.','Tipalo zdaj meri pravilno.',
 'Zamenjam filter.','Za to ni nobenega dokaza.']]
 ,[
 ['Kako ločiš črpalko, ki ne dobi ukaza, od črpalke, ki se je zataknila?',
 'Pogledam ukaz, vrtljaje črpalke in ali voda res teče.','Ukaz pove, kaj regulator želi. Vrtljaji in pretok povedo, kaj se res zgodi.',
 'Poslušam, ali brni.','Brnenje ne pove, ali se črpalka vrti in ali voda teče.',
 'Preberem samo alarm pretoka.','Isti alarm se pokaže v obeh primerih.'],
 ['Črpalka je dobila ukaz, javi zastoj, ima 0 vrtljajev, pretok je 0. Kaj to pomeni?',
 'Črpalka je dobila ukaz, a se ne vrti, zato voda stoji.','Merilnik na cevi potrdi to, kar javlja črpalka.',
 'Regulator ni poslal ukaza.','Črpalka je ukaz dobila.',
 'Kriv je samo merilnik pretoka.','Tudi tvoj merilnik kaže 0 in črpalka se ne vrti.'],
 ['Po sprostitvi se črpalka vrti, merilnik na cevi pa še vedno kaže 0. Lahko zaključiš?',
 'Ne. Preverim, ali je pot vode odprta in ali merilnik prav meri.','Vrtenje črpalke še ni dovolj. Voda mora tudi teči.',
 'Da, črpalka se vrti.','Še vedno ne veš, ali voda pride do radiatorjev.',
 'Da, če izbrišem alarm.','Izbris alarma ne požene vode.']]
 ,[
 ['Kako ugotoviš, kam gre topla voda, ko naprava ogreva hišo?',
 'Izmerim temperaturo cevi proti bojlerju in cevi proti radiatorjem.','Topla cev pokaže, kam voda res teče.',
 'Izmerim samo skupni pretok.','Tam voda še ni razdeljena, zato ne vidiš, kam gre.',
 'Pogledam ikono na zaslonu.','Ikona kaže, kaj naprava želi, ne pa, kaj se res zgodi.'],
 ['Ukaz pride, kazalec na ventilu se ne premakne, ventil pa se z roko premika lahko. Kaj je pokvarjeno?',
 'Motorček, ki premika ventil.','Ventil sam je gibljiv, motorček pa ga ne premakne.',
 'Zataknjen ventil.','Z roko si preveril, da se ventil premika.',
 'Obtočna črpalka.','Voda teče, samo v napačno smer.'],
 ['Na drugi napravi se ventil ne premakne niti z roko. Kaj se spremeni?',
 'Pokvarjen je ventil, ne motorček.','Nov motorček ne more premakniti zataknjenega ventila.',
 'Vseeno zamenjam motorček.','Meritev zdaj kaže na ventil.',
 'Spremenim nastavitve bojlerja.','Nastavitev ne sprosti zataknjenega ventila.']]
 ,[
 ['Zaslon pravi, da voda ne teče. Kako preveriš, ali je to res?',
 'Na isti cevi z drugim merilnikom izmerim, ko črpalka teče in ko stoji.','Če drugi merilnik vidi razliko, vgrajeni pa ne, je kriv vgrajeni.',
 'Isti zaslon preberem trikrat.','Napačen podatek ostane napačen, tudi če ga prebereš večkrat.',
 'Pogledam samo kazalec na filtru.','Kazalec ne pove, koliko vode teče.'],
 ['Tvoj merilnik kaže 18 l/min, vgrajeni pa 0. Kaj je pomembno?',
 'Voda teče, vgrajeni merilnik tega ne zazna.','Dva merilnika na isti cevi, ob istem času, si nasprotujeta – kriv je vgrajeni.',
 'Oba kažeta, da voda stoji.','Tvoj merilnik kaže, da voda teče.',
 'Filter je zamašen.','Voda teče normalno.'],
 ['Na drugi napravi oba merilnika kažeta 0. Kaj preveriš?',
 'Ali se črpalka vrti in ali je pot vode odprta.','Zdaj oba merilnika potrjujeta, da voda res stoji.',
 'Zamenjam vgrajeni merilnik.','Merilnika se tokrat ujemata.',
 'Zaženem kompresor kljub alarmu.','Brez vode bi se naprava poškodovala.']]
 ];
 const radPlan=['Kako ločiš zrak v radiatorju od zaprtega ventila na radiatorju?',
 'Izmerim radiator zgoraj in spodaj ter preverim ventil.','Če je spodaj topel, zgoraj pa hladen, je zgoraj zrak. Če je hladen ves, voda ne pride noter.',
 'Preberem zunanjo temperaturo.','Ta ne pove ničesar o enem radiatorju.',
 'Najprej odzračim, šele nato merim.','Če najprej popraviš, ne veš več, kaj je bilo narobe.'];
 decisions.push([radPlan,
 ['Zgoraj 22 °C, spodaj 36 °C, slišiš šumenje. Kaj to pomeni?',
 'Voda pride v radiator, zgoraj pa je ujet zrak.','Topel spodnji del in šumenje kažeta na zrak. Naslednji korak je odzračevanje.',
 'V radiator sploh ne pride topla voda.','Spodaj je topel, torej voda pride.',
 'Vsi radiatorji potrebujejo toplejšo vodo.','Težava je samo v tej sobi.'],
 ['V drugi sobi je cel radiator hladen, cev pred ventilom pa topla. Kaj preveriš?',
 'Ali se ventil na radiatorju res odpre.','Voda pride do ventila, v radiator pa ne. Krivec je ventil.',
 'Ali je v posodici prostor za še eno odzračevanje.','Za zrak tu ni znakov.',
 'Ali je treba povišati temperaturo v vseh sobah.','Težava je samo v enem radiatorju.']]);
 decisions.push([radPlan,
 ['Zgoraj in spodaj 21 °C, cev pred ventilom topla, zatič se ne vrne. Kje se voda ustavi?',
 'Pri ventilu tega radiatorja.','Topla voda pride do ventila, zataknjen zatič pa ga ne odpre.',
 'Že pri toplotni črpalki.','Drugi radiatorji grejejo, cev pred ventilom je topla.',
 'Samo v zgornjem delu radiatorja.','Hladen je cel radiator, ne le zgornji del.'],
 ['Drug radiator ima gibljiv zatič, spodaj je topel, zgoraj hladen in šumi. Kaj preveriš?',
 'Ali je zgoraj ujet zrak.','Ventil dela, vzorec temperature in šumenje pa kažeta na zrak.',
 'Ali lahko zatič potisnem še močneje.','Zatič je že gibljiv.',
 'Ali je treba zamenjati regulator hiše.','Za to ni nobenega dokaza.']]);
 const stages=['plan','interpret','transfer'];
 const titles=['Pred meritvijo','Razloži svoje meritve','Prenesi znanje na drug primer'];
 function pending(j,c){
   if(c.independent)return null;
   if(j.phase==='measure'&&!j.read.length&&!j.reason?.plan?.done)return 'plan';
   if(j.phase==='measure'&&!j.field?.measurement&&c.tests.every((t,i)=>!t.required||j.read.includes(i))&&!j.reason?.interpret?.done)return 'interpret';
   if(j.phase==='verify'&&!j.field?.measurement&&c.tests.every((t,i)=>!t.required||j.verified.includes(i))&&!j.reason?.transfer?.done)return 'transfer';
   return null;
 }
 function get(n,stage){
   const s=stages.indexOf(stage),row=(CASES[n]?.mentor||decisions[n])[s],shift=(n+2*s+1)%3;
   return {title:titles[s],question:row[0],options:[0,1,2].map(k=>{
     const i=(k+shift)%3;return {label:row[1+i*2],why:row[2+i*2],correct:i===0};
   })};
 }
 return {pending,get,stages};
})();
