---
activityId: act-2026-05-17-proteus-hidden-resource-foundation-slice
status: in_progress
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget: Proteus planning
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Verdeckte Runner-Resource-Zustände sind im Rig side-sicher modelliert.
- [ ] Installation, Reconnect und PublicEvents leaken keine Hidden-Resource-Identität an die Korp.
- [ ] Korp-Tag-Trash gegen redigierte Slots funktioniert und revealet erst beim erfolgreichen Trash.
- [ ] AIInput der Korp enthält nur redigierte Slots.
- [ ] Replay/StateHash sind stabil.
- [ ] Proteus-Karten bleiben nicht promotet und nicht deck-legal.

## Umsetzungshinweise

- Primärer Agent: `release-implementation-agent`.
- Der Slice sollte mit Harness-/Fixture-Karten arbeiten, bis ein separates Release-Gate eine echte Proteus-Karte freigibt.
- Slot-IDs müssen LegalActions und Reconnect tragen, dürfen aber keine echte Instance-ID oder Definition ableitbar machen.
- Danach können separate Pakete für Cost-/Penalty-Bankkarten, Damage-Prevention, Trace-Fenster und Access-Multiaccess folgen.

## Ergebnisnotiz

Noch offen.
