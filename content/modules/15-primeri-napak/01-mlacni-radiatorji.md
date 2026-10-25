---
id: m15-l01
module: m15
title: Primer – mlačni radiatorji in visok tlak
level: L4
minutes: 9
buildsOn: [m14-l01]
terms: [vzorec, simptom, diagnoza]
updated: 2026-10-25
reviewed: false
sources:
  - title: Kurikulum »Akademija za diagnostiko TČ« – modul 15, primer 1
---

::card{type=goal}
Rešil boš celoten primer po diagnostični verigi – od klica stranke do preverjanja – in videl, kako dve meritvi skupaj tvorita **[[vzorec]]**.

::card{type=story}
Klic iz starejše hiše v Celju: »Zjutraj je na zaslonu visok tlak, potem se naprava sama zažene. Radiatorji v nadstropju so mlačni.«

Na vprašanje, kaj se je spremenilo, stranka pove: »Pred mesecem smo zamenjali stare radiatorje.«

Serviserka si to zapiše. Stari radiatorji, stare cevi, menjava – v sistemu je bilo veliko rje in mulja, ki se je zdaj premaknil.

Še preden je vzela orodje v roke, ima prvo **[[hipoteza|hipotezo]]**.

::card{type=what}
**[[vzorec|Vzorec]]** sta dve ali več meritev, ki kažejo v isto smer.

V tem primeru:

- **[[simptom|simptom]]**: koda »visok tlak« in mlačni radiatorji,
- **vzorec**: velika ΔT vode skupaj z visokim tlakom na visokotlačni strani,
- **[[diagnoza]]**: premajhen pretok vode zaradi zamašenega filtra.

Več takih klicev lahko vadiš v [3D simulatorju](../../simulator/) v igri »Dan na terenu«.

::card{type=imagine}
Detektiv ne obtoži prvega, ki ga vidi blizu kraja zločina. Zbira sledi, dokler ne kažejo vse na istega.

Ena sled je sum. Dve, ki se ujemata, sta vzorec. Šele vzorec je dovolj za obtožbo.

::card{type=why}
Veriga, korak za korakom:

1. **Simptom**: visok tlak zjutraj, mlačni radiatorji, nedavna menjava radiatorjev.
2. **Najlažje najprej**: koda na zaslonu potrjena, tlak vode normalen.
3. **Meritev**: ΔT vode je več kot dvakrat večja kot ob prvem zagonu.
4. **Vzorec**: velika ΔT + visok tlak → premajhen pretok vode.
5. **Vzrok in preverjanje**: filter je poln mulja. Po čiščenju in odzračevanju se ΔT vrne, koda se ne ponovi.

::card{type=widget id=veriga-primera}
Razvrsti dele primera v pravi korak verige.

::card{type=numbers}
Primer za računanje: ob prvem zagonu je bila ΔT zapisana kot 5 K, danes pri podobni zunanji temperaturi 11 K.

To je več kot dvakrat več. Pretok je padel na manj kot polovico.

Primerjava z zapisnikom iste naprave je tu močnejša od katerekoli splošne tabele.

::card{type=measure}
V tem primeru je serviserka izmerila:

- kodo in nastavitve na zaslonu,
- tlak vode na manometru,
- dvižni in povratni vod pri ustaljenem delovanju,
- stanje filtra – zaprla ventila in ga odprla.

Manometrov na krogu hladiva ni priklopila: vzorec je bil jasen brez njih.

::card{type=field-error}
Kaj bi naredil začetnik?

Priklopil bi manometre, videl visoko temperaturo kondenzacije in pomislil: »Preveč hladiva.« Izpustil bi del hladiva.

Tlak bi za nekaj dni padel, naprava pa bi zdaj imela premalo hladiva – filter pa bi bil še vedno zamašen.

Visoka temperatura kondenzacije je tu **posledica**, ne vzrok.

::card{type=remember}
> **Vsak primer reši po isti verigi.**

1. Simptom in pogovor
2. Najlažje najprej
3. Meritev
4. Vzorec
5. Vzrok, popravilo, preverjanje

::quiz{ref=m15-l01-q}

::card{type=next}
**Povzetek v treh točkah**

- Pogovor s stranko je dal prvo hipotezo.
- Vzorec dveh meritev je dokazal vzrok.
- Preverjanje je potrdilo popravilo.

**Kaj sledi:** v lekciji 15.2 rešiš drugi primer – napako, ki se razvija leta.
