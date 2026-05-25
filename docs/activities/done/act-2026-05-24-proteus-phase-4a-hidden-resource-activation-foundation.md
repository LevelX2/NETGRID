---
activityId: act-2026-05-24-proteus-phase-4a-hidden-resource-activation-foundation
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-24
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 4a
blockedBy:
  - act-2026-05-24-proteus-phase-4-hidden-runner-resources
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/public-context.ts
  - packages/engine/src/ability-engine/card-implementation-effect-adapters.ts
  - packages/engine/src/ability-engine/card-implementation-runtime.ts
  - packages/engine/src/game/view/hidden-info.test.ts
  - docs/releases/proteus/README.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/view/hidden-info.test.ts -t "Proteus Hidden-Resource Foundation Harness"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - git diff --check
---

# Proteus Phase 4a: Hidden Resource Activation Foundation

## Ziel

Die generische Aktivierungsgrundlage für verdeckte Runner-Resources schaffen, ohne bereits konkrete Proteus-Zielkarten zu promoten.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `4a Hidden Resource Activation Foundation`.
- `docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md`.
- `docs/activities/done/act-2026-05-17-proteus-hidden-resource-foundation-slice.md`.
- Bestehende Hidden-Resource-View- und Trash-Foundation im Engine-Code.

## Zielkarten

Keine Zielkartenpromotion in diesem Slice.

## Scope

- Verdeckte Runner-Resource-Aktivierung als generische CardImplementation-/Ability-Familie vorbereiten.
- Reveal-and-trash-Kosten atomar und replay-stabil modellieren.
- Private Runner-LegalActions für verdeckte Resource-Quellen bereitstellen.
- Korp-Views, PublicEvents, Undo-Preview, Reconnect und AIInput gegen nicht aktivierte Hidden-Info-Leaks absichern.
- Timingfenster für die Folgefamilien Trace, Damage, Access und Kosten so schneiden, dass 4b bis 4e keine kartenindividuellen Runtime-Branches brauchen.

## Nicht im Scope

- Keine Promotion der Karten aus 4b bis 4e.
- Keine neuen UI-, Server-, Catalog- oder KI-Abfragen auf Proteus-Kartennamen oder `onr_proteus_*`-IDs.
- Keine Erweiterung der Hidden-Resource-Regeln ohne nachweislichen Folge-Slice-Bedarf.

## Akzeptanzkriterien

- [x] Hidden-Resource-Aktivierungen werden nur aus Runner-privaten LegalActions erzeugt.
- [x] `applyAction` revalidiert Seite, stateVersion, Timingfenster, Quelle, Reveal-Zustand, Kosten und Choice-Daten.
- [x] Reveal-and-trash erfolgt atomar, deterministisch und StateHash-relevant.
- [x] Nicht aktivierte Hidden Resources bleiben in Korp-PlayerViews, PublicEvents, Reconnect, Undo-Preview, Logs und AIInput redigiert.
- [x] Fokussierte Wrong-Side-, stale-action-, Kosten-, Choice-, Hidden-Info- und Replay-/StateHash-Tests decken die Foundation ab.

## Umsetzungshinweise

- Vor Umsetzung prüfen, welche Teile der früheren Hidden-Resource-Foundation bereits Slot-Installation, Redaction und Korp-Trash abdecken.
- 4a darf nicht erneut nur verdeckte Slot-Installation beweisen; der Mehrwert ist die generische Aktivierungs- und Reveal-and-trash-Familie.
- 4b bis 4e bleiben blockiert, bis diese Aktivierungsgrundlage vorhanden oder präzise blockiert ist.

## Ergebnisnotiz

Erledigt am 2026-05-24. Der Slice promotet keine Proteus-Zielkarte und erweitert stattdessen die generische Hidden-Runner-Resource-Grundlage:

- CardImplementation-Event-Modification-Pfade für Damage-, Tag- und Installed-Trash-Prevention hängen bei verdeckten Runner-Resources jetzt atomare Reveal-and-trash-Metadaten an den validierten Resolve.
- Aktivierte CardImplementation-Fähigkeiten mit `trash_source`-Kosten geben denselben öffentlichen Cost-Payload zurück; der Engine-Primitive bleibt generisch und kartenunabhängig.
- PublicEvents übernehmen `hiddenResourceSlotId`, `hiddenRunnerResourceRevealed` und `publicRevealDefinitionId` erst nach validiertem Reveal. Vorher bleiben Korp-PlayerViews und PublicEvents ohne DefinitionId, Titel oder echte Instance-ID der verdeckten Resource.
- Fokussierte Harness-Tests prüfen private Runner-LegalActions, Wrong-Side- und stale-action-Ablehnung, Choice-/Kosten-Resolve, Reveal in den Heap, Replay und StateHash.

4b bis 4e können auf dieser Grundlage Kartenfamilien promoten; sie müssen ihre Economy-, Access-, Prevention- und Sabotage-spezifischen Timingfenster jeweils mit eigenen CardImplementation-Dateien und zusätzlichen Tests nachweisen.
