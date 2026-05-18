# Originalset-Spotcheck 2026-05-15 Reorder/Counter/Runlock

## Status

- Job: `spotcheck-2026-05-15-reorder-counter-runlock`
- Status: umgesetzt, geprüft und lokal committed
- Karten: `Too Many Doors`, `Chicago Branch`, `Fatal Attractor`, `I Spy`, `Shock.r`, `D'Arc Knight`, `Corporate Retreat`, `Liche`, `Razor Wire`, `Vapor Ops`

## Umsetzung

- `Too Many Doors`: kurze R&D mit 0/1 Karte ist jetzt ein stabiler No-op mit Hidden-Zone-Barriere statt Fehler; private R&D-Reorder-Choice bleibt Korp-only.
- `Chicago Branch` und `Vapor Ops`: V1.9.19-Counter-Aktionen ergänzen `sourceDefinitionId` im öffentlichen Payload, damit Chronik/Replay die rezzed Quelle sauber zuordnen können.
- Neue Engine-Spotcheck-Abdeckung für Hidden-Zone-Leakscans, manipulierte Choices, gebrochene Subroutinen, kurze R&D, I-Spy-Reveal, Fatal-Attractor-/Shock.r-Flag-Lifetime, D'Arc-Knight-/Razor-Wire-/Liche-Subroutinegrenzen sowie source-bound Counter-/Agenda-Aktionen.

## Checks

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm typecheck`

Alle Checks bestanden am 2026-05-15.

## Ergebnis

Keine neue Karte wurde promotet. Die bestehenden Resolver bleiben releasekonform; die Nacharbeit schließt Härtungs- und Regressionslücken in Engine, PublicPayload, Hidden-Info-Schutz und Replay/StateHash.
