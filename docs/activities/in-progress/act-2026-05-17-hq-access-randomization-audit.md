---
activityId: act-2026-05-17-hq-access-randomization-audit
status: in_progress
kind: concept
area: engine
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-4
parallelWorker: worker-4
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Audit zeigt, ob die aktuelle Random-Logik korrekt aus allen HQ-Handkarten wählt.
- [ ] Bei Bug gibt es einen fokussierten Fix oder ein Folgepaket mit Reproduktion.
- [ ] Determinismus, Replay und StateHash bleiben geprüft.
- [ ] Alternative manuelle verdeckte Auswahl ist mit Hidden-Info- und Multiplayer-Folgen bewertet.

## Umsetzungshinweise

- Falls manuelle Auswahl gewählt wird, muss die Reihenfolge/Slotdarstellung side-sicher und replaybar modelliert werden.

## Ergebnisnotiz

Noch offen.
