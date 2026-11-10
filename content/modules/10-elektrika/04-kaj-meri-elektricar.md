---
id: m10-l04
module: m10
title: Kaj meri električar ali serviser – kje in s čim
level: L3
minutes: 9
buildsOn: [m10-l03]
terms: [multimeter, klesce, senzor, inverter]
updated: 2026-11-10
reviewed: false
sources:
  - title: Kurikulum »Akademija za diagnostiko TČ« – modul 10, varnostna pravila PRD
---

::card{type=goal}
Spoznal boš, katere električne meritve na toplotni črpalki opravi **usposobljena oseba**, s katerim instrumentom in na katerem mestu – da veš, kaj pričakovati, kaj vprašati in česa se ne lotiš sam.

**Te meritve niso za lastnika.**

::card{type=story}
Naprava je mrtva. Prejšnji serviser je predlagal novo krmilno ploščo.

Drugi serviser najprej izmeri napajanje na priključnih sponkah – je v redu. Nato izklopi napravo, počaka predpisani čas in preveri, da je napetost v **[[inverter|inverterju]]** padla. Šele nato izmeri upornost senzorjev in tuljav.

Tuljava 4-potnega ventila je prekinjena. Del za nekaj deset evrov namesto plošče za nekaj sto.

::card{type=what}
Tipične meritve in mesta:

- **napajalne sponke** – ali je napetost sploh prisotna,
- **vodnik do kompresorja** – tok, s **[[klesce|kleščami]]**,
- **napetost v inverterju po izklopu** – da je padla, preden se česa dotakne,
- **senzorji** – upornost, pri izklopljeni napravi in odklopljenem konektorju,
- **tuljave ventilov** (4-potni, EEV, 3-potni) – upornost ali napetost ob ukazu,
- **kompresor in zaščitni vodnik** – izolacijska upornost in neprekinjenost.

::card{type=imagine}
Zdravnik na urgenci najprej preveri, ali pacient diha. Šele nato posluša srce in pregleda posamezne organe.

Električna diagnoza gre enako: najprej napajanje, nato varnost, nato posamezni deli.

::card{type=why}
Zakaj prav ta vrstni red?

1. Brez napajanja nima smisla iskati okvare naprej.
2. Pred dotikom elektronike je treba preveriti, da je napetost v inverterju padla.
3. Senzorje in tuljave se meri brez napetosti – tako je varneje.
4. Izmerjeno se primerja s tabelo proizvajalca za ta model.
5. Tako se najde poceni okvara, preden se zamenja drag del.

::card{type=widget id=meritev-instrument}
Za vsako meritev izberi instrument, ki ga usposobljena oseba uporabi.

::card{type=numbers}
Upornost senzorjev pri različnih temperaturah, upornost tuljav, tok kompresorja in čakalni čas po izklopu so v **servisnih navodilih proizvajalca** za točno ta model. Brez njih meritev nima s čim primerjati.

**[[multimeter|Multimeter]]** za hišno inštalacijo mora imeti ustrezno varnostno kategorijo – za razdelilne omarice CAT III ali višjo.

::card{type=measure}
**Ti tega ne meriš.** Kot lastnik lahko:

- poveš, kdaj se napaka pojavi in katera zaščita je padla,
- fotografiraš kodo napake in tipsko ploščico,
- serviserja vprašaš, katere meritve je opravil,
- zahtevaš, da rezultate zapiše v poročilo.

Dober serviser bo z veseljem razložil, kaj je izmeril in zakaj.

::card{type=field-error}
Dve napaki, ki ju delajo tudi poklicni:

1. **Menjava plošče brez merjenja senzorjev in tuljav.** Plošča je pogosto zdrava – pokvarjen je poceni del, ki ga plošča krmili.
2. **Klešče okoli celega kabla.** Tok v obeh vodnikih teče v nasprotnih smereh, zato se izniči – klešče pokažejo skoraj nič. Objeti morajo le en vodnik.

::card{type=remember}
> **Najprej napajanje, nato prazen inverter, nato deli brez napetosti.**

- Meritve opravi usposobljena oseba.
- Vrednosti iz servisnih navodil za ta model.
- Lastnik zapiše, fotografira in vpraša.

::quiz{ref=m10-l04-q}

::card{type=next}
**Povzetek v treh točkah**

- Električna diagnoza ima vrstni red: napajanje, varnost, deli.
- Pasivni deli se merijo brez napetosti.
- Lastnik ne meri, ampak zapiše in vpraša.

**Kaj sledi:** v lekciji 10.5 izmeriš sam – varno, na števcu – koliko porabi tvoja črpalka.
