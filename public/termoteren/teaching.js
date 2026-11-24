/* Each question is shown before the measurement. Conclusions appear in the signed-off report. */
window.ServiceLesson = (() => {
  const lessons = [
    {
      questions: {
        'pump.flow': 'Z ultrazvočnim merilnikom preveriš, koliko vode dejansko kroži. Primerjaj pretok z zapisnikom zagona pri isti nastavitvi črpalke.',
        'filter.inspect': 'S svetilko preberi indikator na filtru. Pokaže razliko tlaka pred mrežico in za njo. Tako preveriš, ali voda težko prehaja prav skozi filter.',
        'control.meter': 'Na terminalu odpri zadnji cikel. V njem vidiš, kaj se je dogajalo tik pred izklopom, tudi če naprava zdaj miruje.',
        'valve.inspect': 'Poglej oznaki položaja na obeh servisnih ventilih. Delno zaprt ventil lahko omeji pretok tudi pri delujoči črpalki.',
        'hydro.thermo': 'T1 pritrdi na cev, ki vodi ogreto vodo proti radiatorjem, T2 pa na cev, po kateri se vrača. Razlika pove, za koliko se voda na poti ohladi.'
      },
      cause: 'Nečistoče so zamašile mrežico filtra na povratnem vodu. Indikator je pokazal velik padec tlaka že pri majhnem pretoku.',
      effect: 'Skozi radiatorje je krožilo premalo vode, zato so ostali mlačni. Zaščita je nato prekinila ogrevanje.',
      fix: 'Po čiščenju in ponovni vgradnji vložka se je pretok pri isti nastavitvi črpalke vrnil s 6 na 19 l/min. Indikator je prešel v zeleno polje.',
      lesson: 'Majhen pretok pove, da voda težko kroži. Šele primerjava tlaka na obeh straneh filtra pokaže, da je ovira v njegovi mrežici.'
    },
    {
      questions: {
        'coil.inspect': 'S svetilko preglej sesalno stran uparjalnika. Zrak mora skozi ozke prehode med lamelami, da lahko naprava iz okolice prevzame toploto.',
        'fan.meter': 'Na terminalu primerjaj zahtevane in dejanske vrtljaje ventilatorja. Tako preveriš, ali se odziva na ukaz, četudi se sliši glasneje kot običajno.',
        'control.meter': 'Temperaturo uparjanja primerjaj pri podobni zunanji temperaturi in moči. Tako lahko oceniš, kako se je po posegu spremenil prenos toplote iz zraka.',
        'pump.flow': 'Izmeri še pretok vode. Če se ujema z zapisnikom zagona, lahko preiskavo usmeriš na zračno stran naprave.'
      },
      cause: 'Mokro listje je prekrilo dve tretjini sesalne površine uparjalnika. Ventilator je dosegel 675 od zahtevanih 680 vrt/min.',
      effect: 'Skozi lamele je šlo premalo zraka. Naprava je iz zraka dobivala manj toplote in je pogosteje odtajala.',
      fix: 'Po odstranitvi listja so bili prehodi med lamelami prosti. Pri primerljivih pogojih se je temperatura uparjanja dvignila z −12 °C na −3 °C.',
      lesson: 'Ventilator se lahko pravilno vrti tudi ob zaprtih prehodih za zrak. Pred odločitvijo o menjavi motorja preveri vrtljaje in preglej površino izmenjevalnika.'
    },
    {
      questions: {
        'control.meter': 'Na terminalu preberi zunanjo temperaturo, ki jo uporablja regulator. Primerjaj jo z mejo, nad katero regulator prekine ogrevanje.',
        'sensor.thermo': 'Sondo termometra postavi v senco, stran od segrete stene. Tako dobiš neodvisno meritev zraka za primerjavo s prikazom regulatorja.',
        'control.inspect': 'Nastavitve ogrevalne krivulje primerjaj z zapisnikom zagona. Preverjaš, ali je kdo spremenil način, kako regulator določa temperaturo vode.'
      },
      cause: 'Sonce je segrelo steno in zunanje tipalo. Regulator je prikazal 21 °C, v senci pa je bilo 6,1 °C.',
      effect: 'Odčitek je presegel nastavljeno mejo ogrevanja 18 °C. Regulator je opoldne ustavil ogrevanje, čeprav je bilo zunaj še hladno.',
      fix: 'Po prestavitvi tipala v senco je regulator pokazal 6,3 °C in spet dovolil ogrevanje. Referenčni termometer je pokazal 6,1 °C.',
      lesson: 'Če se težava pojavlja le ob določeni uri, ponovi meritev takrat. S primerjavo v senci preveri vpliv sonca, preden spremeniš ogrevalno krivuljo.'
    },
    {
      questions: {
        'pump.meter': 'Preveri tri podatke pogona: ali je dobil ukaz, kakšno hitrost sporoča in ali je zaznal blokado. Ukaz za vklop sam še ne potrdi vrtenja.',
        'pump.flow': 'Z merilnikom na cevi preveri, ali se med ukazom črpalki voda res premika. Tako podatek pogona primerjaš z neodvisno meritvijo.',
        'valve.inspect': 'Preglej položaj ventilov in tlak vode. Tako preveriš pogoje v krogu, preden iščeš vzrok v pogonu črpalke.'
      },
      cause: 'Po poletnem mirovanju je rotor obtičal. Pogon je prejel ukaz, javil blokado in sporočil 0 vrt/min.',
      effect: 'Obtočna črpalka ni pognala vode. Neodvisni merilnik je med ukazom pokazal 0 l/min in ogrevanje se ni zagnalo.',
      fix: 'Vgrajeni program tega učnega modela je sprostil rotor. Pogon je nato dosegel 2100 vrt/min, na cevi pa je merilnik pokazal 18 l/min.',
      lesson: 'Pri alarmu pretoka ločeno preveri ukaz, gibanje rotorja in tok vode. Po posegu potrdi tako vrtenje kot dejanski pretok.'
    },
    {
      questions: {
        'control.meter': 'Na regulatorju preveri, kam trenutno zahteva dovod toplote. To je izhodišče za primerjavo s položajem ventila in temperaturama cevi.',
        'valve.thermo': 'Eno sondo daj na cev proti bojlerju, drugo na cev proti radiatorjem. Po preklopu spremljaj, katera veja se ogreva.',
        'valve.inspect': 'Primerjaj ukaz s kazalnikom položaja. S simuliranim preizkusom gibljivosti gredi nato ločiš težavo pogona od mehanske blokade ventila.',
        'pump.flow': 'S skupnim pretokom pred razcepom preveriš, ali voda kroži. Za določitev smeri moraš preveriti še obe veji.'
      },
      cause: 'Pogon tripotnega ventila je prejel ukaz za ogrevanje radiatorjev, vendar ventila ni preklopil. Gred se je pri preizkusu prosto premikala.',
      effect: 'Toplota je še naprej tekla proti bojlerju. Tam je imela cev 44 °C, veja proti hladnim radiatorjem pa le 22 °C.',
      fix: 'Po menjavi pogona je kazalnik sledil ukazu v obe smeri. Pri zahtevi za ogrevanje se je cev proti radiatorjem ogrela na 39 °C.',
      lesson: 'Temperaturi cevi pokažeta, kam gre toplota. Primerjava ukaza, kazalnika in gibljivosti gredi ti pove, kateri del ventila potrebuje poseg.'
    },
    {
      questions: {
        'sensor.meter': 'Na terminalu preberi signal vgrajenega merilnika med tekom in po ustavitvi črpalke. Delujoče tipalo mora zaznati spremembo.',
        'pump.flow': 'Na isto cev namesti neodvisni ultrazvočni merilnik. Primerjaj ga z vgrajenim tipalom med tekom in v mirovanju.',
        'filter.inspect': 'Na indikatorju filtra preveri padec tlaka med kroženjem vode. Tako oceniš, ali je pretok oviran prav pri filtru.',
        'control.meter': 'V dnevniku poišči vrstni red dogodkov. Iz njega razbereš, na kateri pogoj je regulator čakal pred zagonom kompresorja.'
      },
      cause: 'Vgrajeni merilnik je imel napajanje in povezavo, a je ves čas kazal nič. Zunanji merilnik je na isti cevi med tekom izmeril 18 l/min.',
      effect: 'Voda je krožila, regulator pa ni dobil potrditve pretoka. Zaščita je zato preprečila zagon kompresorja.',
      fix: 'Po menjavi merilnika sta oba instrumenta med tekom pokazala 18 l/min in po ustavitvi 0 l/min. Regulator je dobil potrditev za zagon.',
      lesson: 'Pred menjavo črpalke preveri, ali alarm opisuje stanje vode ali napačen signal tipala. Dva merilnika primerjaj na istem mestu v obeh stanjih.'
    }
  ];
  for(const c of CASES)if(c.lesson)lessons.push(c.lesson);
  function purpose(n, t) { return lessons[n].questions[t.part + '.' + t.tool]; }
  function why(n, c, f, j, target) {
    if(c.station&&j.phase==='procedure')return c.station.reasons[f.radStep||0];
    if (target === 'tablet') {
      if (j.phase === 'done') return 'V poročilu primerjaj prijavo stranke z meritvami in preveri, kaj je popravilo spremenilo.';
      if (j.phase === 'verify') return 'Pred zaključkom primerjaj ponovljene meritve s prvotnimi. Iz njih mora biti razviden učinek posega.';
      if (j.phase === 'repair') return 'Izberi poseg, ki odpravi potrjeni vzrok in ohrani delujoče dele naprave.';
      return 'Poišči vzrok, ki pojasni vse tvoje meritve, tudi tiste z običajnimi vrednostmi.';
    }
    if (target === 'isolator') return f.isolated ? 'Po sestavi spet vključi napravo, da lahko ponoviš preizkus v primerljivih pogojih.' : 'Zavarovanje pred ponovnim zagonom prepreči, da bi se naprava med delom nepričakovano vključila.';
    if (target === 'water') return f.drained ? 'Pred zagonom obnovi vodni krog. Odzračevanje omogoči kroženje, s pregledom tesnosti pa preveriš spoje.' : 'Voda je lahko vroča in pod tlakom. V simulaciji servisni blok izolira ohlajeni odsek in razbremeni tlak pred odpiranjem.';
    if (target.startsWith('screw:') || target === 'tool:driver' && !f.opened && [0,4,5].includes(n)) return f.reseat ? 'Vijaki držijo pokrov na vodilih in varujejo notranje dele med delovanjem.' : 'Konico izvijača poravnaj z glavo vijaka, da ne poškoduješ utora. Pokrov lahko snameš, ko so sproščena vsa štiri pritrdilna mesta.';
    if (['cover','panelRest','panelMount'].includes(target)) return 'Pokrov podpri z roko in uporabi stojalo. Pri sestavi ga najprej nasloni na vodili, da vijaki ne prevzamejo njegove teže.';
    if (['measure','verify'].includes(j.phase)) {
      if (f.measurement?.logged) return 'Odčitek je zapisan. Snemi sonde, da jih lahko preneseš na naslednje merilno mesto.';
      if (target === 'instrument') return 'Odčitek med ustaljanjem se še spreminja. Počakaj na oznako STABILNO in za vsak kanal prepiši vrednost v prikazani enoti.';
      const taken = j.phase === 'verify' ? j.verified : j.read;
      const t = f.measurement ? c.tests[f.measurement.index] : c.tests.find((item,i) => item.required && !taken.includes(i));
      if (t) return purpose(n,t);
    }
    if (n === 0) return ['filterSeat','cleanFilter'].includes(target) ? 'Čist vložek mora sesti v ležišče, da ga voda ne obide. Po sestavi preveri tesnost ohišja.' : 'Vložek odnesi v kad. Z izpiranjem in mehko krtačo odstrani delce z mrežice, da jih ne vrneš v ogrevalni krog.';
    if (n === 1) return 'Z mehko krtačo sledi smeri lamel. Zvite lamele bi tudi po odstranitvi listja ovirale pretok zraka.';
    if (n === 2) return 'Na senčni legi tipalo lažje zazna temperaturo okoliškega zraka. Izberi mesto stran od segrete stene in izpiha.';
    if (n === 3) return 'Servisni terminal požene vgrajeni cikel za sprostitev rotorja. Kompresor med tem preizkusom miruje.';
    if (n === 4) return 'Pogon in gred poravnaj v istem končnem položaju. Tako bo kazalnik po sestavi ustrezal dejanski poti vode.';
    return 'Oznako smeri na novem merilniku poravnaj s smerjo toka vode. Po vgradnji primerjaj njegov signal z zunanjim merilnikom.';
  }
  return {lessons,purpose,why};
})();
