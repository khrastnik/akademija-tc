# Akademija toplotnih črpalk (Akademija TČ)

Brezplačna, odprta spletna pot od nič do serviserja in diagnostika toplotnih črpalk zrak–voda.
Kratke kartice, vaje in kvizi z razlagami – na telefonu, brez računa.

**Stran:** https://khrastnik.github.io/akademija-tc/

> Stran uči razumevanje in diagnostično razmišljanje. Ne nadomešča uradnega usposabljanja ne spričevala,
> ki ga zakonodaja zahteva za delo s hladivi.

## Kako deluje

Vsa vsebina je v datotekah – lekcijo dodaš brez programiranja:

```text
content/
  modules/modules.yaml     # 22 modulov (0–21) in faze
  modules/<modul>/*.md     # lekcije: YAML glava + 12 kartic (::card{type=...})
  quizzes/*.yaml           # kvizi z razlago vsakega odgovora in »Razumem vprašanje«
  glossary/*.yaml          # slovar pojmov (sl, en, kratica, razlaga, analogija)
  widgets/*.yaml           # podatki za vaje
data/refrigerants.json     # ena P-T tabela za vse – vsaka vrednost z virom
packages/engine/           # čiste funkcije (SH, SC, interpolacija), brez DOM
src/                       # Astro strani in Preact otoki (kviz, vaje, ponovitev)
```

`npm run build` najprej zažene `scripts/validate.mjs`, ki **zruši build**, če vsebina krši pravila PRD:
manjka kartica, kartica ima več kot 120 besed (zgodba 160), tabela je večja od 3×4, pojem ni v slovarju,
odgovor nima razlage, vprašanje nima »Razumem vprašanje« ali povezave na lekcijo, `buildsOn` ne obstaja …

## Razvoj

```bash
npm install
npm run dev        # http://localhost:4321/akademija-tc/
npm test           # engine + pravila vsebine
npm run build      # validacija + statična stran v dist/
```

Objava: vsak push na `main` zgradi in objavi stran prek GitHub Actions (`.github/workflows/deploy.yml`).

## Licenca

Koda: MIT (`LICENSE`). Vsebina (`content/`, `data/`): CC BY-NC-SA 4.0 (`LICENSE-CONTENT.md`).
