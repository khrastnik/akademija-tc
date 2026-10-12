# Kako pomagati

Hvala! Akademija je odprta – napake lahko javi in popravi vsak.

## Javi napako

Na vsaki strani je povezava **»Javi napako«**, ki odpre prijavo na GitHubu. Napiši, kje je napaka, kaj je narobe
in kaj bi moralo pisati. Če gre za številko, dodaj vir.

## Popravi ali dodaj vsebino

1. Lekcije so v `content/modules/<modul>/*.md`, kvizi v `content/quizzes/`, slovar v `content/glossary/`.
2. Pred pull requestom zaženi `npm test` in `npm run build` – build zavrne vsebino, ki krši pravila.
3. Pravila pisanja (povzetek PRD):
   - ena ideja na kartico, največ 120 besed (zgodba 160);
   - vsak koncept ima »zakaj« v 3 do 5 korakih;
   - izrazi: najprej slovensko, v oklepaju angleško in kratica, nato le slovensko;
   - razlike temperatur v K, absolutne temperature v °C;
   - tabele največ 3 vrstice in 4 stolpci;
   - **vsaka številka ima vir** (priročnik proizvajalca, standard, CoolProp) – brez vira ni objave;
   - vsak odgovor v kvizu ima razlago, vsako vprašanje »Razumem vprašanje« in povezavo na lekcijo.

## Varnost

Nobena lekcija ne uči dela pod napetostjo 230/400 V ali posegov v hladilni krog brez usposobljenosti.
Pri R290 (propan) in pri inverterjih (nabiti kondenzatorji) je opozorilo na vsaki lekciji.

## Strokovni pregled

Moduli brez strokovnega pregleda (mojster ali servisni inženir) imajo oznako »Vsebina še ni strokovno pregledana«.
Če si strokovnjak za TČ in bi pregledal modul, odpri issue.
