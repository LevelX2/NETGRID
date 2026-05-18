---
activityId: act-2026-05-17-proteus-variable-ice-harness-slice
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-3
parallelWorker: worker-3
releaseTarget: Proteus planning
blockedBy: []
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Proteus variable ICE harness|Proteus Visible Baseline"
  - corepack pnpm --filter @netgrid/engine typecheck
  - git diff --check
---

# Proteus variable ICE-Harness-Slice umsetzen

## Ziel

Den planning-only Vertrag `docs/releases/proteus/variable-ice-contract.md` als kleinsten nicht-promotenden Engine-Harness-Slice fuer genau `Digiconda` und `Food Fight` vorbereiten.

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

- [x] Digiconda- und Food-Fight-Harness bleiben nicht promotend und nicht decklegal.
- [x] Variable Werte werden deterministisch im Engine-State/Eventlog geführt.
- [x] `applyAction` lehnt manipulierte variable Rez-Werte side-sicher ab.
- [x] PublicPayload, Reconnect und Replay leaken keine verdeckten Kartendaten.
- [x] `git diff --check` und fokussierte Engine-Checks sind grün.

## Ergebnisnotiz

Umgesetzt als nicht-promotender Engine-Harness-Slice fuer genau `Digiconda` und `Food Fight`.

- `Digiconda` erzeugt variable `rez_ice`-LegalActions fuer `X = 0..6`, zahlt Basis-Rezkosten plus `X` und speichert die effektive Stärke replay-/StateHash-relevant am Karteninstanzzustand.
- `Food Fight` erzeugt variable `rez_ice`-LegalActions in 2-Credit-Schritten, speichert die Anzahl bezahlter `End the run`-Subroutinen und nutzt dieselbe deterministische Subroutinenliste fuer View, Break-LegalActions, PublicPayload und Replay.
- `applyAction` revalidiert ueber frisch berechnete LegalActions plus Engine-seitige Payload-/Kostenpruefung; manipulierte Side, stale Version, nicht angebotene X-/Zusatzkostenwerte und unzureichende Credits werden abgelehnt.
- PublicPayload, PlayerView und Replay enthalten nur oeffentliche Rez-Werte nach dem Rezzen; keine Proteus-Decklegalitaet, keine Proteus-Formatlegalitaet, keine AI-Hints und keine weitere Proteus-Kartenpromotion wurden angefasst.
