---
id: m08-l01
module: m08
title: Podhlajevanje – SH in SC berimo skupaj
level: L3
minutes: 9
buildsOn: [m07-l01]
terms: [podhlajevanje, pregrevanje, nasicenje]
updated: 2026-10-25
reviewed: false
sources:
  - title: Kurikulum »Akademija za diagnostiko TČ« – modul 8
---

::card{type=goal}
Izračunal boš **[[podhlajevanje]]** in ga skupaj s **[[pregrevanje|pregrevanjem]]** uporabil, da ločiš »premalo hladiva« od »zatikajočega ventila«.

::card{type=story}
Isti teden dva klica, oba z visokim pregrevanjem.

Pri prvi napravi je podhlajevanje nizko. Hladiva res manjka – serviser najde puščanje.

Pri drugi je podhlajevanje visoko. Hladiva je dovolj, a se nabira pred ekspanzijskim ventilom, ki se zatika.

Brez podhlajevanja bi obakrat dolil hladivo. Pri drugi napravi bi s tem naredil novo napako: preveč hladiva.

::card{type=what}
**[[podhlajevanje|Podhlajevanje SC]]** je **[[nasicenje|temperatura kondenzacije]]** (iz tlaka na visokotlačni strani) minus temperatura tekočinskega voda.

Pove, za koliko se je tekočina ohladila, potem ko se je vsa para že utekočinila.

Več tekočine v kondenzatorju pomeni višji SC.

::card{type=imagine}
Predstavljaj si kopalnico po tuširanju. Para se na hladnem ogledalu spremeni v kapljice. Kapljice stečejo navzdol in se na poti še malo ohladijo.

Več kot je vode na ogledalu, daljšo pot naredi in bolj se ohladi.

Kondenzator je ogledalo, podhlajevanje pa ta zadnja ohladitev.

::card{type=why}
Zakaj SC loči napake, ki jih SH ne?

1. V kondenzatorju se para utekočini pri temperaturi nasičenja.
2. Tekočina se na poti do izhoda še ohladi – to je podhlajevanje.
3. Premalo hladiva: v kondenzatorju skoraj ni tekočine, SC je nizek.
4. Zožitev pred uparjalnikom: hladivo se nabira v kondenzatorju, SC je visok.
5. Oboje ima visok SH – razlikuje ju šele SC.

::card{type=widget id=visok-nizek-sc}
Kaj povzroči visoko in kaj nizko podhlajevanje?

::card{type=numbers}
Primer za računanje: temperatura kondenzacije 38 °C, tekočinski vod 34 °C – SC je **4 K**.

| Vzorec | SH | SC |
|---|---|---|
| Premalo hladiva | visok | nizek |
| Zatikajoč ventil | visok | visok |
| Preveč hladiva | normalen | visok |

Normalna območja za tvojo napravo so v navodilih proizvajalca.

::card{type=measure}
Potrebuješ:

- manometer na visokotlačni strani – iz tlaka dobiš temperaturo kondenzacije,
- sondo na tekočinskem vodu blizu izhoda kondenzatorja, izolirano,
- ustaljeno delovanje.

Priklop manometrov sme le **serviser s spričevalom**. Pri R290 (propan) brez virov vžiga in z detektorjem plina.

::card{type=field-error}
Najdražja napaka: **dolivanje hladiva samo zaradi visokega SH.**

Če je SC visok, hladiva ne manjka – dolivanje naredi preveč hladiva in prikrije pravi vzrok.

Druga napaka: SC izmerjen med odtajevanjem ali takoj po zagonu, ko se tekočina v kondenzatorju še premika.

::card{type=remember}
> **SH in SC beri vedno skupaj.**

- SC = T kondenzacije − T tekočinskega voda.
- Visok SH + nizek SC → premalo hladiva.
- Visok SH + visok SC → zožitev, npr. ventil.

::quiz{ref=m08-l01-q}

::card{type=next}
**Povzetek v treh točkah**

- Podhlajevanje pove, koliko tekočine je v kondenzatorju.
- SH in SC skupaj ločita napake, ki jih vsak sam ne more.
- Ne dolivaj hladiva brez SC.

**Kaj sledi:** v modulu 9 greš iz kroga hladiva v vodni krog – tam se skriva največ napak.
