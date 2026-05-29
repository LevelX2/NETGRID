---
activityId: act-2026-05-29-proteus-pro019-rule-contract-baseline-utilities
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-29
startedAt: 2026-05-29
completedAt: 2026-05-29
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO019
proReferences:
  - PRO019
blockedBy: []
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/corp/operations/emergency-rig.ts
  - packages/engine/src/card-implementations/proteus/corp/operations/rent-to-own-contract.ts
  - packages/engine/src/card-implementations/proteus/corp/upgrades/herman-revista.ts
  - packages/engine/src/card-implementations/proteus/corp/upgrades/marcel-desoleil.ts
  - packages/engine/src/card-implementations/proteus/corp/upgrades/obfuscated-fortress.ts
  - packages/engine/src/card-implementations/proteus/corp/upgrades/pavit-bharat.ts
  - packages/engine/src/card-implementations/proteus/corp/upgrades/simon-francisco.ts
  - packages/engine/src/card-implementations/proteus/runner/events/ice-and-data-special-report.ts
  - packages/engine/src/index-tests/proteus/rule-contract-baseline-utilities.test.ts
  - data/manifests/proteus-card-support.json
  - docs/releases/proteus/proteus-cardimplementation-detailplan-2026-05-26.md
  - docs/releases/proteus/proteus-activity-status-2026-05-26.md
checks:
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/rule-contract-baseline-utilities.test.ts
---

# Proteus PRO019: Rule-Contract Baseline Utilities

## Zielkarten

- `onr_proteus_049_emergency-rig` Emergency Rig
- `onr_proteus_051_rent-to-own-contract` Rent-to-Own Contract
- `onr_proteus_060_herman-revista` Herman Revista
- `onr_proteus_064_marcel-desoleil` Marcel DeSoleil
- `onr_proteus_066_obfuscated-fortress` Obfuscated Fortress
- `onr_proteus_069_pavit-bharat` Pavit Bharat
- `onr_proteus_073_simon-francisco` Simon Francisco
- `onr_proteus_111_ice-and-data-special-report` Ice and Data Special Report

## Ergebnis

PRO019 schließt die letzte Proteus-CardImplementation-Restliste: Alle acht Zielkarten haben konkrete CardImplementation-Dateien, Registry-Einträge, Coverage-Mapping und passende Manifest-Promotion auf `implemented`, `engine_supported`, `playable` und `human_playable`. `deck_legal`, `format_legal` und `ai_supported` bleiben unverändert `false`.

Die führende Proteus-Zählung steht nach PRO019 bei 154/154 konkreten CardImplementation-Dateien, 0 fehlenden Dateien und 0 Drift zwischen Kartendaten, Registry und Manifest.

## Regelentscheidungen

- `Emergency Rig`: `X` muss positiv sein und wird lokal auf `1..max(1, Rez-Kosten des Ziel-ICE)` begrenzt. Die LegalActions binden Ziel-ICE, aktuelle Rez-Kosten, X und Obergrenze; `applyAction` revalidiert diese Werte.
- `Rent-to-Own Contract`: Die Term-Counter-Anzahl entspricht den aktuellen Rez-Kosten des Ziel-ICE. Der Start-of-Corp-turn-Lifecycle verliert bei mindestens 2 Korp-Credits `[2]` und entfernt einen Term-Counter, andernfalls wird ein Term-Counter hinzugefügt.
- `Herman Revista`: Am Start eines Runs auf dem Fort öffnet eine private Korp-Choice zur Neuordnung der ICE auf diesem Fort. Öffentliche Payloads nennen nur Count-/Fort-Informationen.
- `Marcel DeSoleil`: Die Aktivierung zahlt `[2]` und trasht die obersten zwei R&D-Karten als verdeckte Kosten. PublicPayloads redigieren die getrashten Identitäten.
- `Obfuscated Fortress`: Die Runner-Ansage gilt als runweite Obergrenze für Runner-Credit-Zahlungen über `spendRunnerRunCredits`. Die tatsächliche Summe wird im RunState gezählt; am Run-Ende verliert der Runner die nicht ausgegebene Differenz, gedeckelt durch aktuelle normale Credits.
- `Pavit Bharat`: Beim Rezzen nach dem letzten ICE eines subsidiary data fort werden alle ICE- und Root-Karten dieses Forts nach HQ deinstalliert und gleich viele legale HQ-Karten kostenlos in dieses Fort installiert. Öffentliche Payloads nennen Counts, nicht verdeckte HQ-Identitäten.
- `Simon Francisco`: Installation ist auf HQ oder R&D beschränkt. Nach Zugriff auf Simon wird eine spätere gespeicherte HQ-/R&D-Access-Queue-Position desselben Centrals übersprungen.
- `Ice and Data Special Report`: Die lokale Kostenangabe wird als Play-Cost 3 behandelt; `(0)` ist kein alternativer Kostenpfad. Der Effekt exposed bis zu fünf installierte Korp-Karten in oder auf einem einzelnen Data Fort über eine runnerprivate Choice.

## Nachweis

- Acht konkrete CardImplementation-Dateien sind registriert.
- `data/cards/proteus-cards.json` führt `Ice and Data Special Report` mit numerischen Kosten 3.
- `data/manifests/proteus-card-support.json` ist für die acht Zielkarten auf Engine-/Human-Playability ohne Deck-/AI-Freigabe aktualisiert.
- Fokussierte PRO019-Tests decken Free-Rez mit gebundenem X, Term-Counter nach Rez-Kosten, Ice-and-Data-Kosten/Choice, Replay und StateHash ab.
- Regressionen für Runtime-Deps, Install, Rez, Run-Payment, Run-End-Cleanup, Access-Flow und Hidden-Info-Pfade laufen ergänzend.
