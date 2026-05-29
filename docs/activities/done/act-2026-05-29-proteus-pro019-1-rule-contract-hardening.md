---
activityId: act-2026-05-29-proteus-pro019-1-rule-contract-hardening
status: done
kind: hardening
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-29
startedAt: 2026-05-29
completedAt: 2026-05-29
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO019-1
proReferences:
  - PRO019
  - PRO019-1
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/access/breach-state.ts
  - packages/engine/src/game/run/run-duration-payment.ts
  - packages/engine/src/game/run/run-rez-window.ts
  - packages/engine/src/game/choices/pending-choice-resolution.ts
  - packages/engine/src/card-implementations/proteus/corp/upgrades/simon-francisco.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index-tests/proteus/rule-contract-baseline-utilities.test.ts
  - docs/releases/proteus/proteus-cardimplementation-detailplan-2026-05-26.md
  - docs/releases/proteus/proteus-activity-status-2026-05-26.md
  - docs/releases/proteus/README.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles Proteus"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/rule-contract-baseline-utilities.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
---

# Proteus PRO019-1: Rule-Contract Hardening

## Ergebnis

PRO019-1 härtet die vier Review-Findings aus PRO019 ohne neue Kartenpromotion. Der Proteus-Stand bleibt 154/154 konkrete CardImplementation-Dateien, 0 fehlend, 0 Drift; keine Proteus-Karte wird decklegal, formatlegal oder AI-unterstützt.

## Gehärtete Verträge

- `Simon Francisco`: Zentrale Root-Upgrades in HQ und R&D werden vor gespeicherten HQ-/R&D-Karten in die Breach-Queue aufgenommen. Simon kann dadurch tatsächlich accessed werden und reduziert genau eine spätere noch pending gespeicherte zentrale Access-Position; bereits abgearbeitete Positionen bleiben unverändert.
- `Pavit Bharat`: Root-Rez-LegalActions entstehen nur am Serverzugang des konkreten Remote-Forts und nur, wenn genug legale HQ-Ersatzkarten vorhanden sind. Mehrdeutige Ersetzungen öffnen eine Korp-private HQ-Auswahl; Resolve revalidiert Quelle, Fort, Anzahl, Duplikate, HQ-Zugehörigkeit und Installlegalität.
- `Obfuscated Fortress`: Der runweite Spend-Cap-Recorder zählt neben Run-Duration-Zahlungen auch Runner-Trace-/Link-Zahlungen und Access-Trash-Kosten während eines Runs gegen die Ansage. Überschreitungen werden beim Resolve/Payment abgelehnt.
- `Ice and Data Special Report`: Die Choice ist zweistufig fortgebunden: erst Data Fort wählen, danach 0 bis 5 verdeckte Karten in oder auf diesem Fort auswählen. Mehr-Fort-Auswahlen sind nicht mehr Teil der normalen Endauswahl.

## Nachweis

Fokussierte PRO019-Tests decken HQ-/R&D-Simon, Pavit-Window/Choice/Invalid-Selection/Replacement, Trace-Cap-Revalidierung und Ice-and-Data-Fortbindung ab. Betroffene Access-, Run-, Trace-, Choice- und View-Tests laufen ergänzend.
