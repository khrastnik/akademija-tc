---
id: m07-l02
module: m07
title: Prenizko pregrevanje in kompresor
level: L3
minutes: 8
buildsOn: [m07-l01]
terms: [pregrevanje, kompresor]
updated: 2026-10-25
reviewed: false
sources:
  - title: Kurikulum »Akademija za diagnostiko TČ« – modul 7
---

::card{type=goal}
Razumel boš, zakaj je prenizko **[[pregrevanje]]** nevarno za **[[kompresor]]**, kaj ga povzroči in katere namige vidiš brez instrumentov.

::card{type=story}
Pozimi serviser opazi, da je tlačni vod za kompresorjem komaj topel – mnogo hladnejši kot ob prvem zagonu. Kompresor zveni drugače kot običajno, bolj grobo.

Na zaslonu ni nobene kode. Naprava greje.

Serviser s spričevalom izmeri pregrevanje: skoraj nič. V kompresor prihaja mešanica pare in kapljic. Senzor na sesalnem vodu je zdrsnil iz objemke, zato krmilnik odpira ventil vse bolj. Če bi tako delovalo še mesece, bi bil kompresor uničen.

::card{type=what}
**Prenizko pregrevanje** pomeni, da se para po izhodu iz uparjalnika skoraj nič ne segreje – ker je tekočina segla do samega konca uparjalnika ali še čez.

Takrat lahko kapljice tekočega hladiva pridejo do kompresorja. Kompresor je narejen za stiskanje pare, ne tekočine.

Ločevalnik kapljevine pred kompresorjem del kapljic ujame – a ni narejen za stalno poplavo.

::card{type=imagine}
Predstavljaj si tlačilko za kolo. Z zrakom jo stisneš brez težav.

Če pa vanjo pride voda, se bat ustavi z udarcem – vode ne moreš stisniti.

Kompresor s kapljicami hladiva doživlja te udarce znova in znova.

::card{type=why}
Zakaj je prenizko pregrevanje nevarno?

1. Kompresor stiska paro, tekočine pa ni mogoče stisniti.
2. Pregrevanje je varnostni rob: zagotovi, da je vse hladivo že zavrelo.
3. Ko je pregrevanje skoraj nič, tekočina doseže konec uparjalnika.
4. Kapljice gredo v kompresor, izpirajo olje in obremenjujejo dele.
5. Poškodba nastaja počasi in tiho – brez kode na zaslonu.

::card{type=widget id=varno-nevarno-sh}
Za vsako stanje odloči: je za kompresor varno ali nevarno?

::card{type=numbers}
Varno območje pregrevanja določi proizvajalec v navodilih. Pri elektronskem ekspanzijskem ventilu ga krmilnik vzdržuje sam – zato je stalno prenizko pregrevanje znak, da nekaj ne dela prav: ventil, senzor ali pretok zraka.

Primer za razumevanje: če je sesalni vod enako mrzel kot temperatura uparjanja, je SH nič – ni več varnostnega roba.

Ker kapljice tekočine kompresor ohladijo, je pri tem tudi tlačni vod hladnejši kot običajno.

::card{type=measure}
Namigi, ki zahtevajo previdnost:

- tlačni vod za kompresorjem je nenavadno hladen v primerjavi z zagonom,
- spremenjen, bolj grob zvok kompresorja.

Ivje na sesalnem vodu pozimi **ni** zanesljiv znak – pri ogrevanju je ta vod pod ničlo tudi pri normalnem pregrevanju.

Za dokaz potrebuješ manometer in sondo – **samo serviser s spričevalom**. Pri R290 brez virov vžiga in z detektorjem plina.

::card{type=field-error}
Dve napaki:

1. **»Hladno pomeni dobro.«** Hladen tlačni vod ni znak zdrave naprave, ampak lahko pomeni, da v kompresor prihaja tekočina.
2. **Spregledan senzor.** Elektronski ventil uravnava pregrevanje po senzorju na sesalnem vodu. Če senzor ne meri cevi, krmilnik misli, da je pregrevanje višje, kot je – in ventil odpre še bolj.

::card{type=remember}
> **Pregrevanje je varnostni rob kompresorja.**

- Prenizko → kapljice v kompresor.
- Namig: nenavadno hladen tlačni vod, grob zvok.
- Pogost vzrok: ventil ali senzor, ki ga vodi.

::quiz{ref=m07-l02-q}

::card{type=next}
**Povzetek v treh točkah**

- Kompresor stiska paro, ne tekočine.
- Prenizko pregrevanje poškoduje počasi in tiho.
- Hladen tlačni vod je opozorilo, ne pohvala.

**Kaj sledi:** v modulu 8 spoznaš podhlajevanje – drugo polovico slike.
