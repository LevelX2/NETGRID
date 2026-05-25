---
activityId: act-2026-05-24-proteus-phase-6c-corp-operation-trace-tag-economy
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
releaseTarget: Proteus Phase 6c
blockedBy: []
resultArtifacts: []
checks: []
---

# Proteus Phase 6c: Corp Operation Trace/Tag/Economy

## Ziel

Die sichtbaren Proteus-Corp-Operations mit Trace-, Tag-, Credit- und Trash-Effekten über generische `on_play`- und Trace-Familien umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `6c Corp Operation Trace/Tag/Economy`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- Bestehende Corp-Operation-, Trace-, Tag-, Credit- und Trash-Effektmuster.

## Zielkarten

- `onr_proteus_047_credit-consolidation` Credit Consolidation
- `onr_proteus_048_data-sifters` Data Sifters
- `onr_proteus_050_manhunt` Manhunt
- `onr_proteus_052_schlaghund-pointers` Schlaghund Pointers
- `onr_proteus_053_underworld-mole` Underworld Mole

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei.
- Corp-Operation-`on_play`, Trace-Fenster, Tag-/Credit-/Trash-Effekte.
- Wrong-Side-, stale-action-, Kosten-, Trace- und Zielrevalidierung.

## Nicht im Scope

- Keine Corp-ICE-Printed-Subroutines aus Phase 6b.
- Keine Asset-/Upgrade-Aktivierungen aus Phase 6d.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Trace- und Folgeeffekte sind LegalAction-basiert und in `applyAction` erneut validiert.
- [ ] Hidden-Info- und PublicPayload-Grenzen sind nachgewiesen.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Noch offen.
