---
activityId: act-2026-05-24-proteus-phase-6c-corp-operation-trace-tag-economy
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-27
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 6c
proReferences:
  - PRO007
blockedBy: []
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-6c-corp-operation-trace-tag-economy.md
  - docs/activities/done/act-2026-05-27-proteus-pro007-corp-operation-economy-trace-history.md
  - docs/releases/proteus/README.md
checks:
  - "rg -n \"onr_proteus_047|onr_proteus_048|onr_proteus_050|onr_proteus_052|onr_proteus_053|Credit Consolidation|Data Sifters|Manhunt|Schlaghund Pointers|Underworld Mole\" data/cards/proteus-cards.json docs/releases/proteus data/manifests/proteus-card-support.json -S"
  - "rg -n \"runner_attempted_run_last_turn|trace|add_tags|trash_runner_resources_if_tagged|gain_credits|lose_credits|runner_is_tagged|runner.*last turn|on_play\" packages/engine/src/card-implementations/onr-v1/corp/operations packages/engine/src/card-implementations/proteus packages/engine/src/ability-engine packages/engine/src/game packages/engine/src/index.ts -S"
  - "git diff --check"
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

- [x] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [x] Trace- und Folgeeffekte sind LegalAction-basiert und in `applyAction` erneut validiert.
- [x] Hidden-Info- und PublicPayload-Grenzen sind nachgewiesen.
- [x] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Erledigt durch PRO007. Alle fünf Zielkarten wurden als konkrete CardImplementation-Dateien unter `packages/engine/src/card-implementations/proteus/corp/operations/` umgesetzt, registriert und im Proteus-Manifest als engine-/human-playable markiert.

Ergänzte generische Engine-Bausteine:

- Runner-History-Conditions für `runner_trashed_node_last_turn`, `runner_installed_resource_last_turn` und `runner_attempted_run_this_game`.
- Trace-Erfolg `add_tags_by_trace_margin_over_runner_link`.
- Trace-Erfolg `trash_runner_resource_and_add_tag` mit LegalAction-Zielauswahl für im letzten Runner-Zug installierte Resources und erneuter `applyAction`-Revalidierung.
- Zusatzkostenmodell `additionalPlayCostPerBaseTracePointAboveZero` für Operation-Traces wie `Schlaghund Pointers`.

Harness-Zahlen: vorher 154/62/92, nachher 154/67/87, jeweils 0 Drift-/Konsistenzfehler. Keine PRO007-Karte wurde `deck_legal`, `format_legal` oder `ai_supported`.
