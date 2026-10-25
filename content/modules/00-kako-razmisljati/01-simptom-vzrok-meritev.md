---
id: m00-l01
module: m00
title: Simptom, vzrok, meritev
level: L1
minutes: 7
buildsOn: []
terms: [simptom, vzrok, meritev, hipoteza, diagnoza]
updated: 2026-10-12
reviewed: false
sources:
  - title: PRD »Spletna akademija« – obvezna diagnostična veriga in zlato pravilo
---

::card{type=goal}
Ločil boš **[[simptom]]** od **[[vzrok|vzroka]]** in spoznal sedem korakov, po katerih serviser išče napako.

Na koncu boš vedel, zakaj »visok tlak« ni diagnoza.

::card{type=story}
Petek zvečer. Stranka pokliče: »Radiatorji so komaj mlačni, črpalka pa ves čas brni.«

Prvi serviser pride, pogleda in reče: »Malo hladiva manjka.« Dolije hladivo in odide. V ponedeljek stranka spet kliče – nič se ni spremenilo.

Drugi serviser najprej vpraša, kdaj se je začelo in kaj se je takrat spremenilo. Pogleda termostat. Pogleda manometer na vodnem krogu. Izmeri temperaturo vode, ki gre v radiatorje, in tisto, ki se vrača. Šele nato odpre filter vodnega kroga – poln je umazanije.

Prvi je popravljal **simptom**. Drugi je našel **vzrok**.

::card{type=what}
**[[simptom|Simptom]]** je to, kar opaziš ali kar ti pove stranka: mlačni radiatorji, led na zunanji enoti, koda napake na zaslonu.

**[[vzrok|Vzrok]]** je tisto, kar simptom povzroča: zamašen filter, napačna nastavitev, okvarjen senzor.

**[[meritev|Meritev]]** je številka, ki jo odčitaš z instrumenta. Meritev je most med simptomom in vzrokom.

::card{type=imagine}
Pomisli na zdravnika. Vročina je simptom. Zdravnik ne reče »imate vročino, vzemite tableto proti vročini« in konec. Izmeri, vpraša, posluša – in šele nato pove, ali je kriva gripa ali vnetje.

Tableta proti vročini skrije simptom. Bolezen ostane.

Serviser, ki dolije hladivo, ker »je tlak čuden«, je kot zdravnik, ki da tableto brez pregleda.

::card{type=why}
Zakaj ena napaka pokaže več simptomov in en simptom ima več vzrokov?

1. Toplotna črpalka je **en zaprt sistem** – vse je povezano z vsem.
2. Če se nekje zmanjša pretok vode, črpalka toplote ne more oddati.
3. Zato se v krogu hladiva dvigne tlak in na zaslonu se pojavi koda »visok tlak«.
4. Isto kodo pa lahko povzroči tudi umazan izmenjevalnik, preveč hladiva ali zrak v vodnem krogu.
5. Zato iz enega simptoma ne moreš sklepati na vzrok. Potrebuješ **meritve** in **vzorec**.

::card{type=widget id=simptom-vzrok}
Razvrsti vsako trditev: je to simptom, meritev ali vzrok? Dotakni se trditve in izberi skupino.

::card{type=numbers}
Številka sama ne pove nič. Vsaka [[meritev]] potrebuje štiri stvari:

1. **Kaj** si izmeril (temperatura, tlak, tok).
2. **Kje** si izmeril (na katerem vodu, pred ali za katero komponento).
3. **Pri kakšnih pogojih** (zunanja temperatura, koliko časa črpalka že teče).
4. **S čim jo primerjaš** – z normalnim območjem iz navodil proizvajalca te naprave.

Normalne vrednosti niso univerzalne. Odvisne so od hladiva, obratovalne točke in proizvajalca, zato jih v tej akademiji vedno najdeš z virom.

::card{type=measure}
V tej lekciji meriš samo **z očmi in brez odpiranja naprave** – to sme vsak:

- odčitaj nastavitev termostata in način delovanja na upravljalniku,
- odčitaj tlak vode na manometru vodnega kroga,
- zapiši kodo napake natanko tako, kot piše,
- poglej, ali je zunanja enota zasuta, zaledenela ali ovirana.

Vse, kar zahteva odpiranje ohišja, delo na električni napeljavi ali priklop na krog hladiva, je delo za usposobljenega serviserja.

::card{type=field-error}
Najpogostejša napaka na terenu: **koda napake se prebere kot diagnoza.**

Na zaslonu piše »visok tlak«, serviser pa takoj sklepa na hladivo. V resnici koda pove le, *kaj* je krmilnik zaznal – ne *zakaj*.

Druga pogosta napaka: preskok najlažjih korakov. Pred meritvami na krogu hladiva vedno najprej preveri **vodo, zrak in nastavitve**. Tam je velik del napak in tam je preverjanje hitro.

::card{type=remember}
> **»Visok tlak« je simptom, ne vzrok.**

Diagnostična veriga v sedmih korakih:

1. Simptom – kaj opaziš
2. Najlažje najprej – voda, zrak, nastavitve
3. Meritev
4. Vzorec – katere meritve skupaj kažejo isto smer
5. Vzrok
6. Popravilo
7. Preverjanje – ali je simptom res izginil

::quiz{ref=m00-l01-q}

::card{type=next}
**Povzetek v treh točkah**

- Simptom vidiš, vzrok dokažeš z meritvami.
- Najprej preveri najlažje: voda, zrak, nastavitve.
- Popravilo ni konec – konec je preverjanje.

**Kaj sledi:** v modulu 1 spoznaš, kako toplotna črpalka sploh greje – in zakaj tudi pri mrazu. Kasneje bomo iz več meritev sestavljali **vzorec** in postavljali **[[hipoteza|hipoteze]]**.
