/* For each decision the first pair is the supported one. Display order varies by case and stage. */
window.Mentor = (() => {
 const decisions = [
 [
 ['Kateri preizkus loči res premajhen pretok od napake vgrajenega tipala?',
 'Neodvisna meritev na cevi pri isti hitrosti črpalke.','Primerjava z zapisnikom zagona je smiselna, če ohraniš isto nastavitev črpalke.',
 'Odčitavanje istega alarma na drugem meniju.','Oba menija uporabljata isto tipalo, zato se zmota lahko ponovi.',
 'Zvišanje temperature dvižnega voda.','S tem spremeniš pogoje, pretoka pa še vedno nisi izmeril.'],
 ['Katera ugotovitev najbolj natančno pokaže mesto ovire?',
 'Velik padec tlaka prav čez filter pri izmerjenih 6 l/min.','Pretok potrdi težavo, meritev na obeh straneh mrežice pa določi mesto upora.',
 'Razlika temperatur znaša 14 K.','Ta razlika opiše ohladitev vode na poti. Enak rezultat lahko povzroči ovira drugje.',
 'Stranka je pred kratkim zamenjala radiatorja.','To usmerja pogovor, ne dokazuje pa, kje voda izgublja tlak.'],
 ['Na drugi lokaciji izmeriš 6 l/min, indikator filtra pa je zelen. Kaj preveriš naprej?',
 'Položaj ventilov in odziv obtočne črpalke.','Majhen pretok ima več vzrokov. Za čiščenje filtra potrebuješ dokaz, da ovira nastaja tam.',
 'Takoj naročim nov filter.','Zeleni indikator ne podpira velikega padca tlaka na filtru.',
 'Razglasim, da je pretok normalen.','Pretok še vedno primerjaj z zahtevo te naprave.']]
 ,[
 ['Kako preveriš, zakaj je zunanja enota po neurju glasnejša?',
 'Primerjam ukaz z dejanskimi vrtljaji in pregledam prehode za zrak.','Ventilator in prehodi skozi lamele sta ločeni mesti težave.',
 'Ocenim hitrost motorja po glasnosti.','Glasnost je odvisna tudi od zračnih ovir in razdalje.',
 'Spremenim interval odtajevanja.','S spremembo nastavitve še ne odkriješ vzroka pogostega odtajevanja.'],
 ['Ventilator doseže 675 od 680 vrt/min. Kaj to pove ob prekritih lamelah?',
 'Motor sledi ukazu, listje pa omejuje prehod zraka.','Vrtljaji in količina zraka skozi zamašen izmenjevalnik sta različni stvari.',
 'Pretok zraka je gotovo normalen.','Vrtljaji niso meritev pretoka zraka skozi lamele.',
 'Motor je obstal.','Povratni signal kaže skoraj zahtevano hitrost.'],
 ['Lamele na drugi enoti so čiste. Ob ukazu 680 vrt/min odziv ostane 0. Kam usmeriš pregled?',
 'V pogon ventilatorja in njegov povratni signal.','Spremenil se je odločilni dokaz. Sedaj je sporen odziv na ukaz.',
 'V ponovno čiščenje lamel.','Čiste lamele ne pojasnijo ničelnih vrtljajev.',
 'V radiatorje.','Najprej pojasni neposredno izmerjeno neskladje na ventilatorju.']]
 ,[
 ['Kako preveriš, zakaj ogrevanje odpove samo ob sončnem poldnevu?',
 'Takrat primerjam prikaz regulatorja z neodvisno meritvijo zraka v senci.','Hkratni meritvi zmanjšata vpliv spreminjanja vremena.',
 'Zvečer preberem en sam odčitek.','Ko sonca več ni, lahko izgine tudi napaka.',
 'Termometer položim na segreto fasado.','Oba senzorja bi bila izpostavljena istemu lokalnemu segrevanju.'],
 ['Regulator kaže 21 °C, v senci je 6,1 °C. Kaj doda začasno senčenje tipala?',
 'Približevanje referenci pokaže vpliv sonca na merilno mesto.','Spremenil si izpostavljenost tipala in opazoval, kako se je spremenil odčitek.',
 'Določi pravi naklon ogrevalne krivulje.','Senčenje ne spreminja nastavitve krivulje.',
 'Potrdi zamašitev filtra.','Ti meritvi ne vključujeta vodnega kroga.'],
 ['Naslednjič obe temperaturi tudi opoldne kažeta 6 °C, ogrevanje pa miruje. Kaj preveriš?',
 'Zahtevo, časovni program in mejo ogrevanja na regulatorju.','Meritvi se ujemata, zato preveri, kako regulator uporablja ta podatek.',
 'Ponovno prestavim zunanje tipalo.','Primerjava trenutno ne kaže napake merilnega mesta.',
 'Zamenjam filter.','Za poseg v filter bi najprej potreboval dokaze iz vodnega kroga.']]
 ,[
 ['Kako ločiš črpalko brez ukaza od črpalke z blokiranim rotorjem?',
 'Primerjam ukaz, odziv pogona in dejanski pretok.','Ukaz pokaže namen regulatorja, vrtljaji in voda pa odziv naprave.',
 'Poslušam le brnenje.','Zvok sam ne potrdi vrtenja in pretoka.',
 'Preberem samo alarm pretoka.','Isti alarm lahko spremlja obe možnosti.'],
 ['Kaj pomeni kombinacija prejetega ukaza, javljene blokade, 0 vrt/min in 0 l/min?',
 'Pogon je prejel ukaz, rotor se ne vrti in voda res miruje.','Neodvisna meritev pretoka podpira ugotovitev v diagnostiki pogona.',
 'Regulator sploh ni poslal ukaza.','Pogon je njegov ukaz zabeležil.',
 'Težava je samo v tipalu pretoka.','Tudi neodvisni instrument kaže nič in rotor se ne vrti.'],
 ['Po servisnem ciklu ima rotor vrtljaje, zunanji merilnik pa še vedno kaže 0. Lahko zaključiš?',
 'Ne. Preverim pogoje meritve in prehodnost vodnega kroga.','Gibanje rotorja je le del potrditve. Voda mora tudi krožiti.',
 'Da. Dovolj je, da se rotor vrti.','Še vedno manjka dokaz, da voda doseže ogrevala.',
 'Da, če izbrišem alarm.','Brisanje alarma ne obnovi pretoka.']]
 ,[
 ['Kako ugotoviš, kam gre toplota ob zahtevi za radiatorje?',
 'Primerjam temperaturi obeh vej po preklopu.','Meritvi pokažeta dejansko pot toplote glede na ukaz.',
 'Izmerim samo skupni pretok pred razcepom.','Tam se poti še nista razdelili.',
 'Pogledam le ikono radiatorja na regulatorju.','Ikona kaže zahtevo, ventil pa je morda ni izvedel.'],
 ['Ukaz pride, kazalnik miruje, gred pa je prosta. Kateri del je osumljen?',
 'Pogon, ki mora ukaz spremeniti v premik.','Prosta gred zoži napako na pogon oziroma njegov prenos.',
 'Telo ventila z zagozdeno gredjo.','Preizkus je že pokazal, da se gred lahko premakne.',
 'Obtočna črpalka brez ukaza.','Toplota doseže bojler in ukaz za preklop je prisoten.'],
 ['Na drugem ventilu je tudi po odstranitvi pogona gred blokirana. Kaj se spremeni?',
 'Pregled usmerim v mehanski del ventila.','Nov pogon sam ne more popraviti blokirane gredi.',
 'Ponovim menjavo pogona brez dodatnega pregleda.','Sedanji dokaz kaže mehansko oviro tudi brez pogona.',
 'Spremenim nastavitev bojlerja.','Nastavitev ne sprosti blokirane gredi.']]
 ,[
 ['Kako preizkusiš trditev regulatorja, da je pretok nič?',
 'Na isti cevi z drugim merilnikom primerjam tek in mirovanje.','Obe stanji pokažeta, ali instrument sploh zazna spremembo.',
 'Isti odčitek preberem trikrat.','Ponovljiv napačen signal ostaja napačen.',
 'Pregledam samo barvo indikatorja filtra.','Indikator meri padec tlaka in ne daje neodvisnega odčitka pretoka.'],
 ['Med tekom zunanji instrument kaže 18 l/min, napajano notranje tipalo pa 0. Kaj je bistveno?',
 'Voda kroži, notranji signal pa ji ne sledi.','Na isti cevi in ob istem ukazu si primerjal dva neodvisna podatka.',
 'Obe meritvi potrjujeta zastoj.','Zunanji instrument je izmeril tok vode.',
 'Filter je nujno zamašen.','Zunanji pretok ustreza obtočnemu preizkusu.'],
 ['Ob ponovitvi oba merilnika pri ukazu črpalki pokažeta nič. Kaj preveriš najprej?',
 'Ali se črpalka vrti in ali je vodna pot odprta.','Zdaj tudi neodvisna meritev podpira resničen zastoj.',
 'Menjam notranje tipalo na podlagi alarma.','Instrumenta se tokrat ujemata.',
 'Zaženem kompresor mimo zaščite.','Pogoj za zagon ostaja nepotrjen.']]
 ];
 const radPlan=['Kako bi ločil zrak v enem radiatorju od zaprtega dovoda do njega?',
 'Izmerim radiator zgoraj in spodaj ter preverim ventil.','Vzorec po višini pokaže, ali se del radiatorja že ogreva. Lokalni pregled nato pomaga razložiti vzorec.',
 'Preberem samo temperaturo zunanjega zraka.','Ta vpliva na ogrevanje objekta kot celote. Ne loči dveh lokalnih napak.',
 'Najprej odzračim in šele nato izmerim.','Poseg bi spremenil prvotno stanje in izgubil bi del dokazov.'];
 decisions.push([radPlan,
 ['Zgoraj 22 °C, spodaj 36 °C, slišiš šumenje. Katera razlaga poveže te podatke?',
 'Topla voda doseže spodnji del, zgoraj je lahko ujet zrak.','Vzorec in zvok podpirata odzračevanje kot naslednji poseg.',
 'V radiator gotovo sploh ne priteka topla voda.','Topel spodnji del po ustaljenem ogrevanju govori proti popolnoma zaprtemu dovodu.',
 'Vsi radiatorji potrebujejo višjo temperaturo dovoda.','Težava se pojavlja v enem prostoru.'],
 ['V drugi sobi je cel radiator hladen, cev pred odprto glavo pa topla. Kaj preveriš pred odzračevanjem?',
 'Ali ventil ob odpiranju res spusti vodo.','Temperaturni vzorec se je spremenil. Poišči dokaz za lokalno zaporo.',
 'Ali je v posodici dovolj prostora za še eno odzračevanje.','Za ta poseg še nimaš enakega dokaza kot prej.',
 'Ali je v vseh sobah treba zvišati nastavitev.','Imamo lokalno težavo.']],[radPlan,
 ['Obe mesti kažeta 21 °C, cev pred ventilom je topla, zatič se ne vrne. Kje se ustavi dovod?',
 'Pri ventilu tega radiatorja.','Toplota prispe pred ventil, zatič pa ne omogoči odprtja.',
 'Že pri toplotni črpalki.','Drugi radiatorji grejejo in dovod do ventila je topel.',
 'Samo v zgornjem delu radiatorja.','Temperaturi zgoraj in spodaj sta enaki in obe nizki.'],
 ['Drug radiator ima gibljiv zatič, spodaj je topel, zgoraj hladen in šumi. Kaj preveriš?',
 'Ali je v zgornjem delu ujet zrak.','Gibljiv ventil in topel spodnji del spremenita prvotno diagnozo.',
 'Ali lahko zatič še močneje potisnem.','Preizkus je že potrdil gibljivost zatiča.',
 'Ali je treba zamenjati regulator cele hiše.','Lokalni vzorec za to ne daje dokaza.']]);
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
   const s=stages.indexOf(stage),row=decisions[n][s],shift=(n+2*s+1)%3;
   return {title:titles[s],question:row[0],options:[0,1,2].map(k=>{
     const i=(k+shift)%3;return {label:row[1+i*2],why:row[2+i*2],correct:i===0};
   })};
 }
 return {pending,get,stages};
})();
