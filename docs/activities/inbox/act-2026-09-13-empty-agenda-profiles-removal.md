---
activityId: act-2026-09-13-empty-agenda-profiles-removal
status: inbox
kind: cleanup
area: engine
priority: low
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-09-13
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Leere Agenda-Profile entfernen

## Ziel und Scope

agenda-scoring.ts und daran gebundene leere Overadvance-, Reveal- und Counter-Credit-Pfade samt Ports und synthetischen Tests entfernen. Den verwendeten COUNTER_OPERATION_SOURCES-Alias durch direkten Import von CORP_ADVANCEMENT_COUNTER_OPERATION_SOURCES ersetzen. Generische CardSpec-Overadvance-, Reveal- und aktivierte Agenda-Fähigkeiten erhalten.

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
