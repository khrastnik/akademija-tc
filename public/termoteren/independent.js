/* Adapted from Akademija TČ, Teren / Napačna ogrevalna krivulja.
   Commissioning records and numbers are specific to this simulated installation. */
CASES.push({
 title:'Obisk v Tržiču',location:'Tržič',model:'Monoblok z vremensko regulacijo',weather:'4 °C · oblačno',
 customer:'Že tretji dan imamo v vseh sobah okoli 18 stopinj. Prej smo imeli 21. Topla voda je kot običajno in na zaslonu ni nobene napake.',
 source:'https://khrastnik.github.io/akademija-tc/teren/?vaja=krivulja',sourceTitle:'Ogrevalna krivulja',
 independent:true,decisive:4,referenceOffset:0,
 reportDiagnosis:'Naprava je zahtevo dosegla. Zapisnik za iste zunanje pogoje predvideva 36 °C. Razlika se je pojavila že v zahtevi regulatorja.',
 reportCheck:'S tem si preveril tako novo zahtevo kot odziv naprave.',
 tests:[
  {part:'pump',tool:'flow',label:'Pretok ogrevalnega kroga',before:'18 l/min pri isti nastavitvi obtočne črpalke kot ob zagonu, ko so izmerili 18 l/min.',after:'Pri isti nastavitvi je pretok še vedno 18 l/min.',
   display:{title:'ULTRAZVOK',points:['up','down'],rows:[['Pretok','l/min',18,18]]}},
  {part:'control',tool:'inspect',label:'Nastavitve in zapisnik zagona',required:true,
   before:'Ob zagonu je bil pri zunanji temperaturi 4 °C predviden dvižni vod 36 °C. Zapisani vzporedni odmik je 0 K. Na regulatorju je trenutno −6 K. Naklon, urnik in sobna zahteva ustrezajo zapisniku. Zunanje tipalo kaže 4 °C.',
   after:'Regulator in zapisnik zagona se ujemata. Odmik je 0 K, naklon in urnik sta ostala enaka.'},
  {part:'sensor',tool:'thermo',label:'Zunanja temperatura v senci',before:'Referenčna sonda v senci izmeri 4 °C.',after:'Ob kontrolnem preizkusu zunanja referenca še vedno kaže 4 °C.',
   display:{title:'ZUNANJI ZRAK',points:['air'],rows:[['Senca','°C',4,4]]}},
  {part:'hydro',tool:'thermo',label:'Kontaktni temperaturi cevi',before:'Dvižni vod ima 30 °C, povratni 26 °C. Sistem ogreva prostore.',after:'Po 20 simuliranih minutah je dvižni vod pri 36 °C, povratni pri 31 °C.',
   display:{title:'KONTAKTNI SONDI',points:['supply','return'],rows:[['Dvižni','°C',30,36],['Povratni','°C',26,31]]}},
  {part:'control',tool:'meter',label:'Zahtevana in dosežena temperatura dvižnega voda',required:true,
   before:'Pri zunanji temperaturi 4 °C med ustaljenim ogrevanjem regulator zahteva 30 °C in naprava dosega 30 °C.',after:'Pri istih 4 °C zahteva po popravku znaša 36 °C. Po 20 simuliranih minutah naprava doseže 36 °C.',
   display:{title:'DVIŽNI VOD',points:[],rows:[['Zahteva','°C',30,36],['Doseženo','°C',30,36]]}},
  {part:'filter',tool:'inspect',label:'Indikator na vodnem filtru',before:'Med ogrevanjem je indikator padca tlaka v zelenem območju.',after:'Indikator je tudi po posegu v zelenem območju.'}
 ],
 diagnoses:['Oviran pretok skozi vodni filter','Prenizek vzporedni odmik ogrevalne krivulje','Naprava pri obremenitvi ne dosega zahtevane temperature'],
 cause:1,repairs:['Obnovi zabeleženi odmik in ohrani naklon','Zvišaj hitrost obtočne črpalke','Povečaj naklon ogrevalne krivulje'],fix:0,
 procedure:['Preberi vrednost iz zapisnika zagona.','S servisnim terminalom na regulatorju vnesi vzporedni odmik v kelvinih.','Ponovi preizkus pri enaki zunanji temperaturi.'],
 hints:{
  measure:['Kje se izgubi toplota, če je podobno hladno v vseh prostorih? Poskusi ločiti težavo pri skupni oskrbi od težave pri posameznem radiatorju.',
   'Preden spremeniš nastavitev, loči dve možnosti: naprava morda ne doseže svoje zahteve ali pa že regulator zahteva premalo.',
   'Na regulator priključi servisni terminal in primerjaj zahtevo z doseženo temperaturo. S svetilko preberi še zapisnik zagona pri enaki zunanji temperaturi.'],
  verify:['Ponovi meritev, na kateri je temeljila tvoja diagnoza. Primerjaj rezultat pri enakih pogojih.','Na regulatorju preveri zahtevo in doseženo vrednost. Primerjaj še shranjeno nastavitev z zapisnikom.']
 },
 lesson:{cause:'Vzporedni odmik je bil nastavljen na −6 K namesto zagonskih 0 K. Regulator je pri enaki zunanji temperaturi zato zahteval hladnejšo vodo.',
  effect:'Naprava je dosegala svojo zahtevo, radiatorji pa so pri nižji temperaturi v prostore oddajali premalo toplote. Alarm se ni sprožil.',
  fix:'Obnovitev odmika je dvignila zahtevo. Po 20 simuliranih minutah ji je sledila voda v dvižnem vodu. Temperaturo prostorov bi pri dejanskem servisu preveril znova čez nekaj ur.',
  lesson:'Hladna cev sama ne pove, ali napravi manjka moč. Primerjaj, kaj regulator zahteva, kaj naprava doseže in kaj je bilo za iste pogoje predvideno ob zagonu.'}
});

// Four-port buffer. Flow settings and temperatures refer to this commissioning record.
CASES.push({
 title:'Obisk v Žireh',location:'Žiri',model:'Monoblok z zalogovnikom',weather:'4 °C · oblačno',
 customer:'V vseh sobah je okoli 18 stopinj, prej jih je bilo 21. Tako je že nekaj dni. Vode za prhanje ne zmanjka in na zaslonu ni opozorila.',
 source:'https://khrastnik.github.io/akademija-tc/okvare/#sekundarna',sourceTitle:'Sekundarna obtočna črpalka',
 independent:true,decisive:3,
 reportDiagnosis:'Radiatorska veja je odvzemala več vode, kot jo je v istem ciklu dovajala toplotna črpalka. Hladnejši izstop proti radiatorjem potrdi učinek mešanja.',
 reportCheck:'Sekundarni pretok se zdaj ujema s projektnim za ta objekt. Kontrolni temperaturi pokažeta, ali do radiatorjev pride toplejša voda.',
 tests:[
  {part:'control',tool:'meter',label:'Zahtevana in dosežena temperatura dvižnega voda',required:true,
   before:'Pri 4 °C zunaj regulator zahteva 36 °C. Tipalo ob izstopu iz toplotne črpalke kaže 36 °C.',after:'Pri istih zunanjih pogojih sta zahteva in dosežena temperatura še vedno 36 °C.',
   display:{title:'DVIŽNI VOD',points:[],rows:[['Zahteva','°C',36,36],['Doseženo','°C',36,36]]}},
  {part:'control',tool:'inspect',label:'Nastavitve in zapisnik zagona',
   before:'Zagonski list za 4 °C zunaj določa 36 °C na izstopu, odmik 0 K, primarni pretok 15 l/min in sekundarni 14 l/min pri stopnji II. Trenutni odmik je 0 K, naklon in urnik ustrezata zapisniku.',
   after:'Nastavitve ogrevalne krivulje so enake kot pred posegom. Zagonska pretoka sta 15 in 14 l/min.'},
  {part:'pump',tool:'flow',label:'Pretok med toplotno črpalko in zalogovnikom',required:true,
   before:'Primarni krog med ustaljenim ogrevanjem dovaja 15 l/min v zalogovnik.',after:'Na istem odseku pri ustaljenem ogrevanju izmeriš 15 l/min.',
   display:{title:'PRIMARNI KROG',points:['up','down'],rows:[['Primarni','l/min',15,15]]}},
  {part:'secondaryPump',tool:'flow',label:'Pretok v veji proti radiatorjem',required:true,
   before:'Iz zalogovnika proti radiatorjem med istim ogrevalnim ciklom teče 30 l/min.',after:'Iz zalogovnika proti radiatorjem zdaj teče 14 l/min.',
   display:{title:'RADIATORSKI KROG',points:['secUp','secDown'],rows:[['Sekundarni','l/min',30,14]]}},
  {part:'hydro',tool:'thermo',label:'Temperaturi dovodov ob zalogovniku',required:true,
   before:'Prva sonda na vstopu iz toplotne črpalke pokaže 36 °C. Druga na izstopu proti radiatorjem pokaže 31 °C. Obe cevi sta dvižna voda.',
   after:'Po 20 simuliranih minutah je na vstopu 36 °C, na izstopu proti radiatorjem 35,8 °C.',
   display:{title:'DOVODA OB HRANILNIKU',points:['bufferIn','bufferOut'],rows:[['Iz TČ','°C',36,36],['V radiatorje','°C',31,35.8]]}},
  {part:'secondaryPump',tool:'inspect',label:'Oznake na obtočni črpalki',before:'Izbirnik radiatorske črpalke kaže III. Na servisni kartici sta zapisani stopnja II in cilj 14 l/min pri odprtih vejah. Ventili so v preizkusnem položaju.',after:'Izbirnik je na stopnji II, kot je zapisano na servisni kartici.'},
  {part:'sensor',tool:'thermo',label:'Zunanja temperatura v senci',before:'Referenčni termometer kaže 4 °C. Zunanje tipalo regulatorja kaže 4 °C.',after:'Referenčni in prikazani zunanji temperaturi se ujemata pri 4 °C.',
   display:{title:'ZUNANJI ZRAK',points:['air'],rows:[['Senca','°C',4,4]]}}
 ],
 diagnoses:['Prenizek vzporedni odmik ogrevalne krivulje','Omejena moč toplotne črpalke','Previsok sekundarni pretok povzroča mešanje v zalogovniku'],
 cause:2,repairs:['Povečaj odmik ogrevalne krivulje','Obnovi projektno stopnjo sekundarne črpalke','Znižaj temperaturo priprave sanitarne vode'],fix:1,
 procedure:['Na servisni kartici preveri predvideno stopnjo in ciljni pretok radiatorske veje.','Na sekundarni črpalki nastavi stopnjo iz zapisnika.','Ponovi meritve na istih mestih po ustalitvi.'],
 adjustment:{target:'secondaryPump',tool:'inspect',open:'Odpri izbirnik stopnje',instruction:'Pojdi do sekundarne črpalke in nastavi stopnjo po njeni servisni kartici.',title:'Sekundarna črpalka · izbirnik stopnje',expected:2},
 hints:{
  measure:['Najprej določi, ali naprava pripravi toliko toplote, kot od nje zahteva regulator. Nato preveri, kaj pride do ogreval.',
   'Sledi obema dvižnima vodoma ob zalogovniku. Izmeri temperaturo na strani toplotne črpalke in na strani radiatorjev v istem ciklu.',
   'Če se temperaturi razlikujeta, na vsakem krogu posebej izmeri še pretok. Primerjaj litražo na minuto in zagonski zapisnik.'],
  procedure:['Na kartici sekundarne črpalke poišči projektno stopnjo. Po nastavitvi učinek preveri z instrumentoma.'],
  verify:['Ponovi primerjavo obeh pretokov in temperatur na obeh straneh zalogovnika pri enaki zahtevi za ogrevanje.']
 },
 evidenceQuestion:'Kateri odčitek bi primerjal s primarnim pretokom, da preveriš mešanje v zalogovniku?',
 weakEvidence:'Ta podatek sam ne pokaže, koliko vode radiatorska veja odvzema iz zalogovnika. Lahko se vrneš na teren.',
 missingEvidence:'Za utemeljitev poveži zahtevo in odziv naprave s pretokoma obeh krogov ter temperaturama ob zalogovniku.',
 verifyPrompt:'Pred zaključkom ponovno primerjaj odziv naprave, oba pretoka in obe temperaturi dovodov.',
 lesson:{cause:'Sekundarna črpalka je na stopnji III proti radiatorjem črpala 30 l/min, toplotna črpalka pa je dovajala 15 l/min. Razliko je v štiricevnem zalogovniku nadomestila hladnejša povratna voda.',
  effect:'Naprava je dovajala zahtevanih 36 °C. Zaradi primešane povratne vode je v radiatorje pritekala voda s 31 °C. Prostori so se ogrevali slabše.',
  fix:'Po vrnitvi na projektno stopnjo II je sekundarni pretok znašal 14 l/min, primarni pa 15 l/min. Razlika med dovodoma se je po ustalitvi zmanjšala s 5 na 0,2 °C. Učinek na sobno temperaturo bi preveril čez nekaj ur.',
  lesson:'Pri dveh obtočnih krogih izmeri vsak pretok posebej. Odčitek na izstopu iz toplotne črpalke še ne pove, kako topla voda vstopa v radiatorje.'},
 comparison:{title:'Kako ločiš Žiri od Tržiča?',
  tržič:'Pri 4 °C zunaj je bil projektni dvižni vod 36 °C, regulator pa je zahteval le 30 °C. Naprava je teh 30 °C dosegla. Zapisnik je pokazal odmik −6 K namesto 0 K.',
  žiri:'Pri istih zunanjih pogojih je regulator zahteval projektnih 36 °C in naprava jih je dosegla. Temperatura se je znižala šele med dovodom v zalogovnik in izstopom proti radiatorjem.',
  rule:'Najprej primerjaj projektno, zahtevano in doseženo temperaturo. Če odstopa že zahteva, preveri regulacijo. Če so vse tri skladne, sledi vodi do radiatorjev in primerjaj pretoka na obeh straneh zalogovnika.'}
});
