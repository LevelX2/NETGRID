# AI Play-Strength Weight Calibration Notes 2026-06-11

## Status

`diagnostic_baseline`

## Zweck

Die Kalibrierungsbaseline macht die aktuellen Score-Komponenten messbar, ohne neue Gewichtungen produktiv zu aktivieren.

## Gemessene Größen

- `averageTopScore`: durchschnittlicher Score der Top-Shadow-Action.
- `blockedActionCount`: Anzahl der vom Shadow-Ranking abgelehnten Actions.
- `mistakeCountByClass`: Mistake-Taxonomy-Zählung über Shadow-Traces.
- `agreementWithRuntime`: Agreement zwischen Runtime-Action und Shadow-TopAction.
- `scoreComponentContribution`: aggregierte Delta-Beiträge je Score-Komponente.

## Grenzen

- Keine produktive Gewichtungsänderung.
- Kein Runtime-Cutover.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.
- Die Werte dienen als Ausgangspunkt für spätere Holdout-/Selfplay-Vergleiche.
