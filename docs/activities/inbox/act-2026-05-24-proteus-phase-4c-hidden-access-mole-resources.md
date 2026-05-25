---
activityId: act-2026-05-24-proteus-phase-4c-hidden-access-mole-resources
status: inbox
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 4c
blockedBy:
  - act-2026-05-24-proteus-phase-4a-hidden-resource-activation-foundation
resultArtifacts: []
checks: []
---

# Proteus Phase 4c: Hidden Access and Mole Resources

## Ziel

Die verdeckten Access-Modifier und Mole-Resources als CardImplementation-Dateien auf der 4a-Aktivierungsgrundlage umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `4c Hidden Access/Mole Resources`.
- `docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.

## Zielkarten

- `onr_proteus_142_hq-mole` HQ Mole
- `onr_proteus_147_r-and-d-mole` R&D Mole
- `onr_proteus_149_simulacrum` Simulacrum

## Scope

- Access-Modifikatoren, zusätzliche oder ersetzte Access-Informationen und zentrale Server-Redaction generisch modellieren.
- Runner-private Aktivierungen in Access-Fenstern mit `applyAction`-Revalidierung absichern.
- Öffentliche Ergebnisse so formulieren, dass vor Reveal keine verdeckte Source-Identität sichtbar wird.

## Nicht im Scope

- Keine Economy-/Bank-, Prevention- oder Sabotage-Familien.
- Keine UI-Regelautorität und keine AI-Hints.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Access-Modifikatoren werden aus generischen Hidden-Resource-Bausteinen abgeleitet.
- [ ] Zentrale Server- und Karteninformationen bleiben für die Korp nur im erlaubten Umfang sichtbar.
- [ ] Wrong-Side-, stale-action-, Ziel-, Choice-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.

## Ergebnisnotiz

Noch offen.
