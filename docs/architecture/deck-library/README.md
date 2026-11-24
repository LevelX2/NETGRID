# Deckbibliothek

`docs/architecture/deck-library/` enthält Architektur- und Konzeptunterlagen zur lokalen Deckbibliothek.

## Enthaltene Artefakte

- `local-file-deck-library-2026-05-07.md`
- `standard-deck-guide-validation.md`
- `format-validation.md`: gemeinsame Profil- und Corp-Agenda-Validierung

## Profile für Standarddecks

`scripts/score-standard-decks.ts` erzeugt einen sortierbaren HTML-Bericht mit
zehn Kennzahlen für jede Seite. Die Rubrik und die Gewichte liegen in
`scripts/lib/standard-deck-scoring.ts`. Die Auswertung kombiniert den aktiven
Standarddeck-Katalog, strukturierte Kartenmerkmale und ausgewählte
Planungshinweise. Sie wird außerhalb des Spiels berechnet. Die Resultate
beschreiben den Deckbau und liefern keine Siegprognose.

```powershell
node --import tsx scripts/score-standard-decks.ts docs/Berichte/NETGRID-Standarddeck-Scoring.html
```

Nach dem Ausgabepfad können Deckimporte als zusätzliche Testprofile folgen.
Die Referenz für die Sondermechanik sind die aktiven Standarddecks derselben
Seite. Die optionalen Importe beeinflussen diese Referenz nicht. Pro Achse
stehen die Modellwerte und die beitragenden Karten im Profil jedes Decks.
