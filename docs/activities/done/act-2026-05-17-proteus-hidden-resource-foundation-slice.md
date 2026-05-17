---
activityId: act-2026-05-17-proteus-hidden-resource-foundation-slice
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget: Proteus planning
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - packages/ai/src/input-dto.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Proteus Hidden-Resource Foundation Harness"
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "redacts hidden Runner Resources in Corp AIInput before reveal"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check
---

# Proteus Hidden-Resource-Foundation-Slice

## Ziel

Der erste kleine Runtime-Slice soll den verdeckten installierten Runner-Resource-Zustand beweisen, ohne Proteus-Karten freizuschalten oder kartenindividuelle Aktivierungsfähigkeiten umzusetzen.

## Kontext und Quellen

- `docs/derived/PROTEUS_HIDDEN_RUNNER_RESOURCES_CONTRACT_2026_05_17.md`
- `data/rules/proteus-mechanics-coverage-2026-05-17.json`
- Cluster `hidden_runner_resources`
- Bestehende Grundlagen: `RESOURCE_TAG_INTERACTION_0.95_SPEC.md`, `HIDDEN_ZONE_TOOLS_0.98_SPEC.md`

## Scope

- Generischer Hidden-Resource-Installationsmodus für eng begrenzte Harness-/Testfixtures.
- Runner-PlayerView zeigt eigene Hidden Resource vollständig.
- Korp-PlayerView zeigt verdeckte Runner-Resource nur als redigierten Slot.
- PublicEvent für Installation enthält keine Titel, DefinitionIds, echten Instance-IDs oder Regeln.
- Korp-`trash_resource` darf bei getaggtem Runner redigierte Hidden-Resource-Slots targeten.
- Erfolgreicher Trash revealet die Karte erst im Runner-Heap.
- Reconnect, AIInput, Replay und StateHash werden für diesen Foundation-Slice getestet.

## Nicht im Scope

- Keine Freischaltung von Proteus-Karten.
- Keine Aktivierungsfähigkeiten von Airport Locker, Chiba Bank Account, HQ Mole, R&D Mole, Wired Switchboard oder anderen Proteus-Karten.
- Keine Trace-, Damage-, Access- oder Cost-/Penalty-Fenster.
- Keine offiziellen Bilder, Cardbacks, Logos oder externen Assetpfade.
- Keine AI-Hints und keine Deck-Legalität.

## Akzeptanzkriterien

- [x] Verdeckte Runner-Resource-Zustände sind im Rig side-sicher modelliert.
- [x] Installation, Reconnect und PublicEvents leaken keine Hidden-Resource-Identität an die Korp.
- [x] Korp-Tag-Trash gegen redigierte Slots funktioniert und revealet erst beim erfolgreichen Trash.
- [x] AIInput der Korp enthält nur redigierte Slots.
- [x] Replay/StateHash sind stabil.
- [x] Proteus-Karten bleiben nicht promotet und nicht deck-legal.

## Umsetzungshinweise

- Primärer Agent: `release-implementation-agent`.
- Der Slice arbeitet mit Harness-/Fixture-Karten, bis ein separates Release-Gate eine echte Proteus-Karte freigibt.
- Slot-IDs werden aus stabilen redigierten `hidden_runner_resource_*`-IDs gebildet, tragen LegalActions und Reconnect, enthalten aber keine echte Instance-ID oder DefinitionId.
- Danach können separate Pakete für Cost-/Penalty-Bankkarten, Damage-Prevention, Trace-Fenster und Access-Multiaccess folgen.

## Ergebnisnotiz

Umgesetzt als generischer Engine-Modus für installierte Runner-Resources mit Subtyp `hidden`, getestet über lokale Harness-Fixtures ohne Produktkartenpool- oder Proteus-Promotion. Runner sieht eigene Hidden Resource vollständig; Korp-View, Korp-LegalActions, PublicEvents und Korp-AIInput verwenden nur redigierte Slots. Korp-`trash_resource` mappt redigierte Slots engine-seitig auf die autoritative Instanz, revealet erst nach erfolgreichem Trash im Runner-Heap und bleibt replay-/StateHash-stabil.

Der vollständige Engine-Testfile `src/index.test.ts` enthält weiterhin einen unabhängigen roten Bestandstest im Trace/Post-Bid-Bereich (`uses Signpost and The Springboard only after both trace bids are revealed`: erwartet `onr_v1_181_the-springboard`, tatsächlich `onr_v1_243_fetch-4-0-1`). Der fokussierte Hidden-Resource-Slice und die betroffenen Typechecks sind grün.
