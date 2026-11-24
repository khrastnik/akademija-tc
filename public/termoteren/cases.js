// Scenariji po priročniku Akademija TČ, khrastnik, CC BY-NC-SA 4.0.
// Meritve, projektne vrednosti, lokacije in prijave so ustvarjene za igro.
window.CASES = [
  {
    title: 'Mlačni radiatorji',
    location: 'Škofja Loka',
    customer: 'Po menjavi dveh radiatorjev hiše ne ogrejemo več. Črpalka po nekaj minutah prekine ogrevanje.',
    weather: '4 °C · oblačno',
    model: 'Monoblok 8 kW',
    source: 'https://khrastnik.github.io/akademija-tc/okvare/#filter',
    sourceTitle: 'Filter na povratnem vodu',
    tests: [
      {part: 'pump', tool: 'flow', label: 'Pretok med obtočnim preizkusom', before: '6 l/min. Ob zagonu so pri isti nastavitvi izmerili 19 l/min.', after: '19 l/min pri isti nastavitvi črpalke.', required: true},
      {part: 'filter', tool: 'inspect', label: 'Indikator padca tlaka na filtru', before: 'Rdeče polje. Padec tlaka na filtru je velik že pri 6 l/min.', after: 'Zeleno polje tudi pri 19 l/min. Ohišje tesni.', required: true},
      {part: 'control', tool: 'meter', label: 'Zadnji cikel ogrevanja', before: 'Tik pred ustavitvijo: dvižni vod 43 °C, povratek 29 °C, alarm pretoka.', after: 'Po 15 min: dvižni vod 38 °C, povratek 33 °C. Brez prekinitve.', required: false},
      {part: 'valve', tool: 'inspect', label: 'Položaj zapornih ventilov', before: 'Oba servisna ventila sta povsem odprta.', after: 'Po sestavi sta oba servisna ventila odprta.', required: false},
      {part: 'hydro', tool: 'thermo', label: 'Kontaktni temperaturi ogrevalnega kroga', before: 'Ob koncu ponovljenega preizkusa sta temperaturi cevi 43 °C in 29 °C. Razlika je 14 K.', after: 'Pri ustaljenem ogrevanju izmeriš 38 °C in 33 °C. Razlika je 5 K.', required: true}
    ],
    diagnoses: ['Zamašena mrežica vodnega filtra', 'Zaprt servisni ventil', 'Napačen prikaz pretoka'],
    cause: 0,
    repairs: ['Zamenjaj merilnik pretoka', 'Očisti vodni filter', 'Zvišaj temperaturo ogrevanja'],
    fix: 1,
    procedure: ['Ustavi napravo, ohladi in izoliraj odsek ter razbremeni tlak.', 'Izperi mrežico, preglej tesnilo in zapri ohišje.', 'Odpri ventila, odzrači, preveri tlak in tesnost ter zaženi preizkus.'],
    explanation: 'Majhen pretok je bil resničen. Velik padec tlaka neposredno na filtru je pokazal, kje voda izgublja tlak. Po čiščenju se je pretok pri isti hitrosti črpalke povrnil.'
  },
  {
    title: 'Po vetrovni noči',
    location: 'Logatec',
    customer: 'Od zadnjega neurja ventilator slišim bolj kot prej. Zunanja enota večkrat odtaja, v hiši pa ostaja hladno.',
    weather: '3 °C · vlažno',
    model: 'Monoblok 8 kW',
    source: 'https://khrastnik.github.io/akademija-tc/okvare/#uparjalnik',
    sourceTitle: 'Uparjalnik in pretok zraka',
    tests: [
      {part: 'coil', tool: 'inspect', label: 'Pregled zajema zraka', before: 'Mokro listje prekriva dve tretjini zadnje sesalne površine.', after: 'Prehodi med lamelami so prosti, lamele ravne.', required: true},
      {part: 'fan', tool: 'meter', label: 'Zahtevana in dosežena hitrost', before: 'Zahteva 680 vrt/min, odziv 675 vrt/min. Ventilator sledi ukazu.', after: 'Zahteva 490 vrt/min, odziv 488 vrt/min.', required: true},
      {part: 'control', tool: 'meter', label: 'Temperatura uparjanja', before: 'Pri zunanjem zraku 3 °C je med ogrevanjem uparjanje pri −12 °C.', after: 'Pri istem zraku in primerljivi moči je uparjanje pri −3 °C.', required: false},
      {part: 'pump', tool: 'flow', label: 'Pretok ogrevalne vode', before: '18 l/min. Zapisnik zagona navaja 18 l/min.', after: '18 l/min, enako kot ob zagonu.', required: false}
    ],
    diagnoses: ['Okvara motorja ventilatorja', 'Zamašen vodni filter', 'Oviran dovod zraka na uparjalnik'],
    cause: 2,
    repairs: ['Očisti sesalno površino', 'Zamenjaj ventilator', 'Spremeni interval odtajevanja'],
    fix: 0,
    procedure: ['Izklopi in zavaruj enoto ter počakaj na ustavitev ventilatorja.', 'Odstrani listje in z mehko krtačo očisti lamele v njihovi smeri.', 'Sprosti zajem zraka, zapri zaščito in zaženi ogrevalni cikel.'],
    explanation: 'Ventilator je dosegal zahtevane vrtljaje. Listje je omejevalo količino zraka skozi izmenjevalnik. Po čiščenju se je temperatura uparjanja pri enakih zunanjih pogojih dvignila.'
  },
  {
    title: 'Opoldanski mraz',
    location: 'Vipava',
    customer: 'Zjutraj je toplo. Ko posije sonce, radiatorji postanejo hladni, čeprav je zunaj še vedno sveže.',
    weather: '6 °C · sončno',
    model: 'Monoblok 8 kW',
    source: 'https://khrastnik.github.io/akademija-tc/okvare/#zunanji-senzor',
    sourceTitle: 'Zunanje tipalo temperature',
    tests: [
      {part: 'control', tool: 'meter', label: 'Zunanja temperatura na regulatorju', before: 'Regulator kaže 21 °C. Nad nastavljeno mejo 18 °C ogrevanje miruje.', after: 'Regulator kaže 6,3 °C. Vremensko vodeno ogrevanje deluje.', required: true},
      {part: 'sensor', tool: 'thermo', label: 'Referenčna meritev v senci', before: 'V senci 6,1 °C. Tipalo je na osončeni fasadi. Po začasnem senčenju se njegov odčitek približa 6 °C.', after: 'Referenca 6,1 °C. Tipalo na senčnem mestu odstopa za 0,2 K.', required: true},
      {part: 'control', tool: 'inspect', label: 'Nastavitve ogrevalne krivulje', before: 'Naklon, vzporedni premik in meja ogrevanja ustrezajo zapisniku zagona.', after: 'Ogrevalna krivulja ustreza zapisniku zagona.', required: false}
    ],
    diagnoses: ['Prenizek naklon ogrevalne krivulje', 'Sonce segreva nepravilno nameščeno tipalo', 'Blokirana obtočna črpalka'],
    cause: 1,
    repairs: ['Dvigni naklon krivulje', 'Zamenjaj obtočno črpalko', 'Prestavi tipalo na ustrezno senčno lego'],
    fix: 2,
    procedure: ['Izberi senčno mesto po navodilih modela, stran od oken in izpiha.', 'Izklopi napajanje in prestavi tipalo. Kabel in kabelski uvod uredi elektro usposobljena oseba.', 'Vključi krmiljenje in počakaj, da se temperatura tipala ustali.'],
    explanation: 'Začasno senčenje je razložilo razliko med termometrom in regulatorjem. Tipalo je zaznavalo segreto okolico fasade. Popravek krivulje bi vplival tudi na ogrevanje ponoči.'
  },
  {
    title: 'Prvi jesenski zagon',
    location: 'Kamnik',
    customer: 'Po poletnem mirovanju je sistem poskusil ogrevati samo enkrat. Slišal sem kratko brnenje, nato se je pokazal alarm pretoka.',
    weather: '7 °C · megla',
    model: 'Monoblok 8 kW',
    source: 'https://khrastnik.github.io/akademija-tc/okvare/#obtocna',
    sourceTitle: 'Obtočna črpalka',
    tests: [
      {part: 'pump', tool: 'meter', label: 'Diagnostika pogona obtočne črpalke', before: 'Črpalka sprejme ukaz. Vgrajena samodiagnostika javi blokiran rotor. Povratni podatek je 0 vrt/min.', after: 'Rotor sledi zahtevi. Pogon doseže 2100 vrt/min.', required: true},
      {part: 'pump', tool: 'flow', label: 'Neodvisna meritev na vodnem krogu', before: 'Med testnim ukazom črpalki: 0 l/min. Kompresor miruje.', after: 'Med testnim ukazom črpalki: 18 l/min.', required: true},
      {part: 'valve', tool: 'inspect', label: 'Ventili in vodni tlak', before: 'Ventili so odprti. Hladni tlak je 1,5 bar, kot v zapisniku zagona.', after: 'Ventili odprti. Hladni tlak 1,5 bar.', required: false}
    ],
    diagnoses: ['Po mirovanju je obtičal rotor črpalke', 'Merilnik lažno kaže ničelni pretok', 'Regulator ne zahteva kroženja'],
    cause: 0,
    repairs: ['Zamenjaj zunanje temperaturno tipalo', 'Zaženi predvideni program za sprostitev rotorja', 'Zamenjaj merilnik pretoka'],
    fix: 1,
    procedure: ['Ohrani kompresor v mirovanju in odpri servisni način črpalke.', 'Izvedi vgrajeni cikel deblokade, ki ga podpira ta učni model.', 'Potrdi vrtenje rotorja in šele nato omogoči ogrevanje.'],
    explanation: 'Ukaz je dosegel pogon, rotor pa je obmiroval. Neodvisni merilnik je potrdil zastoj vode. Na tej napravi je rotor sprostil vgrajeni program, kar potrjujeta hitrost in pretok.'
  },
  {
    title: 'Topla voda, hladna hiša',
    location: 'Bled',
    customer: 'V bojlerju je voda topla. Tudi ko izberem ogrevanje prostorov, ostanejo vsi radiatorji hladni.',
    weather: '1 °C · oblačno',
    model: 'Monoblok 8 kW',
    source: 'https://khrastnik.github.io/akademija-tc/okvare/#tripotni',
    sourceTitle: 'Tripotni preklopni ventil',
    tests: [
      {part: 'control', tool: 'meter', label: 'Zahteva regulatorja', before: 'Bojler je dosegel cilj. Regulator je poslal ukaz za preklop na radiatorje.', after: 'Ob preizkusu regulator pravilno zahteva obe veji.', required: false},
      {part: 'valve', tool: 'thermo', label: 'Temperaturi vej pri zahtevi za ogrevanje', before: 'Po 10 min delovanja: cev proti bojlerju 44 °C, cev proti radiatorjem 22 °C.', after: 'Po 10 min ogrevanja: cev proti radiatorjem 39 °C, odklopljena veja bojlerja se ohlaja.', required: true},
      {part: 'valve', tool: 'inspect', label: 'Funkcijski preizkus pogona in gredi', before: 'Pogon zazna ukaz, kazalnik ostaja pri bojlerju. Servisni preizkus pri izklopljenem pogonu potrdi, da se gred ventila prosto premika.', after: 'Kazalnik sledi vsakemu preklopu, gred doseže oba končna položaja.', required: true},
      {part: 'pump', tool: 'flow', label: 'Skupni pretok pred razcepom', before: '18 l/min, enako kot pri zagonu sistema.', after: '18 l/min v izbrani ogrevalni veji.', required: false}
    ],
    diagnoses: ['Regulator še vedno zahteva samo bojler', 'Zagozdeno telo tripotnega ventila', 'Odpoved pogona tripotnega ventila'],
    cause: 2,
    repairs: ['Zamenjaj pogon preklopnega ventila', 'Zamenjaj telo ventila', 'Podaljšaj prednostno ogrevanje bojlerja'],
    fix: 0,
    procedure: ['Izklopi in zavaruj napajanje. Breznapetostno stanje potrdi elektro usposobljena oseba.', 'Namesti ustrezen pogon v pravilnem položaju. Električni priklop obnovi elektro usposobljena oseba.', 'Zapri zaščito, zaženi sistem in ukazuj preklop v obe smeri.'],
    explanation: 'Temperaturi cevi sta pokazali napačno pot toplote. Gred je bila prosta, ukaz pa je dosegel pogon. Menjava samega pogona je obnovila preklop brez odpiranja vodnega kroga.'
  },
  {
    title: 'Sporna meritev',
    location: 'Kranj',
    customer: 'Na zaslonu piše, da voda ne kroži. Filter je bil očiščen že včeraj, toda alarm se danes ponavlja.',
    weather: '5 °C · rahel dež',
    model: 'Monoblok 8 kW',
    source: 'https://khrastnik.github.io/akademija-tc/okvare/#pretok',
    sourceTitle: 'Merilnik pretoka',
    tests: [
      {part: 'sensor', tool: 'meter', label: 'Odziv vgrajenega merilnika', before: 'Servisni test potrdi napajanje in povezavo tipala. Njegov lokalni odčitek in regulator kažeta 0 l/min tudi ob ukazu črpalki.', after: 'Obtočni preizkus: lokalno tipalo in regulator kažeta 18 l/min. Ob ustavitvi oba padeta na 0.', required: true},
      {part: 'pump', tool: 'flow', label: 'Neodvisni ultrazvočni merilnik', before: 'Na isti cevi med obtočnim preizkusom izmeri 18 l/min, pri ustavljeni črpalki pa 0 l/min.', after: 'Na isti cevi izmeri 18 l/min med tekom in 0 l/min po ustavitvi.', required: true},
      {part: 'filter', tool: 'inspect', label: 'Indikator na lovilcu nečistoč', before: 'Pri vključeni obtočni črpalki je indikator v zelenem polju.', after: 'Pri projektiranem pretoku je indikator v zelenem polju.', required: false},
      {part: 'control', tool: 'meter', label: 'Zaporedje v dnevniku', before: 'Obtočna črpalka je dosegla vrtljaje. Regulator zaradi odčitka 0 l/min ni dovolil zagona kompresorja.', after: 'Zahteva za ogrevanje, potrjen pretok, zagon kompresorja. Cikel teče 15 min.', required: false}
    ],
    diagnoses: ['Blokiran rotor obtočne črpalke', 'Okvarjeno tipalo pretoka', 'Zamašena mrežica filtra'],
    cause: 1,
    repairs: ['Zamenjaj obtočno črpalko', 'Ponovno očisti vodni filter', 'Zamenjaj okvarjeni merilnik pretoka'],
    fix: 2,
    procedure: ['Izklopi in zavaruj napajanje. Ohladi, zapri in razbremeni vodni odsek.', 'Vgradi ustrezen merilnik v smeri pretoka z novim tesnilom. Električni priklop obnovi elektro usposobljena oseba.', 'Odpri ventile, odzrači, preveri tlak in tesnost ter primerjaj meritvi.'],
    explanation: 'Zunanji merilnik se je odzval na vklop in izklop črpalke. Napajano vgrajeno tipalo je ves čas kazalo nič. Po zamenjavi obe meritvi sledita stanju črpalke in zaščita dovoljuje zagon.'
  }
];
