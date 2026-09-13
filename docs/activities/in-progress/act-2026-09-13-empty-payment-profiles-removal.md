---
activityId: act-2026-09-13-empty-payment-profiles-removal
status: in_progress
kind: cleanup
area: engine
priority: low
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-09-13
startedAt: 2026-09-13
owner: netgrid-activities-20260913-89c20ec1
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Leere Installed-Economy-Profile entfernen

## Ziel und Scope

payment-costs.ts samt immer erfolglosem resolveCorpInstalledEconomyAction, Validator, Imports und Runtimeports entfernen. Investment-Firm-Credit-Choice und generische aktivierte CardSpec-Economy unverändert erhalten.

Befund und Verbraucher: [Card-Registry-Vertrag](../../architecture/engine/card-registry-architecture.md#verbleibende-leere-mechanics-profile).

## Nicht im Scope

Neue Kartenverträge, Regeländerungen, historische Replay-Reparatur,
Kompatibilitätsaliase oder eine allgemeine Runtime-Neustrukturierung.

## Akzeptanzkriterien

- [ ] Leeres Modul und seine toten Verbraucher atomar entfernt.
- [ ] Aktive CardSpec-, LegalAction-, Public- und Replay-Verträge erhalten.
- [ ] Fokussierte bestehende Regressionen, Engine-Typecheck, Strukturgate und diff-check bestehen.

## Ergebnisnotiz

Umsetzung durch den allgemeinen Activities-Auftrag autorisiert.

