---
id: m10-l01
module: m10
title: Elektrika – kaj smeš in česa ne
level: L1
minutes: 7
buildsOn: [m09-l01]
terms: [inverter]
updated: 2026-10-25
reviewed: false
sources:
  - title: Kurikulum »Akademija za diagnostiko TČ« – modul 10, varnostna pravila PRD
---

::card{type=goal}
Razumel boš, zakaj je elektronika toplotne črpalke nevarna tudi po izklopu – in kje je meja med tem, kar smeš sam, in delom za usposobljeno osebo.

::card{type=story}
Stranka je izklopila varovalko, odvila pokrov zunanje enote in hotela »samo pogledati ploščo«. Na srečo se ni ničesar dotaknila.

Serviser ji razloži: kondenzatorji v **[[inverter|inverterju]]** hranijo nevarno napetost še nekaj časa po izklopu. Varovalka je izklopljena – plošča pa še ni varna.

»Izklop ni isto kot varno,« reče. »Varno je šele, ko usposobljena oseba izmeri, da napetosti ni.«

::card{type=what}
Toplotna črpalka je priključena na omrežno napetost. Kompresor poganja **[[inverter]]**, ki spreminja njegovo hitrost.

V inverterju so kondenzatorji, ki shranjujejo enosmerno napetost. Po izklopu se praznijo počasi.

Ta lekcija te ne uči dela na elektriki. Uči te, kdaj se je ne dotakneš.

::card{type=imagine}
Predstavljaj si rezervoar vode na strehi. Zapreš glavni ventil vodovoda – rezervoar je še vedno poln.

Če odpreš pipo, voda priteče, čeprav je vodovod zaprt.

Kondenzatorji v inverterju so rezervoar. Tvoja roka bi bila pipa.

::card{type=why}
Zakaj je inverter nevaren tudi po izklopu?

1. Inverter iz izmenične omrežne napetosti naredi enosmerno.
2. Kondenzatorji jo shranjujejo, da kompresor teče gladko.
3. Po izklopu se praznijo počasi.
4. Napetost je lahko še nekaj časa nevarna za življenje.
5. Zato izklop ne dokaže, da je varno – dokaže to šele meritev usposobljene osebe.

::card{type=widget id=sme-ali-ne}
Razvrsti opravila: kaj sme narediti lastnik in kaj samo usposobljena oseba?

::card{type=numbers}
Omrežna napetost je 230 V ali 400 V. Enosmerna napetost v inverterju je lahko še višja – več sto voltov.

Koliko časa je treba počakati po izklopu, piše na nalepki naprave ali v navodilih proizvajalca. Tudi po tem času napetost izmeri usposobljena oseba, preden se česa dotakne.

::card{type=measure}
Kot lastnik lahko varno:

- odčitaš in fotografiraš kodo napake na zaslonu,
- fotografiraš tipsko ploščico (model, serijska številka),
- pogledaš, ali je varovalka v hišni omarici izklopljena,
- napravo izklopiš po navodilih proizvajalca.

**Ne odpiraj ohišij in ne meri napetosti.** To je delo za usposobljeno osebo z ustrezno opremo.

::card{type=field-error}
Dve nevarni napaki:

1. **»Izklopil sem, zdaj je varno.«** Kondenzatorji so lahko še nabiti.
2. **Ponavljajoče vklapljanje varovalke, ki izpada.** Če varovalka izpade večkrat zapored, to ni naključje – kaže na okvaro. Ne vklapljaj je na silo, pokliči serviserja.

::card{type=remember}
> **Izklop ni dokaz, da napetosti ni.**

- Inverter hrani napetost tudi po izklopu.
- Lastnik: zaslon, fotografija, varovalka – nič več.
- Varovalka, ki izpada, kaže na okvaro.

::quiz{ref=m10-l01-q}

::card{type=next}
**Povzetek v treh točkah**

- V inverterju je nevarna napetost tudi po izklopu.
- Ohišja odpira samo usposobljena oseba.
- Ponavljajoče izpadanje varovalke je znak okvare.

**Kaj sledi:** v modulu 11 spoznaš senzorje – oči krmilnika, ki včasih vidijo narobe.
