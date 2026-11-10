# Spremembe

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
