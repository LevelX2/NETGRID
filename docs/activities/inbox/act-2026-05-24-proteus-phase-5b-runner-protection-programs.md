---
activityId: act-2026-05-24-proteus-phase-5b-runner-protection-programs
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
releaseTarget: Proteus Phase 5b
blockedBy: []
resultArtifacts: []
checks: []
---

# Proteus Phase 5b: Runner Protection Programs

## Ziel

Die sichtbaren Runner-Protection-Programme als CardImplementation-Dateien mit generischen Damage-Prevention-/Replacement-Fenstern umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `5b Runner Protection Programs`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- Bestehende Damage-/Prevention-Implementierungen und Tests.

## Zielkarten

- `onr_proteus_086_enterprise-inc-shields` Enterprise, Inc., Shields
- `onr_proteus_096_skullcap` Skullcap

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei.
- Damage-Prevention-/Replacement-Fenster, Source-/Turn-Limits, private Choice und öffentliche Outcome-Projektion.
- LegalAction- und `applyAction`-Revalidierung für Timing, Kosten, Quelle und preventbaren Schaden.

## Nicht im Scope

- Keine Hidden Runner Resources.
- Keine Event-/Run-Karten aus Phase 5c/5d.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Prevention-/Replacement-Choices leaken keine verdeckten Karteninformationen.
- [ ] Wrong-Side-, stale-action-, Kosten-/Timing-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Noch offen.
