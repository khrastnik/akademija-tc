# Strokovni pregled vsebine – navodila za pregledovalca

Akademija TČ je javna in uči ljudi, ki bodo nekoč delali na pravih napravah. Vsako lekcijo mora pred
odstranitvijo oznake »Vsebina še ni strokovno pregledana« pregledati **mojster ali servisni inženir za
toplotne črpalke** (PRD, razdelek »Varnost, pravna opozorila in točnost vsebine«).

Ta dokument ti prihrani čas: za vsako lekcijo našteje trditve, kjer je napaka najbolj verjetna ali
najbolj nevarna. Preberi celotno lekcijo, a te točke preveri posebej skrbno.

## Kako označiš lekcijo kot pregledano

V glavi lekcije (`content/modules/<modul>/<lekcija>.md`) nastavi:

```yaml
reviewed: true
reviewedBy: Ime Priimek, mojster za TČ (datum pregleda)
```

Build zavrne `reviewed: true` brez `reviewedBy`. Ko je lekcija označena, oznaka na strani izgine.
Ime pregledovalca se z njegovim dovoljenjem navede na strani (PRD, točka 5 odločitev).

Napake javi kot issue z oznako lekcije (npr. »7.2«) ali jih popravi neposredno s pull requestom.

## Splošno za vse lekcije

- Številke so **računski primeri**, ne normalne vrednosti. Preveri, da nikjer ni zapisana »normalna«
  vrednost brez napotila na navodila proizvajalca.
- Opozorila o spričevalu, R290 in elektriki – so tam, kjer morajo biti, in ne učijo posega, ki ga
  sme opraviti le usposobljena oseba?
- Izrazi: najprej slovensko, v oklepaju angleško in kratica (SH, SC, ΔT, EEV, COP).

## Lekcije in točke z največjim tveganjem

| Lekcija | Preveri posebej |
|---|---|
| 0.1 Simptom, vzrok, meritev | Vrstni red diagnostične verige (7 korakov). |
| 0.2 Najlažje najprej | Ali je »voda, zrak, nastavitve« res smiseln prvi sklop za TČ zrak–voda v praksi. |
| 1.1 Greti z mrzlim zrakom | Razlaga grelnega števila; »elektrika kompresorja postane toplota, a manjši del«. |
| 1.2 Monoblok ali split | Kje je kondenzator; zaščita pred zmrzaljo pri monobloku; spoji na terenu pri splitu. |
| 2.1 Štiri postaje | Smer toka in stanje hladiva v vaji »stanje hladiva« (8 mest). |
| 2.2 Ko postaja odpove | Smer tlakov za vsako postajo; »kompresor ne stiska → premajhna razlika tlakov«. |
| 3.1 Termometer meri sebe | Infrardeči termometer in emisivnost; postopek merjenja s sondo. |
| 4.1 Tlak | Razlaga vrenja s parnim tlakom; drsenje temperature pri R407C (rosišče za SH, vrelišče za SC). |
| 5.1 Pretok | »Premalo vode → visok tlak, premalo zraka → nizek tlak«. |
| 6.1 ΔT | Sorazmernost toplote s pretokom in ΔT; primer s podvojitvijo ΔT. |
| **7.1 Pregrevanje** | **Vzroki za visok in nizek SH v vaji – pri napravah z EEV.** |
| **7.2 Prenizko pregrevanje** | **Znaki tekočine v kompresorju: hladen tlačni vod; ivje na sesalnem vodu pozimi kot normalno.** |
| **8.1 Podhlajevanje** | **Tabela vzorcev SH/SC (premalo hladiva, zatikajoč ventil, preveč hladiva).** |
| **8.2 Polnjenje po teži** | **Postopek: puščanje → vakuum → polnjenje po teži → evidenca.** |
| 9.1 Vodni krog | Raztezna posoda kot vzrok kapljanja varnostnega ventila. |
| 10.1 Elektrika | Napetost v inverterju po izklopu; meja med lastnikom in usposobljeno osebo. |
| 11.1 Senzorji | Zunanji senzor na soncu / nad izpuhom; primerjava s termometrom. |
| 12.1 Krivulja in odtajevanje | Strmina proti premiku; opis normalnega odtajevanja. |
| 13.1 Obhod naprave | Vrstni red obhoda. |
| 14.1 Merilna oprema | Osnovni komplet opreme; kaj sme le usposobljena oseba. |
| **15.1 Primer 1** | **Celotna veriga primera »zamašen filter«; ocena pretoka iz ΔT.** |
| **15.2 Primer 2** | **Celotna veriga primera »puščanje«; primer številk SH 15 K / SC 1 K.** |
| 16.1 Hipoteze | Vaja »potrdi ali ovrzi«. |
| 17.1 Dve napaki | Vaja »preveri naprej ali zaključi«. |
| 18.1 Napake meritev | Razvrstitev napak (instrument, namestitev, trenutek). |
| 19.1 Servisni obisk | Struktura poročila; evidence posegov. |
| 20.1 Mirna glava | Rutina pri neznani kodi. |
| **21.1 Samostojno delo** | **Vse trditve o spričevalu, dejavnosti in zakonodaji – preveri pri pristojnem organu.** |

Krepko označene lekcije pregledaj najprej: tam napačna razlaga lahko vodi v napačen poseg v krog hladiva.

## 3D simulator

- `content/sim/faults.yaml` – vzorec, vzrok, popravilo in preverjanje za 11 napak.
- `packages/engine/src/sim.ts` – učni model: v katero smer se ob vsaki napaki premaknejo meritve.
  Testi v `tests/sim.test.ts` zapišejo vzorce, ki jih igra uči – če je kateri napačen, popravi tudi test.
- `content/sim/parts.yaml` – opisi 20 delov naprave.

## Kaj je bilo že popravljeno ob samopregledu (različica 0.2.0)

Glej `CHANGELOG.md`. Samopregled je opravil avtor vsebine in **ni** strokovni pregled.
