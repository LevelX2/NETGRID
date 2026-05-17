---
activityId: act-2026-05-17-proteus-variable-ice-harness-slice
status: in_progress
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-3
parallelWorker: worker-3
releaseTarget: Proteus planning
blockedBy: []
resultArtifacts: []
checks: []
---

# Proteus variable ICE-Harness-Slice umsetzen

## Ziel

Den planning-only Vertrag `docs/derived/PROTEUS_VARIABLE_ICE_CONTRACT.md` als kleinsten nicht-promotenden Engine-Harness-Slice fuer genau `Digiconda` und `Food Fight` vorbereiten.

## Scope

- Keine Proteus-Kartenpromotion und keine Decklegalität.
- WIP-/Harness-Pfad fuer variable `rez_ice`-LegalActions:
  - `Digiconda`: `X` als beim Rezzen gesetzte Stärke, Obergrenze 6.
  - `Food Fight`: eine `End the run`-Subroutine je 2 bezahlten Zusatzcredits.
- `applyAction`-Revalidierung fuer Side, `actionId`, `stateVersion`, Timing, Kosten, Zielkarte und variable Choices.
- PublicPayload, PlayerView, Reconnect, Replay und StateHash fuer variable Rez-Werte absichern.
- Fokussierte Engine-Tests nach der Testmatrix im Vertrag.

## Nicht im Scope

- Keine Runtime-Freigabe weiterer Proteus-ICE.
- Keine Homing-Missile-Trace-Sperre.
- Keine Subtyp-Wechsler, relative ICE-Zählung, Pass-Trigger oder Repositionierung.
- Keine AI-Hints, keine Decklegalität, keine Formatlegalität.

## Akzeptanzkriterien

- [ ] Digiconda- und Food-Fight-Harness bleiben nicht promotend und nicht decklegal.
- [ ] Variable Werte werden deterministisch im Engine-State/Eventlog geführt.
- [ ] `applyAction` lehnt manipulierte variable Rez-Werte side-sicher ab.
- [ ] PublicPayload, Reconnect und Replay leaken keine verdeckten Kartendaten.
- [ ] `git diff --check` und fokussierte Engine-Checks sind grün.

## Ergebnisnotiz

Noch offen.
