---
id: m07-l01
module: m07
title: Pregrevanje – ali je uparjalnik lačen
level: L3
minutes: 9
buildsOn: [m06-l01]
terms: [pregrevanje, nasicenje]
updated: 2026-10-25
reviewed: false
sources:
  - title: Kurikulum »Akademija za diagnostiko TČ« – modul 7
---

::card{type=goal}
Izračunal boš **[[pregrevanje]]** iz dveh meritev in razložil, kaj pove o količini hladiva v uparjalniku.

::card{type=story}
Serviser s spričevalom priklopi manometer na nizkotlačni strani. Temperatura uparjanja je nizka. Sondo pritrdi na sesalni vod – ta je precej toplejši od temperature uparjanja.

»Uparjalnik je lačen,« reče. »Hladivo zavre že na začetku, potem se para samo še greje.«

Še preden dolije karkoli, poišče vzrok. Na spoju pod pokrovom najde temen oljni madež – puščanje.

::card{type=what}
**[[pregrevanje|Pregrevanje SH]]** je temperatura sesalnega voda minus **[[nasicenje|temperatura nasičenja]]** na nizkotlačni strani.

Pove, za koliko se je para segrela potem, ko je vse hladivo v uparjalniku že zavrelo.

Majhno pregrevanje pomeni, da je bila tekočina skoraj do konca uparjalnika. Veliko pomeni, da je zavrela že zgodaj.

::card{type=imagine}
Pomisli na lonec vode na štedilniku. Dokler je v njem voda, ostaja pri vrelišču, čeprav ga greješ.

Ko vsa voda izhlapi, se prazen lonec začne hitro segrevati.

Uparjalnik je lonec. Pregrevanje pove, kako dolgo je bil že »prazen«.

::card{type=why}
Zakaj malo hladiva pomeni visoko pregrevanje?

1. V uparjalniku hladivo vre pri temperaturi nasičenja.
2. Dokler je tekočina, se temperatura ne dviga.
3. Ko vsa tekočina zavre, para dobiva še toploto in se segreje.
4. Malo hladiva zavre že na začetku – para se greje dolgo pot, zato je SH visok.
5. Preveč hladiva pride skoraj do konca – SH je nizek, kapljice lahko dosežejo kompresor.

::card{type=widget id=visok-nizek-sh}
Kaj povzroči visoko in kaj nizko pregrevanje?

::card{type=numbers}
Primer za računanje, ne normalna vrednost: temperatura uparjanja −6 °C, sesalni vod −1 °C.

SH = −1 − (−6) = **5 K**.

Pazi na predznake: odštevanje negativnega števila je prištevanje.

Normalno območje pregrevanja za tvojo napravo je v navodilih proizvajalca. Pri elektronskem ekspanzijskem ventilu ga krmilnik uravnava sam – zato je nenavaden SH še posebej zgovoren.

::card{type=measure}
Potrebuješ:

- manometer na nizkotlačni strani – iz tlaka dobiš temperaturo uparjanja,
- termometer s sondo na sesalnem vodu, blizu mesta manometra, izoliran,
- ustaljeno delovanje, ne med odtajevanjem.

Priklop manometra je poseg v krog hladiva – **samo serviser s spričevalom**. Pri hladivu R290 (propan, vnetljiv) veljajo dodatna pravila: brez virov vžiga, z detektorjem plina.

::card{type=field-error}
Pogoste napake pri pregrevanju:

1. **Napačen predznak** pri temperaturah pod ničlo.
2. **Sonda na napačnem mestu** – daleč od manometra, na toplem delu ohišja.
3. **Merjenje med odtajevanjem** – tok hladiva je takrat obrnjen.
4. **Dolivanje samo po SH.** Visok SH ima več vzrokov. Šele podhlajevanje (modul 8) pove, ali res manjka hladiva.

::card{type=remember}
> **SH = T sesalnega voda − T uparjanja.**

- Visok SH → uparjalnik je lačen.
- Nizek SH → preveč tekočine, nevarno za kompresor.
- SH sam ne pove vzroka.

::quiz{ref=m07-l01-q}

::card{type=next}
**Povzetek v treh točkah**

- Pregrevanje pove, kako zgodaj je hladivo zavrelo.
- Računaš ga iz tlaka in temperature sesalnega voda.
- Visok SH ima več vzrokov – potrebuješ še SC.

**Kaj sledi:** v lekciji 7.2 spoznaš drugo stran – zakaj je tudi prenizko pregrevanje nevarno.
