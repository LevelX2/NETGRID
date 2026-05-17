---
activityId: act-2026-05-17-hq-access-randomization-audit
status: done
kind: concept
area: engine
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-4
parallelWorker: worker-4
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.test.ts
  - docs/activities/done/act-2026-05-17-hq-access-randomization-audit.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "randomizes single HQ access"
  - corepack pnpm --filter @netgrid/engine typecheck
  - git diff --check
---

# HQ-Randomisierung prüfen und verdeckte manuelle Auswahl bewerten

## Ziel

Die HQ-Handkartenauswahl soll als deterministisch replaybarer Zufall korrekt geprüft werden; alternativ soll eine verdeckte manuelle Auswahl als UX-Option bewertet werden.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-17: Bei mehreren HQ-Runs mit ca. fünf Karten wurde auffällig oft dieselbe Karte getroffen.
- Das kann Zufall, mehrere Kopien, ein Seed-/Indexfehler oder wiederverwendeter Access-State sein.

## Scope

- Random-Auswahl aus aktuellen HQ-Handkarten prüfen.
- Seed, RandomCounter, RandomDrawRecords und Handkartenindex gegen Replay/StateHash prüfen.
- Test mit mehreren eindeutigen HQ-Karten anlegen.
- UX-Alternative `facedown Slots, Runner wählt verdeckte Karte` fachlich und technisch bewerten.

## Nicht im Scope

- Keine sofortige Umstellung auf manuelle Auswahl ohne Entscheidung.
- Kein Leaken von HQ-Kartennamen oder -Reihenfolge.

## Akzeptanzkriterien

- [x] Audit zeigt, ob die aktuelle Random-Logik korrekt aus allen HQ-Handkarten wählt.
- [x] Bei Bug gibt es einen fokussierten Fix oder ein Folgepaket mit Reproduktion.
- [x] Determinismus, Replay und StateHash bleiben geprüft.
- [x] Alternative manuelle verdeckte Auswahl ist mit Hidden-Info- und Multiplayer-Folgen bewertet.

## Umsetzungshinweise

- Falls manuelle Auswahl gewählt wird, muss die Reihenfolge/Slotdarstellung side-sicher und replaybar modelliert werden.

## Ergebnisnotiz

Erledigt. Audit-Befund: Der moderne HQ-Access-Pfad baut bei Breach-Start eine Queue aus der aktuellen `state.corp.hq`-Kopie, zieht pro Zugriff deterministisch über `nextRandom` mit Purpose `hq_multiaccess:{runId}:selection:{index}`, entfernt gezogene Karten aus der lokalen Auswahl und schreibt `RandomDrawRecords` plus `randomCounter` fort. Es wurde kein Bug gefunden, der immer dieselbe Handposition oder einen wiederverwendeten Access-State erzwingt.

Neue Regression: `packages/engine/src/index.test.ts` prüft einen Single-HQ-Run mit fünf eindeutigen HQ-Karten über 80 Seed-Varianten. Der Test bestätigt, dass jede Karte erreichbar ist, der ausgewählte Kandidat aus der aktuellen HQ-Hand stammt, der Runner vor dem Access keine HQ-Kartennamen sieht, `RandomDrawRecords`/`randomCounter` fortgeschrieben werden und Replay plus `StateHash` stabil bleiben.

Manuelle verdeckte Auswahl wurde nur bewertet und nicht umgesetzt: Sie ist fachlich möglich, hätte aber höhere Hidden-Info- und Multiplayer-Komplexität. Erforderlich wären stabile Runner-sichtbare Slot-IDs ohne Kartennamen/Reihenfolge-Leak, serverseitige Slot-zu-Karte-Abbildung, replaybare Choice-Payloads, Reconnect-/Undo-Redaction und KI-/WebSocket-Schutz. Ohne eigene Produktentscheidung bleibt der deterministische Random-Pfad die risikoärmere Regelautorität.
