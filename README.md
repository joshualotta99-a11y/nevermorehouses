# Nevermore Academy website

Statische prototypewebsite voor DP12 op basis van de aangeleverde documenten.

## Bestanden

- `index.html` bevat de pagina en de volledige toelatingsflow.
- `geschiedenis.html`, `campus.html` en `waarden.html` bevatten de detailpagina's binnen Over Nevermore.
- `styles.css` bevat de responsive dark-academia vormgeving.
- `script.js` bevat de interacties voor huizen, keuzes, AR-scan en aanmeldformulier.
- `assets/` bevat media uit het aangeleverde Word-document.

## Openen

Open `index.html` direct in een browser of gebruik een lokale server:

```bash
python3 -m http.server 4173 --directory outputs/nevermore-site
```

Daarna staat de website op `http://127.0.0.1:4173/`.

## Toelichting studentenhuizen

De studentenhuizen hebben elk een eigen betekenis gekregen, zodat de gebruiker zich beter kan identificeren met een huis. Hierdoor wordt de website persoonlijker en sluit de toelatingsroute beter aan op het idee dat de gebruiker zijn eigen plek binnen Nevermore ontdekt.

## Toelichting Over Nevermore

De sectie Over Nevermore heeft nu drie verdiepende detailpagina's: Geschiedenis, Campus en Waarden. Hierdoor kan de gebruiker vanuit scanbare kaarten doorklikken naar extra achtergrondinformatie, terwijl de visuele stijl van de website consistent blijft.
