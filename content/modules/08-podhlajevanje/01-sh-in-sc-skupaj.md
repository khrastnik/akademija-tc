---
id: m08-l01
module: m08
title: Podhlajevanje – SH in SC berimo skupaj
level: L3
minutes: 9
buildsOn: [m07-l01]
terms: [podhlajevanje, pregrevanje, nasicenje]
updated: 2026-11-22
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
Primer, R32 pri ogrevanju (manometer kaže nadtlak, zato prišteješ 1 bar):

- nizka stran: 7,1 bar → 8,1 bar → vre pri 0 °C; cev v kompresor 6 °C → **SH 6 K**,
- visoka stran: 23,8 bar → 24,8 bar → utekočini se pri 40 °C; cev za kondenzatorjem 35 °C → **SC 5 K**.

Pogosto normalno: okoli 4–8 K SH in 3–7 K SC.

| Vzorec | SH | SC |
|---|---|---|
| Premalo hladiva | visok, npr. 15 K | nizek, 0–2 K |
| Zatikajoč ventil | visok, npr. 15 K | visok, npr. 10 K |
| Preveč hladiva | normalen ali nizek | visok, npr. 10 K |

Številke niso pri vseh napravah enake – odvisne so od ventila, zbiralnika tekočine, načina delovanja in zunanje temperature. Velja območje iz navodil proizvajalca.

::card{type=measure}
Kaj meriš, pove **mesto**: pregrevanje tam, kjer hladivo kot para pride iz uparjalnika, podhlajevanje tam, kjer kot tekočina pride iz kondenzatorja.

| | Tlak meriš | Tipalo daš | Računaš |
|---|---|---|---|
| Pregrevanje | na nizki strani (moder manometer) – pove, pri koliko stopinjah hladivo vre | na cev, ki pelje paro v kompresor | temperatura cevi minus temperatura vrenja |
| Podhlajevanje | na visoki strani (rdeč manometer) – pove, pri koliko stopinjah se para utekočini | na cev s tekočino za kondenzatorjem | temperatura utekočinjanja minus temperatura cevi |

Tipalo izoliraj, meri pri mirnem delovanju. Pri hlajenju enoti zamenjata vlogi – kje je kateri priključek, piše v navodilih.

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

**Kaj sledi:** v lekciji 8.2 izveš, zakaj se hladivo polni po teži in ne po tlaku.
