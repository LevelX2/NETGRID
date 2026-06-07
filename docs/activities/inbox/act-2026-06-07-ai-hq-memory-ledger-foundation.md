---
activityId: act-2026-06-07-ai-hq-memory-ledger-foundation
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-06-07-ai-hq-memory-contract-matrix
resultArtifacts: []
checks: []
---

# HQ-Hand-Memory-Ledger als Grundlage einführen

## Ziel

`hqHandMemory` soll intern so modelliert werden, dass spätere Pakete sichere Restmengen und mehrdeutige Kandidatengruppen ausdrücken können, ohne die bestehenden KI-Consumer sofort groß umzubauen.

## Kontext und Quellen

- Vorgängerpaket: `act-2026-06-07-ai-hq-memory-contract-matrix`.
- Aktueller Engpass: `packages/ai/src/belief-state.ts` hält bekannte HQ-Karten als flache `knownDefinitions`-Liste und kann verdeckte Abgänge nur durch gezieltes Entfernen oder komplettes Leeren ausdrücken.
- Relevante Tests liegen vor allem in `packages/ai/src/index.test.ts`.

## Scope

- Internes Ledger für HQ-Hand-Wissen einführen oder vorbereiten, z. B. mit:
  - sicher bekannten Definitionseinträgen,
  - unbekanntem Restcount,
  - mehrdeutigen Kandidatengruppen,
  - Quellen- und Invalidierungsgründen.
- Bestehende externe Felder weiter ableiten:
  - `handCount`,
  - `knownDefinitions`,
  - `knownCount`,
  - `allCardsKnown`,
  - `sourceEventIds`,
  - `invalidationReasons`.
- Bestehende Verhaltenstests grün halten:
  - voller HQ-Look,
  - HQ-Zugriff,
  - Korp-Draw,
  - bekannte Karte wird gespielt/installiert.
- Neue fokussierte Tests ergänzen, die belegen, dass die Ledger-Ableitung keine Hidden-Info aus Engine-State, `cardInstances`, `privatePayload` oder Decklisten nutzt.

## Nicht im Scope

- Noch keine fachliche Optimierung für verdeckte Install-Abgänge.
- Noch keine spätere Rez-/Reveal-Kandidatenauflösung.
- Keine Änderung an Engine, LegalActions, `applyAction`, Replay oder StateHash.
- Keine UI-/DecisionDebug-Erweiterung außer minimal nötiger Teststabilisierung.

## Akzeptanzkriterien

- [ ] `hqHandMemory` kann intern sichere und mehrdeutige Informationen ausdrücken, ohne bestehende Consumer zu brechen.
- [ ] Die bisherigen `knownDefinitions`/`knownCount`-Felder bleiben für bestehende Planner- und Debug-Pfade verfügbar.
- [ ] Vorhandene HQ-Memory-Tests bleiben grün.
- [ ] Neue Safety-Regressionen belegen, dass das Ledger nur side-sichere AIInputs verarbeitet.
- [ ] `@netgrid/ai` Typecheck, fokussierte AI-Tests und `git diff --check` sind grün.

## Umsetzungshinweise

- Das Paket soll bewusst eine Grundlage liefern. Wenn die verdeckte-Install-Optimierung in einem Zug zu groß wird, nur die Ledger-Basis liefern und das Folgepaket unverändert offen lassen.
- Die öffentliche Debug-Zusammenfassung darf zunächst weiterhin nur die alten Felder anzeigen.

## Ergebnisnotiz

Noch offen.
