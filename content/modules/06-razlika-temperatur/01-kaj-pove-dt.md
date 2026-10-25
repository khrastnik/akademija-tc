---
id: m06-l01
module: m06
title: Kaj pove razlika temperatur vode
level: L2
minutes: 7
buildsOn: [m05-l01]
terms: [delta-t, pretok]
updated: 2026-10-25
reviewed: false
sources:
  - title: Kurikulum »Akademija za diagnostiko TČ« – modul 6
---

::card{type=goal}
Iz dveh temperatur – dvižnega in povratnega voda – boš ocenil, ali voda teče dovolj hitro. Brez merilnika pretoka in brez manometrov.

::card{type=story}
Dva serviserja, isti klic: »Hiša je hladna.«

Prvi izmeri le dvižni vod. »Voda je topla, z napravo je vse v redu,« reče in odide.

Druga izmeri še povratni vod. Razlika je skoraj dvakrat večja kot ob prvem zagonu, zapisanem v servisni knjigi. Takoj ve: voda teče prepočasi. Čez pol ure je filter očiščen, hiša pa se greje.

Ena meritev več je bila razlika med »vse je v redu« in rešeno napako.

::card{type=what}
**[[delta-t|Razlika temperatur ΔT]]** je dvižni vod minus povratni vod.

Skupaj s **[[pretok|pretokom]]** pove, koliko toplote voda prenese iz naprave v radiatorje.

Pri isti moči velja: manjši pretok pomeni večjo ΔT, večji pretok pa manjšo.

::card{type=imagine}
Predstavljaj si, da nosiš drva iz drvarnice. Lahko narediš veliko poti s pol polno košaro ali malo poti s polno.

Če moraš prinesti enako drv, a smeš hoditi le redko, mora biti vsaka košara bolj polna.

Pretok je število poti, ΔT pa polnost košare.

::card{type=why}
Zakaj velika ΔT kaže na premajhen pretok?

1. Toplota, ki jo voda odnese, je sorazmerna s pretokom in z ΔT.
2. Črpalka v nekem trenutku odda določeno moč.
3. Če pretok pade, mora ΔT narasti, da voda odnese isto toploto.
4. Zato je nenavadno velika ΔT znak, da voda teče prepočasi.
5. Majhna ΔT pa pomeni velik pretok – ali pa da naprava odda malo toplote.

::card{type=widget id=velika-majhna-dt}
Kaj povzroči veliko in kaj majhno razliko temperatur vode?

::card{type=numbers}
Primer za računanje, ne normalna vrednost: dvižni vod 35 °C, povratni 30 °C – ΔT je 5 K.

Če pretok pri isti moči pade na polovico, se ΔT približno podvoji – na 10 K.

Ciljno ΔT in najmanjši pretok za tvojo napravo najdeš v navodilih proizvajalca. Zelo uporabna je tudi vrednost iz zapisnika prvega zagona: primerjaš z isto napravo.

::card{type=measure}
Kako izmeriš ΔT:

- dva termometra s sondo, na dvižni in povratni vod blizu notranje enote,
- sondi izolirani, cevi očiščeni,
- meritev pri ustaljenem delovanju, ne med odtajevanjem ali segrevanjem bojlerja.

Veliko naprav obe temperaturi kaže tudi na zaslonu. Primerjaj ju s svojima termometroma – senzor lahko laže.

::card{type=field-error}
Tri pogoste napake:

1. **Izmeriš samo dvižni vod.** Topla voda še ne pomeni, da je pretok prav.
2. **Meriš daleč od naprave**, za mešalnim ventilom – meriš mešanico, ne izhoda naprave.
3. **Meriš med preklopom na bojler.** Voda takrat teče drugam in ΔT nima pomena za ogrevanje.

::card{type=remember}
> **Velika ΔT = premalo pretoka.**

- ΔT = dvižni − povratni, v K.
- Pri isti moči manj pretoka pomeni večjo ΔT.
- Primerjaj s prvim zagonom iste naprave.

::quiz{ref=m06-l01-q}

::card{type=next}
**Povzetek v treh točkah**

- Dve temperaturi povesta več kot ena.
- Nenavadno velika ΔT kaže na premajhen pretok.
- Meri blizu naprave in pri ustaljenem delovanju.

**Kaj sledi:** v modulu 7 se lotiš krogotoka hladiva – pregrevanja, najpomembnejše številke za uparjalnik.
