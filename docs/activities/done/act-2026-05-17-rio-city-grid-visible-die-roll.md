---
activityId: act-2026-05-17-rio-city-grid-visible-die-roll
status: done
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-5
parallelWorker: worker-5
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/action-cues.ts
  - apps/web/app/action-cues.test.ts
  - packages/engine/src/index.test.ts
  - docs/activities/done/act-2026-05-17-rio-city-grid-visible-die-roll.md
checks:
  - "corepack pnpm --filter @netgrid/web exec vitest run app/action-cues.test.ts app/chronicle.test.ts"
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t \"Rio de Janeiro City Grid\""
  - "corepack pnpm --filter @netgrid/web typecheck"
  - "corepack pnpm --filter @netgrid/engine typecheck"
---

# Rio de Janeiro City Grid: Würfelwurf für beide Spieler sichtbar machen

## Ziel

Der Würfelwurf von `Rio de Janeiro City Grid` muss für Runner und Korp als sichtbares Ereignis und in der Chronik nachvollziehbar erscheinen.

## Kontext und Quellen

- Nutzeranforderung vom 2026-05-17: Wurf und Folge, insbesondere `Wurf: 1` und `Run endet`, sollen für beide Spieler sichtbar sein.
- Lokaler Kartenanker: `onr_v1_367_rio-de-janeiro-city-grid`.

## Scope

- Prüfen, ob der Würfelwurf nur intern/chronikalisch passiert oder als UI-Event projiziert wird.
- PublicEvent an beide Spieler senden.
- Anzeige für normale Eventdauer oder Bestätigung sichtbar halten.
- Chronik mit Karte, Wurf, Ergebnis und Folge prüfen/ergänzen.

## Nicht im Scope

- Keine Änderung am deterministischen Zufall, Seed, RandomCounter oder RandomDrawRecords.
- Keine neue allgemeine Würfelanimation, wenn ein bestehender Cue reicht.

## Akzeptanzkriterien

- [x] Beide Spieler sehen, dass Rio de Janeiro City Grid ausgelöst wurde.
- [x] Wurfwert und Konsequenz sind sichtbar und bleiben ausreichend lange stehen.
- [x] Chronik nennt Karte, Wurf, Ergebnis und Run-Folge.
- [x] Replay/StateHash und RandomDrawRecords bleiben deterministisch.
- [x] Regression deckt Wurf `1` und einen Nicht-1-Wurf ab.

## Umsetzungshinweise

- Bestehender Chronicle-Test kann ein Anker sein, reicht aber nicht als UI-Sichtbarkeitsnachweis.

## Ergebnisnotiz

Abgeschlossen: Rio de Janeiro City Grid erzeugt weiterhin denselben deterministischen Engine-Wurf und dieselben RandomDrawRecords, wird aber im Web-Cue-Layer als erzwungener öffentlicher Karteneffekt behandelt. Dadurch sehen Runner und Korp den Wurfwert sowie die Konsequenz als bestätigbare Meldung; die Chronik nutzt weiterhin Karte, Wurf, Fort/ICE und Run-Folge. Die Engine-Regression deckt deterministisch `Wurf: 1` mit Run-Ende und einen Nicht-1-Wurf mit weiterlaufendem Run ab.
