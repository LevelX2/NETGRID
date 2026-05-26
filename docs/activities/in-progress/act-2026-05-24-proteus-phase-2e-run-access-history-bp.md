---
activityId: act-2026-05-24-proteus-phase-2e-run-access-history-bp
status: blocked
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt:
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 2e
proReferences:
  - PRO030
blockedBy:
  - act-2026-05-24-proteus-phase-2a-bad-publicity-foundation
  - proteus-run-scoped-history-contract
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-2e-run-access-history-bp.md
checks:
  - Lokale Quellenprüfung `data/cards/proteus-cards.json` für `Frame-Up`, `Live News Feed` und `Subliminal Corruption`
  - Codebestandprüfung `packages/shared/src/index.ts`, `packages/engine/src/index.ts`, `packages/engine/src/ability-engine/card-implementation-runtime.ts`
---

# Proteus Phase 2e: Run-/Access-History BP

## Ziel

Bad-Publicity-Karten mit Run-, Access- und Trash-Historie umsetzen.

## Zielkarten

- `onr_proteus_109_frame-up` Frame-Up
- `onr_proteus_113_live-news-feed` Live News Feed
- `onr_proteus_125_subliminal-corruption` Subliminal Corruption

## Scope

- Eigene CardImplementation-Dateien.
- Zug-/Run-Gedächtnis für HQ/R&D-Runs, liberated/trashed Black Ops, encountered Black ICE, rezzed Black Ops, trashed Advertisements und verzögerte Post-Run-Auswertung.
- Bad-Publicity-Effekt aus Phase 2a.

## Nicht im Scope

- Keine Replacement-/Damage-Prevention-Karten.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Jede Zielkarte hat eine eigene CardImplementation-Datei.
- [ ] History-Flags sind side-sicher, deterministisch und StateHash-stabil.
- [ ] BP-Erhöhung nutzt den generischen Baustein.
- [ ] PublicPayloads leaken keine verdeckten Kartendaten.

## Ergebnisnotiz

Blockiert am 2026-05-24 vor Codeänderungen.

Die drei Zielkarten hängen nicht nur an vorhandener Bad-Publicity-Logik, sondern an einer gemeinsamen run-gebundenen History-Familie, die im aktuellen Engine-Vertrag noch nicht ausreichend vorhanden ist:

- `Frame-Up` verlangt erfolgreiche Runs auf HQ und R&D in diesem Zug und zusätzlich, ob während dieser Runs Black-Ops-Karten liberiert oder getrasht wurden. Der aktuelle `runnerTurnFlags`-Vertrag enthält `successfulHqRunThisTurn`, aber kein gleichwertiges `successfulRdRunThisTurn`; vorhandene Agenda-Subtype-Flags sind zugbezogen und nicht auf die relevanten HQ/R&D-Runs eingeschränkt. Für "trashed any Black Ops cards during those runs" fehlt ein eigener Access-/Trash-History-Flag.
- `Live News Feed` ist ein Make-Run-Event mit verzögerter Post-Run-Auswertung. Es benötigt run-scoped Counts für encountered black ICE, während dieses Runs gerezzte Black-Ops-Karten und während dieses Runs liberierte Black-Ops-Agenden. Diese Counts existieren weder in `RunState` noch als generische CardImplementation-Lifecycle-Outputs.
- `Subliminal Corruption` ist ebenfalls ein Make-Run-Event mit Post-Run-Auswertung und benötigt die Anzahl während genau dieses Runs getrashter Advertisement-Karten. Auch dafür existiert aktuell kein run-scoped Trash-History-Zähler.

Eine Umsetzung ohne diese Grundlage müsste entweder Kartennamen/Proteus-IDs in nachgelagerte Run-, Access-, Rez- oder Trash-Pfade einbauen oder unvollständige Turn-Flags wiederverwenden, die die Worte "during those runs"/"during the run" nicht revalidierbar abbilden. Beides verletzt die Designvorgabe "Rules Engine als einzige Regelautorität", LegalAction-/`applyAction`-Revalidierung, Replay/StateHash-Stabilität und Hidden-Info-Redaction.

Entblockung:

- Einen kartenunabhängigen Run-History-Vertrag ergänzen, der mindestens erfolgreiche HQ/R&D-Runs, pro Run encountered black ICE, während eines Runs gerezzte Black-Ops-Karten, während eines Runs liberierte Black-Ops-Agenden, während eines Runs getrashte Black-Ops- und Advertisement-Karten sowie die redigierte PublicPayload-Projektion definiert.
- Einen generischen CardImplementation-Baustein für "make run, then on run completion resolve effects from run history" schneiden, inklusive LegalAction-Zielwahl für den Run-Server, `applyAction`-Revalidierung, Replay/StateHash und Tests.
- Danach `Frame-Up`, `Live News Feed` und `Subliminal Corruption` als eigene CardImplementation-Dateien auf diese Bausteine setzen.
