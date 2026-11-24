/* Each question is shown before the measurement. Conclusions appear in the signed-off report. */
window.ServiceLesson = (() => {
  const lessons = [
    {
      questions: {
        'pump.flow': 'Z ultrazvočnim merilnikom izmeriš, koliko litrov vode na minuto res teče po ceveh. Primerjaj z zapisnikom zagona – tam piše, koliko je teklo, ko je bila naprava nova.',
        'filter.inspect': 'S svetilko poglej kazalec na filtru. Rdeče polje pomeni, da voda skozi mrežico filtra težko prehaja.',
        'control.meter': 'Na terminalu odpri zadnji cikel ogrevanja. Vidiš, kaj se je zgodilo tik preden se je naprava ustavila.',
        'valve.inspect': 'Poglej oba servisna ventila. Če je kateri napol zaprt, tudi dobra črpalka ne potisne dovolj vode.',
        'hydro.thermo': 'Eno tipalo daj na cev, ki pelje toplo vodo k radiatorjem, drugo na cev, po kateri se voda vrača. Razlika pove, koliko se je voda na poti ohladila.'
      },
      cause: 'Mrežica filtra je bila zamašena z blatom. Kazalec na filtru je bil v rdečem polju že pri majhnem pretoku.',
      effect: 'Po radiatorjih je teklo premalo vode, zato so bili mlačni. Naprava se je zaradi premajhnega pretoka sama ustavila.',
      fix: 'Po čiščenju mrežice je pretok spet 19 l/min namesto 6 l/min. Kazalec na filtru je v zelenem polju.',
      lesson: 'Majhen pretok pove samo, da voda težko teče. Kje se zatika, pokaže šele kazalec na filtru.'
    },
    {
      questions: {
        'coil.inspect': 'S svetilko poglej zadnjo stran zunanje enote. Zrak mora prosto teči med tankimi lamelami, sicer naprava iz zraka ne dobi toplote.',
        'fan.meter': 'Na terminalu primerjaj, koliko vrtljajev ventilator mora imeti in koliko jih ima. Tako veš, ali se ventilator res vrti, kot mora.',
        'control.meter': 'Preberi temperaturo uparjanja. Čim nižja je pri istem zunanjem zraku, tem težje naprava jemlje toploto iz zraka.',
        'pump.flow': 'Izmeri še pretok vode. Če je tak kot ob zagonu, je vodna stran v redu in iščeš na zračni strani.'
      },
      cause: 'Mokro listje je prekrilo dve tretjini zadnje strani zunanje enote. Ventilator se je vrtel pravilno.',
      effect: 'Skozi lamele je šlo premalo zraka. Naprava je dobila premalo toplote in je zato pogosteje odtajevala.',
      fix: 'Po čiščenju listja je zrak spet prosto tekel. Temperatura uparjanja se je dvignila z −12 °C na −3 °C.',
      lesson: 'Ventilator se lahko vrti pravilno, zrak pa vseeno ne gre skozi. Preden menjaš motor, poglej lamele.'
    },
    {
      questions: {
        'control.meter': 'Na terminalu preberi, kakšno zunanjo temperaturo vidi naprava. Primerjaj jo z mejo, nad katero naprava neha ogrevati.',
        'sensor.thermo': 'Svoj termometer postavi v senco, stran od tople stene. Tako dobiš pravo temperaturo zraka in jo primerjaš s tisto, ki jo vidi naprava.',
        'control.inspect': 'Primerjaj nastavitve ogrevanja z zapisnikom zagona. Preveriš, ali jih je kdo spremenil.'
      },
      cause: 'Sonce je ogrelo steno in zunanje tipalo na njej. Naprava je mislila, da je zunaj 21 °C, v senci pa je bilo 6 °C.',
      effect: 'Nad 18 °C zunaj naprava neha ogrevati. Zato je opoldne ugasnila, čeprav je bilo zunaj še mraz.',
      fix: 'Tipalo je zdaj v senci. Naprava vidi 6,3 °C in spet ogreva.',
      lesson: 'Če se težava pojavi samo ob določeni uri, meri takrat. Preden spremeniš nastavitve, preveri, kaj tipalo res meri.'
    },
    {
      questions: {
        'pump.meter': 'Na terminalu preveri tri stvari: ali je črpalka dobila ukaz, ali se vrti in ali javlja zastoj. Ukaz sam še ne pomeni, da se vrti.',
        'pump.flow': 'Z merilnikom na cevi preveri, ali voda res teče, ko črpalka dobi ukaz. Tako preveriš podatek črpalke še z drugim instrumentom.',
        'valve.inspect': 'Poglej ventile in tlak vode. Preden kriviš črpalko, preveri, da je voda v sistemu in da je pot odprta.'
      },
      cause: 'Po poletju je os črpalke obtičala. Črpalka je dobila ukaz, a se ni zavrtela.',
      effect: 'Voda ni tekla – merilnik je pokazal 0 l/min. Naprava zato ni začela ogrevati.',
      fix: 'Program za sprostitev je os zavrtel. Črpalka ima 2100 vrtljajev na minuto, po cevi teče 18 l/min.',
      lesson: 'Pri napaki pretoka preveri po vrsti: ukaz, vrtenje črpalke in ali voda res teče. Po popravilu preveri obe zadnji stvari.'
    },
    {
      questions: {
        'control.meter': 'Na regulatorju preveri, kam naprava želi poslati toplo vodo – v bojler ali v radiatorje.',
        'valve.thermo': 'Eno tipalo daj na cev proti bojlerju, drugo na cev proti radiatorjem. Topla cev pokaže, kam voda res teče.',
        'valve.inspect': 'Primerjaj ukaz s kazalcem na ventilu. Nato preveri, ali se ventil premakne z roko. Tako ločiš okvaro motorčka od zataknjenega ventila.',
        'pump.flow': 'Skupni pretok pove samo, da voda teče. Kam teče, ti pove šele temperatura obeh cevi.'
      },
      cause: 'Motorček preklopnega ventila je dobil ukaz, ventila pa ni premaknil. Ventil sam se je premikal brez težav.',
      effect: 'Topla voda je še naprej tekla v bojler (44 °C), radiatorji pa so ostali hladni (22 °C).',
      fix: 'Po menjavi motorčka ventil sledi ukazu. Cev proti radiatorjem ima zdaj 39 °C.',
      lesson: 'Temperaturi cevi pokažeta, kam teče toplota. Ukaz, kazalec in premik z roko povejo, kateri del ventila je kriv.'
    },
    {
      questions: {
        'sensor.meter': 'Na terminalu preberi vgrajeni merilnik pretoka, ko črpalka teče in ko stoji. Dober merilnik pokaže razliko.',
        'pump.flow': 'Na isto cev namesti še svoj merilnik. Primerjaj ga z vgrajenim, ko črpalka teče in ko stoji.',
        'filter.inspect': 'Poglej kazalec na filtru. Če je zelen, filter ne ovira vode.',
        'control.meter': 'V dnevniku poglej, na kaj je naprava čakala, preden bi zagnala kompresor.'
      },
      cause: 'Vgrajeni merilnik pretoka je bil pokvarjen in je ves čas kazal 0. Tvoj merilnik je na isti cevi izmeril 18 l/min.',
      effect: 'Voda je tekla, naprava pa tega ni vedela. Zato iz varnosti ni zagnala kompresorja.',
      fix: 'Po menjavi merilnika oba merilnika kažeta 18 l/min, ko črpalka teče, in 0, ko stoji. Naprava spet ogreva.',
      lesson: 'Preden menjaš črpalko, preveri, ali napaka opisuje vodo ali samo signal merilnika. Primerjaj dva merilnika na isti cevi.'
    }
  ];
  for(const c of CASES)if(c.lesson)lessons.push(c.lesson);
  function purpose(n, t) { return lessons[n].questions[t.part + '.' + t.tool]; }
  function why(n, c, f, j, target) {
    if(c.station&&j.phase==='procedure')return c.station.reasons[f.radStep||0];
    if (target === 'tablet') {
      if (j.phase === 'done') return 'V poročilu preberi, kaj je bilo narobe, kaj si naredil in kaj se je spremenilo.';
      if (j.phase === 'verify') return 'Ponovi iste meritve kot na začetku. Primerjava pokaže, ali je popravilo pomagalo.';
      if (j.phase === 'repair') return 'Izberi popravilo, ki odpravi vzrok. Delov, ki delajo, ne menjaj.';
      return 'Izberi vzrok, ki razloži vse tvoje meritve – tudi tiste, ki so normalne.';
    }
    if (target === 'isolator') return f.isolated ? 'Napravo spet vključi, da lahko ponoviš meritve.' : 'Napravo izklopi in zavaruj, da se med delom ne vključi sama.';
    if (target === 'water') return f.drained ? 'Odpri ventile, odzrači in preveri, da nič ne pušča. Šele nato naprava lahko spet dela.' : 'Voda je lahko vroča in pod tlakom. Zapri ventile in spusti tlak, preden kaj odpreš.';
    if (target.startsWith('screw:') || target === 'tool:driver' && !f.opened && [0,4,5].includes(n)) return f.reseat ? 'Privij vse vijake, da pokrov drži in varuje notranjost.' : 'Odvij vse štiri vijake. Šele nato lahko snameš pokrov.';
    if (['cover','panelRest','panelMount'].includes(target)) return 'Pokrov odloži na stojalo. Pri sestavi ga najprej nasloni na vodili, nato privij.';
    if (['measure','verify'].includes(j.phase)) {
      if (f.measurement?.logged) return 'Odčitek je zapisan. Snemi tipala, da jih lahko uporabiš drugje.';
      if (target === 'instrument') return 'Počakaj, da instrument pokaže STABILNO, nato prepiši številke.';
      const taken = j.phase === 'verify' ? j.verified : j.read;
      const t = f.measurement ? c.tests[f.measurement.index] : c.tests.find((item,i) => item.required && !taken.includes(i));
      if (t) return purpose(n,t);
    }
    if (n === 0) return ['filterSeat','cleanFilter'].includes(target) ? 'Čist vložek vstavi do konca, da gre vsa voda skozi mrežico. Preveri, da nič ne pušča.' : 'Vložek operi v kadi in s krtačo očisti mrežico.';
    if (n === 1) return 'Krtači v smeri lamel. Zvite lamele bi zrak ovirale tudi brez listja.';
    if (n === 2) return 'Tipalo mora biti v senci, stran od tople stene in od izpiha enote. Tam meri pravo temperaturo zraka.';
    if (n === 3) return 'Terminal zažene program, ki zataknjeno črpalko zavrti. Kompresor med tem stoji.';
    if (n === 4) return 'Novi motorček poravnaj z ventilom v istem položaju. Tako bo kazalec kazal pravo smer vode.';
    return 'Puščica na novem merilniku mora kazati v smer toka vode. Nato ga primerjaj s svojim merilnikom.';
  }
  return {lessons,purpose,why};
})();
