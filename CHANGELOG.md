# Spremembe

## 0.21.1 – 2026-11-22

- Lekcija 17.1: zgodba zdaj pove, kako serviser izmeri krog hladiva (s spričevalom, manometri) in da meritev pokaže
  premalo hladiva, puščanje pa potrdi šele detektor.

## 0.21.0 – 2026-11-22

### Izpit F-plini: kar je manjkalo iz načrta za aplikacijo
- **Odprta vprašanja s samooceno** (13, za vsako temo pisnega izpita): odgovoriš sam, pogledaš vzorčni odgovor in se oceniš
  »znal / delno / ne še«; česar ne znaš, ponoviš. Na pravem pisnem izpitu so tudi vprašanja odprtega tipa.
- **Pripravljenost po temah**: na začetku simulacije vidiš, kolikšen delež vprašanj vsake teme si nazadnje odgovoril prav
  in koliko vprašanj teme si že videl. Izidi se shranijo že ob »Preveri«, ne šele ob koncu vaje.
- **Vadi šibke teme**: gumb po izpitu in pri pripravljenosti vzame vsa vprašanja tem pod 50 %.
- **Javi napako v vprašanju**: povezava pri razlagi in v pregledu napačnih odgovorov odpre prijavo s številko vprašanja.
- Opis točkovanja ločuje pravilo kataloga (napačen ali pravilen + napačen = 0) od strožjega pravila simulacije (izpuščen
  pravilen = 0).

## 0.20.0 – 2026-11-19

### Izpit F-plini po uradnem izpitnem katalogu
- **Simulacija je zdaj oblike pisnega izpita** iz Izpitnega kataloga A (MOP/ARSO, 2016): 51 vprašanj, 90 minut, razporeditev
  po poglavjih 12/16/3/3/3/6/3/5 (prej 30 naključnih vprašanj v 45 minutah).
- **Več pravilnih odgovorov**: točka samo, če označiš vse pravilne in nobenega napačnega – kot na izpitu. Vaja ima gumb
  »Preveri« in pokaže zgrešene pravilne odgovore.
- **Ocena po uradnih mejah**: nad 60 % in vsaj 50 % v poglavju 1, 2, skupini 4+5+11 in skupini 6–9 = brez ustnega zagovora;
  50–60 % = zagovor; pod 50 % = ponovno (prej lasten prag 70 %). Rezultat pokaže tudi skupine poglavij.
- **25 novih vprašanj** (skupaj 127): računi pregrevanja in podhlajevanja z branjem P-T tabele, CO₂e, enote, p-h diagram,
  Montrealski protokol, Pariški sporazum, ODP, Uredba 2024/573, kategorija A1; 13 vprašanj ima več pravilnih odgovorov.
- Teme »Pregledi pred zagonom« in »Cevi« so samo v praktičnem delu, zato jih pisni izpit ne vzame (v vaji ostanejo).
- **Kategorije spričeval po Izvedbeni uredbi (EU) 2024/2215** (A1, A2, B, C, D, E) namesto starih I–IV, s preslikavo.
- »Kako poteka izpit« navaja dejanski obseg, točkovanje, meje in obvezne praktične naloge iz kataloga.

### Termoteren 3D
- Povezava na zunanji 3D servisni simulator Termoteren na domači strani (Učim se od začetka), na strani Orodja in pod igro Teren.

## 0.19.0 – 2026-11-16

### Pregled razumljivosti
- **Lekcija 16.1 ne vodi več v slepo ulico**: namesto starega simulatorja z »dvanajstimi klici« kaže na igro Teren.
  Modul 16 se zdaj imenuje »Diagnostika korak za korakom« (vaja v igri Teren).
- **Učna pot po vrstnem redu**: modul 18 »Napake meritev« je prestavljen za modul 17 (faza »F2 · Diagnoza v praksi«),
  zato si številke sledijo 0–21 in se ujemajo z »Kaj sledi« v lekcijah. Modul 15 je »Primeri napak iz prakse«
  (prej »30 realnih primerov«, čeprav sta lekciji dve).
- **En izraz za isto stvar**: igra zdaj povsod uporablja »pregrevanje« in »podhlajevanje« kot lekcije in kalkulator
  (prej »pregretje« in »podhladitev«).
- **Kratice ostanejo velike**: »senzor zunanje T«, »EEV zataknjen zaprt« (prej »senzor zunanje t«, »eev …«).
- **Domača stran**: igra Teren je pod »Učim se od začetka« (prej pod izpitom F-plini); pri izpitu je zdaj izračun CO₂e.
  »102 vprašanji« (slovnica), »16 tipičnih okvar« namesto »realnih«.
- **Začetni zaslon igre je krajši**: na telefonu je »Začni delovni dan« na prvem zaslonu. Pravila in opis letnega časa
  so pod »Kako se igra«, opis težavnosti se na telefonu pokaže samo pri izbrani.
- **Predznanje**: pod gumbom »Prvič tukaj?« s povezavo na module 5–8 (pretok, ΔT, pregrevanje, podhlajevanje).

## 0.18.0 – 2026-11-15

### Igra Teren – večje skupine za vajo
- **Več zamenljivih okvar**: nova polja `also` v `content/teren/ucenje.yaml` naštejejo okvare, ki so si v modelu igre
  podobne po vseh hitrih (nepotrditvenih) meritvah. Izračunano iz modela, ne zapisano na pamet; test preveri, da se
  vsak par res razlikuje v največ 4 meritvah.
- Skupina za vajo s strani okvar ima zdaj do 5 okvar (prej 2–3); 14 od 16 skupin ima vsaj 3.
  Primer: premalo hladiva · EEV zaprt · preveč hladiva · ventilator · filter sušilnik.
- Izjemi: EEV zataknjen odprt in obtočna črpalka imata v modelu dovolj značilen podpis, zato ostaneta pri dveh.

## 0.17.0 – 2026-11-15

### Igra Teren – vaja s strani okvar
- **Vaja ne pove več odgovora vnaprej.** Povezava s strani okvar zdaj odpre vajo zamenljivih okvar: vsak nalog je
  naključno ena od izbrane okvare, okvare »ne zamenjaj z« in okvar, ki jih je lahko zamenjati z njo
  (npr. EEV zataknjen zaprt · zamašen filter sušilnik · premalo hladiva). Ista okvara ne pride dvakrat zapored.
- Gumb po rezultatu: »Še ena iz te skupine«.
- Test: vsaka skupina ima vsaj dve okvari, žreb pokrije vse in ne ponovi zadnje.

## 0.16.0 – 2026-11-15

### Okvare ↔ igra Teren
- **»🎮 Vadi v igri Teren« pri vsakem delu** na strani »Okvare in popravila«: povezave na okvare v igri, ki vključujejo
  ta del (npr. ekspanzijski ventil → EEV zataknjen zaprt / odprt). Seznam se gradi iz istih podatkov kot »Nauči se več«
  v igri, zato sta smeri vedno usklajeni.
- **Vaja ene okvare** (`teren/?vaja=<okvara>`): en nalog z izbrano okvaro, brez kombinacij, brez vpliva na kampanjo
  in statistiko. Po rezultatu »Še enkrat ista okvara« ali »Na začetek igre«.

## 0.15.0 – 2026-11-15

### Igra Teren
- **»Nauči se več« v rezultatu vsakega naloga**: povezave na lekcije za to okvaro (npr. 8.1 SH in SC skupaj, 5.1 premajhen pretok)
  in na dele na strani »Okvare in popravila« (npr. ekspanzijski ventil, lovilec). Pri dveh okvarah hkrati še lekcija 17.1
  »Ko se dve napaki skrivata«, pri napačni ali delni diagnozi 16.1 »Hipoteza – potrdi ali ovrzi«.
- Povezave se odprejo v novem zavihku, zato delovni dan ostane, kjer je.
- Test preveri, da vse povezave kažejo na obstoječe lekcije in dele.

## 0.14.0 – 2026-11-15

### Čiščenje
- **Stara igra »Dan na terenu« odstranjena iz kode**: način igre v `Simulator.tsx`, model `packages/engine/src/sim.ts`,
  `content/sim/faults.yaml`, `content/sim/days.yaml`, njeni testi in 40 blokov slogov, ki jih je uporabljala le ona.
  Model okvar in normalna območja so zdaj samo v `packages/engine/src/teren.ts` – ena igra, en vir številk.
- 3D simulator ostane za razumevanje: ogled kroga, načini delovanja, deli z opisom in povezavo na okvare.
- Lekcije 15.1, 15.2 in 21.1 namesto stare igre vodijo v igro Teren.

## 0.13.0 – 2026-11-15

### Zgradba strani
- **Meni v treh skupinah** namesto 11 povezav: *Učenje* (Učna pot, Slovar, Ponovitev), *Vaja* (Teren, 3D simulator, Izpit F-plini)
  in *Na terenu* (Kode napak, SH/SC, Okvare, Merilna oprema). Na računalniku spustni seznami z opisom vsake strani
  (hkrati odprt le eden, zapre se ob kliku drugam ali Esc), na telefonu isti meni s skupinami. Hamburger spet do 860 px.
- **»Končni izpit« in »Orodja« nista več v meniju** – izpit je še v pripravi, Orodja podvajajo skupino »Na terenu«. Strani ostaneta dosegljivi.
- **Nova domača stran** s tremi vstopnimi potmi: »Učim se od začetka«, »Pripravljam se na izpit«, »Sem na terenu«,
  predstavitev igre Teren in jasno opozorilo, da vsebina še ni strokovno pregledana.
- **Ena igra**: v 3D simulatorju je zavihek »Dan na terenu« zamenjala povezava na igro Teren, tako da igralec ne naleti na
  dva modela z različnimi normalnimi vrednostmi. Simulator ostane za razumevanje delovanja.

## 0.12.0 – 2026-11-15

### Igra Teren
- **Kombinirane okvare**: na stopnji Serviser v 15 %, na stopnji Mojster v 35 % nalogov ima naprava dve okvari hkrati
  (12 realnih parov, npr. puščanje + zamašen lovilec, odtajevanje + dogrevalnik, napačna krivulja + dogrevalnik).
  V diagnozi označiš eno ali dve okvari: vse pravilno = plačilo ×1,25, delno = pol plačila brez spremembe ugleda.
- **Letni časi – kampanja**: jesen (zagon sezone), zima (mraz in led), pomlad (računi in servisi), vsak po 2 dni.
  Vsak ima svoje zunanje temperature, tipične okvare (v kupčku dvakrat pogosteje) in uvod z nasveti; napredek se shrani v brskalniku.
- **Razlaga vsake diagnoze** (novo `content/teren/ucenje.yaml`):
  - pot do pravilne diagnoze v preprostih korakih,
  - zakaj in 3 ključni indikatorji,
  - potrditev – katere meritve okvaro dokažejo in katerih nisi izmeril,
  - »Ne zamenjaj z …« – najpogostejša zamenjava in po čem ju ločiš,
  - »Kaj so povedale tvoje meritve« – pomen vsake meritve, ki je odstopala,
  - pri napaki »Zakaj ne …« – kaj bi videl pri tvoji diagnozi in katera meritev bi jo potrdila.
- **Zapisnik v učnem načinu**: ob vsaki odstopajoči meritvi 💡 kratko pojasnilo, kaj pomeni.
- **Namig** opozori na možnost dveh okvar; referenčna tabela ima pravilo za branje SH in SC.
- Testi: obe okvari v vsakem paru dokazljivi (3 stopnje × 30 nalogov), ocena delne diagnoze, letni časi, učne vsebine.

## 0.11.0 – 2026-11-15

### Nova igra »Teren« (`/teren/`) – po PRD »Serviser TČ«
- **Delovni dan 480 minut**: vožnja 15–35 min, nov nalog le, če ostane vožnja + 40 min; ura, preostanek dneva, zaslužek in ugled ★ (začetek 3 ★, pri 0 ★ konec igre).
- **Plačilo po PRD**: (140 € − 1,2 € × min nad 20 min na lokaciji) × (0,6 + 0,1 × ugled), najmanj 40 €; diagnoza z ≤ 1 meritvijo ×0,7;
  napaka −30 € in −1 ★; pravilno v ≤ 35 min +1 ★. Klic podpore (−15 min) enkrat na nalog izloči 5 napačnih možnosti.
- **16 okvar**: 11 iz PRD (premalo/preveč hladiva, zamašen lovilec, ventilator, EEV zaprt/odprt, zrak v vodi, črpalka, senzor zunanje T,
  odtajevanje, krivulja) + 5 realnih iz v0.3 (3-potni ventil, filter sušilnik, raztezna posoda, dogrevalnik, tlačni senzor VT).
- **Model po PRD**: zdravo izhodišče (T uparjanja = T zunaj − 6…8 K, T kondenzacije = T dovoda + 2,5…4 K, SH 4–6,5 K, SC 3–5 K, ΔT 4,5–6 K,
  pretok 1,15–1,35 m³/h, tlak 1,4–1,8 bar), tlaki iz preverjene P-T tabele R32, šum, koda napake le z verjetnostjo 40–75 %,
  stara nepovezana koda v zgodovini, splošne prijave strank (prijava sama ne izda vzroka), več variant prijav na okvaro.
- **28 meritev** s ceno 1–10 min; SH, SC in primerjava VT zahtevajo priklopljeno manometrsko baterijo; drage potrditvene meritve označene.
- **Klikljiva shema** zunanje enote, notranje enote in hiše: klik na del pokaže njegova orodja; shema pokaže izmerjeno
  (ventilator stoji, led, koda na krmilniku, kazalci manometrov, barva radiatorjev, zamašen lovilec …). Na telefonu pomična v berljivi velikosti.
- **Servisni zapisnik** (najnovejše zgoraj, ura, minute, oznaka VISOKO/NIZKO tudi z besedo, ne le barvo), učni način z normalnimi območji
  in referenčno tabelo, **namig**, ki se prilagodi izmerjenemu, rezultat s 3 ključnimi indikatorji, razlago in popravilom.
- **3 težavnostne stopnje** (vajenec, serviser, mojster) – šum, pogostost kod, stare kode, učni način.
- **Statistika v brskalniku** (metrike iz PRD): točnost, povprečno število meritev pri pravilni diagnozi, točnost po dnevih, najboljši dan.
- Testi: podpis vsake okvare na 3 stopnjah × 40 nalogov, formula plačila, ugled, kupček, podpora, ponovljivost.
- Povezave: glava (»Teren«), meni, Orodja in stran Simulator.

## 0.10.1 – 2026-11-15

### Popravek
- **Merilna oprema: klik na napravo ni odprl ničesar.** Globalni slog `button:active { transform: scale(.98) }` je ob pritisku
  skrčil prekrivno plast gumba kartice na napis – spust prsta nad sliko naprave zato ni sprožil klika.
  Gumb kartice ob pritisku ne dobi več transform, odziv na pritisk pokaže kartica. Preverjeno s pravim klikom na sliko in na dele naprave.

## 0.10.0 – 2026-11-15

### Novo
- **Merilna oprema** (`/oprema/`): 17 delujočih naprav, ki jih klikaš – vsaka ima stanje, odčitke in razlago, kaj se je zgodilo in zakaj:
  - krog hladiva: analogna in digitalna manometrska baterija, vakuumska črpalka, elektronski vakuummeter, detektor puščanja,
    tehtnica, naprava za zajem z jeklenko, dušik z reducirnim ventilom;
  - temperatura: kleščni termometer za cevi, vbodni termometer, IR termometer, termokamera;
  - elektrika: kleščni ampermeter, multimeter, dvopolni preizkuševalnik napetosti, merilnik izolacijske upornosti;
  - voda: manometer vodnega kroga.
- Naprave pokažejo tipične napake: oba ventila baterije odprta, napačno hladivo na digitalni bateriji, neizoliran termometer,
  IR na svetlem bakru, cel kabel v kleščah, upornost pod napetostjo, preizkus brez znanega vira, megger s priključeno elektroniko,
  vlažno olje v črpalki, vlaga ali puščanje pri vakuumu, prepolna jeklenka, previsok tlak dušika, prazna raztezna posoda.
- Pri vsaki napravi: kaj meri, kje, kako, pogoste napake, kdo jo sme uporabljati in povezave na lekcije.
- Meni, glava in Orodja: povezava »Oprema«.
- Test preveri, da ima vsaka naprava opis in delujočo izvedbo ter da so naprave za krog hladiva in elektriko pravilno označene.

## 0.9.4 – 2026-11-15

### Kalkulator SH/SC
- Poenostavljen na **najpogostejša hladiva: R32, R410A in R290**. Odstranjeni R407C, R744, R454B in R452B
  (iz kalkulatorja, P-T tabele, skripte in testov) – tudi R452B, ki je bil preverjen le pri atmosferskem tlaku.

## 0.9.3 – 2026-11-14

### Kalkulator SH/SC
- Dodani **R454B** (R32/R1234yf, do +55 °C) in **R452B** (R32/R125/R1234yf, do +53 °C). CoolProp ju nima vnaprej pripravljenih,
  zato sta izračunana kot mešanici iz sestavin (molski deleži iz masne sestave).
  - R454B preverjen s Honeywellovo tabelo pri 40 psig: vrelišče 0,05 K, rosišče 0,13 K odstopanja; pri 1 atm 0,41 K.
  - R452B preverjen le z ASHRAE 34 pri 1 atm (0,33 K in 0,50 K) – v kalkulatorju ima vidno opozorilo, naj se za natančno delo primerja s tabelo proizvajalca.
  - Nad zgornjo mejo tabele kalkulator izpiše »Tlak je zunaj tabele« (pri višjih temperaturah izračun mešanice ne konvergira).

### Navigacija
- **SH/SC je v glavi** na računalniku. Glava je širša od besedila, da gre vseh 9 povezav v eno vrstico;
  hamburger meni se zdaj uporablja do širine 1080 px (prej 860 px), nad tem je meni v glavi.

## 0.9.2 – 2026-11-14

### Kalkulator SH/SC
- Dodani **R407C** in **R744 (CO₂)**. P-T tabeli izračunani s CoolProp in preverjeni z referenčnimi vrednostmi:
  R407C vrelišče in rosišče pri 1 atm (odstopanje ≤ 0,17 K), R744 pri −20, 0 in 20 °C (≤ 0,02 %).
- R407C: kalkulator pod poljem pokaže rosišče, vrelišče in drsenje; za pregrevanje uporabi rosišče, za podhlajevanje vrelišče.
- R744: tabela do 30 °C, zapisana kritična točka (30,98 °C, 73,77 bar abs). Nad kritičnim tlakom kalkulator namesto podhlajevanja
  izpiše »Nadkritično« in razloži, zakaj pri CO₂ v ogrevanju podhlajevanja ni.
- Testi za drsenje R407C in kritično točko R744.

## 0.9.1 – 2026-11-14

### Kalkulator SH/SC
- **Vnos tlaka z manometra** za R32, R410A in R290: P-T tabela nasičenja od −40 do +70 °C (1 K korak) v `data/refrigerants.json`.
  Izračunana s CoolProp 6.6 (`scripts/gen-pt.mjs`) in preverjena z referenčnimi točkami NIST pri vrelišču, 0 °C in 40 °C –
  največje odstopanje 0,24 %. Pri R410A se za pregrevanje uporabi rosišče, za podhlajevanje vrelišče.
- Kalkulator privzeto sprejme nadtlak z manometra in pokaže temperaturo nasičenja; vnos temperature s skale ostane na voljo.
- Novi testi na pravih podatkih (nadtlak pri 0 °C za vsa tri hladiva, primer SH za R32).

## 0.9.0 – 2026-11-14

### Novo
- **Kalkulator pregrevanja in podhlajevanja** (`/sh-sc/`) za R32, R410A in R290: vpis odčitkov z manometrov in termometra,
  izračun SH in SC s prikazom formule, opozorila za negativne vrednosti in SH/SC blizu 0 K, tabela »kako brati SH in SC skupaj«,
  varnostne oznake hladiv (A2L, A1, A3). Zaenkrat se vpiše temperatura nasičenja s skale manometra – vnos tlaka se vklopi sam,
  ko bo v `data/refrigerants.json` preverjena P-T tabela z virom. Računski del je pokrit s testi (`tests/ptcalc.test.ts`).
- **Vprašanja za izpit F-plini**: banka razširjena s 55 na 102 vprašanji, vsaka tema ima 9–12 vprašanj.
- Meni in Orodja: povezava na kalkulator SH/SC.

## 0.8.0 – 2026-11-14

### Novo
- **Kode napak** (`/kode/`): 35 kod za Daikin Altherma, Panasonic Aquarea, Mitsubishi Ecodan, Vaillant aroTHERM,
  Samsung EHS in LG Therma V. Pri vsaki kodi: pomen, kaj najprej preveriti, kdo sme poseg narediti in povezava na okvaro dela.
  Iskanje razume različne zapise (F.022 = F22 = f022), filter po proizvajalcu, povezava `?q=koda`.
  Kode, pri katerih si viri nasprotujejo, imajo oznako »Odvisno od modela«. Pri vsakem proizvajalcu so navedeni viri.
  Kronoterm in Viessmann sta »v pripravi«, ker javnega uradnega vira nismo našli.
- **Vprašanja za izpit F-plini**: 55 vprašanj v slogu izpita v 10 temah kategorije I, vsako z razlago.
  Simulacija izpita (30 naključnih vprašanj, 45 minut, rezultat in ocena po temah na koncu), vaja po temah
  s takojšnjo razlago, »Ponovi napačne« in zgodovina poskusov v brskalniku.
- Gradnja preveri vire kod, povezave na dele in pravila za vprašanja (en pravilen odgovor, uravnotežene dolžine, vsaj 3 vprašanja na temo).

## 0.7.0 – 2026-11-14

### Novo
- **Okvare in popravila** (`/okvare/`): 22 delov toplotne črpalke – zakaj se pokvari, kako se okvara pokaže,
  popravilo ali zamenjava po korakih, kako preveriš in kako preprečiš. Vsak del ima oznako, kdo sme poseg narediti
  (lastnik, serviser, električna dela, 🔒 samo s spričevalom za F-pline). Skupna postopka za zamenjavo dela
  v krogu hladiva in v vodnem krogu. Filtri po krogu in »kar smem sam«. Iz 3D simulatorja vodi povezava na vsak del.
- **Priprava na izpit F-plini** (`/f-plini/`): kategorije spričevala, potek izpita, snov v 6 temah,
  5 praktičnih postopkov (spajkanje z dušikom, tlačni preizkus, vakuum, polnjenje po teži, zajem),
  izračun t CO₂e s pogostostjo pregledov tesnosti, oznaka »To znam« z merilnikom pripravljenosti in vaja z 12 vprašanji.
  Napačni odgovori gredo v Ponovitev.
- Slovar: 9 novih pojmov (F-plini, GWP, ekvivalent CO₂, zajem hladiva, tlačni preizkus, vakuumiranje,
  pregled tesnosti, gorljivo hladivo, evidenca opreme).
- Meni in glava: novi povezavi »Okvare« in »F-plini«; »Izpit« v meniju preimenovan v »Končni izpit«.
- Gradnja preveri, da ima vsak del hladilnega in vodnega kroga opis okvare in da je vsak poseg v krog hladiva označen s spričevalom.

## 0.6.0 – 2026-11-13

### Telefon
- **Hamburger meni** do širine 860 px: predal z vsemi stranmi (ikona + kratek opis), označena trenutna stran
  in gumb **»Nadaljuj, kjer si ostal«**. Zapre se z ✕, tipko Esc, tapom na ozadje ali tipko Nazaj.
- Glava je lepljiva, med branjem se umakne in vrne ob drsenju navzgor.
- Modul: povezava »← Učna pot« ter prejšnji in naslednji modul.
- Večje dotikalne površine (vsaj 44 px), upoštevani robovi zaslona.

## 0.5.0 – 2026-11-11

### Simulator
- **Zalogovnik** v 3D modelu: 4-priključni hranilnik loči primarni krog toplotne črpalke od sekundarnega kroga radiatorjev,
  z lastno **sekundarno obtočno črpalko**. Sekundarni krog teče tudi med segrevanjem bojlerja.
- Nov del **števec elektrike** (odčitavanje zaslona, brez odpiranja omarice).
- Tri nove meritve: T vode v radiatorje (za zalogovnikom), pregled zalogovnika, števec elektrike.
- **Peti dan – »Petek – zalogovnik«** v igri Dan na terenu, trije novi klici, vsi rešljivi brez manometrov:
  - mešanje v zalogovniku (sekundarni pretok prevelik),
  - taktiranje zaradi senzorja zunaj tulca,
  - električni dogrevalnik se vklaplja pri blagem vremenu.
- Nova vidna namiga v 3D (premešan zalogovnik, odlepljen senzor, žareč dogrevalnik) in testi vzorcev.

## 0.4.0 – 2026-11-10

### Simulator
- Nov razdelek »Štiri postaje v živo« na strani Simulator (`/simulator/#postaje`).
  Vsaka postaja ima svojo animirano mini simulacijo z enim drsnikom:
  - **uparjalnik** – pretok in temperatura zraka: kje hladivo zavre, pregrevanje, tekočina na izhodu,
  - **kompresor** – hitrost (inverter): stiskanje pare, tlak, temperatura, poraba,
  - **kondenzator** – pretok vode: utekočinjanje, podhlajevanje, »visok tlak« ob zamašenem filtru,
  - **ekspanzijski ventil** – odprtost: padec tlaka in temperature, lačen ali preplavljen uparjalnik.
- Lekcija 2.1 vodi na simulacije neposredno ob seznamu štirih postaj.
- Spoštuje nastavitev »manj gibanja« (brez animacije).

## 0.3.0 – 2026-11-10

### Vsebina
- Modul 10 »Elektrika« razširjen s 4 lekcijami (skupaj 5):
  - 10.2 Napetost, tok, moč in energija (W proti kWh),
  - 10.3 Varovalke, FID stikalo in varen izklop – ravnanje ob izpadu zaščite,
  - 10.4 Kaj meri električar ali serviser – kje in s čim (samo za usposobljene),
  - 10.5 Koliko porabi moja črpalka – poraba in povprečno grelno število iz števcev.
- 9 novih pojmov v slovarju (napetost, tok, moč, energija, odklopnik, FID stikalo, multimeter, klešče, števec toplote).
- Lekcije namerno ne učijo meritev pod napetostjo 230/400 V; lastnik meri le na števcih.
- Kontrolni seznam za strokovni pregled dopolnjen z novimi lekcijami.

## 0.2.0 – 2026-10-25

### Vsebina
- Vseh 22 modulov ima popolno prvo lekcijo; moduli 0, 1, 2, 7, 8 in 15 tudi drugo (skupaj 28 lekcij).
- 33 pojmov v slovarju.
- 3D simulator: 20 delov naprave, načini ogrevanje / sanitarna voda / odtajevanje, igra »Dan na terenu« s 4 dnevi.

### Tehnični samopregled vsebine (ni strokovni pregled)
Popravljene trditve, ki so bile napačne ali preveč poenostavljene:
- **7.2** Ivje na sesalnem vodu pozimi ni znak prenizkega pregrevanja – pri ogrevanju je normalno.
  Kot znak je zdaj naveden nenavadno hladen tlačni vod. Popravljena tudi vaja in kviz.
- **7.1, 7.2** Zasut uparjalnik pri napravah z elektronskim ventilom ne pomeni samodejno nizkega
  pregrevanja; vaji zdaj uporabljata nedvoumne vzroke (ventil, senzor).
- **4.1** Vrenje razloženo s parnim tlakom; dodano opozorilo o drsenju temperature pri mešanicah (R407C).
- **1.1** Dopolnjeno: tudi elektrika kompresorja postane toplota, a je manjši del.
- **13.1, 14.1** Meritve v ohišju naprave (filter sušilnik, klešče) le usposobljena oseba.
- **15.1** Ocena pretoka iz ΔT označena kot ocena, ne izračun.
- **12.1** Jasnejša razlaga pri vaji za ogrevalno krivuljo.
- Simulator: kondenzator je v notranji enoti pri splitu in v zunanji pri monobloku.
- Slovar: temperaturni senzor ni vedno NTC.
- Slovnični popravki.

### Pregled
- Dodan `docs/strokovni-pregled.md` – kontrolni seznam za strokovnega pregledovalca.
- Build zavrne lekcijo z `reviewed: true` brez navedbe pregledovalca (`reviewedBy`).
- Vse lekcije ostajajo označene »Vsebina še ni strokovno pregledana«, dokler jih ne pregleda mojster
  ali servisni inženir.

## 0.1.0 – 2026-10-12

- Astro ogrodje, objava na GitHub Pages, validacija vsebine po pravilih PRD.
- Lekcija 0.1 »Simptom, vzrok, meritev«, kvizi z razlagami, ponavljanje 1/3/7 dni.
- Svetli in temni način, delovanje brez povezave, deljenje.
