# Spremembe

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
