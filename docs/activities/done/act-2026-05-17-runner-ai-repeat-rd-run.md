---
activityId: act-2026-05-17-runner-ai-repeat-rd-run
status: done
kind: fix
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/runner-plans.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai test -- -t "prefers economy over immediate repeat R&D runs"
  - corepack pnpm --filter @netgrid/ai typecheck
---

# Runner-KI wiederholt wirkungslosen R&D-Run im selben Zug

## Ziel

Die Runner-KI soll im selben Zug nicht erneut auf Research and Development laufen, wenn sie dort bereits zugegriffen hat und aus dem Zugriff keinen sinnvollen Fortschritt erzielen konnte. In solchen Situationen sollen einfache Alternativen wie Credit nehmen oder Karte ziehen höher bewertet werden.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Der Runner startet wiederholt einen Run auf Research and Development, obwohl er im selben Zug bereits dort gelaufen ist und mit der aufgedeckten Karte nichts anfangen konnte.
- Wenn der vorherige R&D-Zugriff weder Trash, Steal/Score-Fortschritt noch sonstigen Vorteil erzeugt hat, ist ein erneuter identischer Run auf dieselbe R&D-Situation häufig schlechter als Ressourcenaufbau.
- Der Befund betrifft gezielt Runner-KI-Planung und Bewertung, nicht die Legalität von Runs.

## Scope

- Runner-KI-Logik prüfen, die zentrale Server-Runs, insbesondere R&D, bewertet.
- Nachverfolgen, ob die KI im selben Runner-Zug bereits auf R&D zugegriffen hat und ob der Zugriff nutzlos war.
- Wiederholte R&D-Runs im selben Zug abwerten, wenn der vorherige Zugriff keinen nutzbaren Effekt hatte und sich die relevante R&D-Situation nicht verändert hat.
- Alternativen wie Credit nehmen, Karte ziehen oder andere sinnvolle Runs in solchen Fällen relativ höher bewerten.
- Konkreten Startfall als Regression oder AI-Smoke nachstellen.

## Nicht im Scope

- Keine Änderung an Run-Legalität, Access-Regeln, R&D-Zugriff, Trash-/Steal-Regeln, Replay oder StateHash.
- Keine pauschale Sperre für mehrere R&D-Runs pro Zug; Wiederholung kann sinnvoll bleiben, wenn sich Informationen, Kosten, Zugriffszahl oder Ziele verändert haben.
- Keine Änderung an menschlichen LegalActions.
- Keine breite Runner-KI-Neustrukturierung über den konkreten Bewertungsfehler hinaus.

## Akzeptanzkriterien

- [x] Die Runner-KI wiederholt einen R&D-Run im selben Zug nicht, wenn der erste Zugriff wirkungslos war und keine relevante Lageänderung eingetreten ist.
- [x] Die KI darf weiterhin mehrfach R&D laufen, wenn ein nachvollziehbarer Vorteil besteht, z. B. zusätzlicher Zugriff, neue Information, Agenda-Chance, geänderte Topkarte oder passender Trash-/Steal-Pfad.
- [x] Mindestens ein fokussierter AI-Test oder Smoke deckt den wirkungslosen Wiederholungsfall ab.
- [x] Die Änderung beeinflusst Engine-Regeln und LegalActions nicht.
- [x] Die Bewertung ist dokumentiert genug, damit künftige KI-Tuning-Arbeiten den Grund erkennen.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte sind Runner-Planbewertung und Entscheidungslogik in `packages/ai/src/index.ts` sowie zugehörige Tests in `packages/ai/src/index.test.ts`.
- Zu prüfen ist, welche Event-/PlayerView-Information der KI side-sicher zur Verfügung steht, um einen vorherigen R&D-Zugriff im selben Zug und dessen Ergebnis zu erkennen.
- Der Malus sollte kontextuell sein: wiederholter R&D-Run nach wirkungslosem Zugriff abwerten, aber keine harte globale Blockade einführen.
- Bei Unsicherheit zuerst einen reproduzierbaren AI-Smoke bauen, der das aktuelle Fehlverhalten sichtbar macht.

## Ergebnisnotiz

Abgeschlossen. Die Runner-Planbewertung nutzt jetzt einen benannten, dokumentierten Malus für `stale_known_same_top` auf R&D, damit normale Economy-/Draw-Pläne einen identischen erneuten Zugriff schlagen. Zusätzlich berücksichtigt der Baseline-Runner-Score denselben side-sicheren Belief-State, sodass vergleichbare Runner-Entscheidungspfade den wirkungslosen Wiederholungsrun ebenfalls vermeiden. Der bestehende R&D-Repeat-Test deckt nun Plan- und Baseline-Auswahl ab; Engine-Regeln und LegalActions wurden nicht geändert.
