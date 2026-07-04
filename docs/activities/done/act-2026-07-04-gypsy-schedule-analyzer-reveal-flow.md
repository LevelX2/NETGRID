---
activityId: act-2026-07-04-gypsy-schedule-analyzer-reveal-flow
status: done
kind: fix
area: cards
priority: critical
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-04
startedAt: 2026-07-04
completedAt: 2026-07-04
branch: codex/activities-worktree-20260704-090854
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/run/run-access-transition.ts
  - packages/engine/src/public-context.ts
  - packages/engine/src/mechanics/public-payload-schema.ts
  - packages/engine/src/index-tests/mechanics/classic-runner-rest-cards.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/mechanics/classic-runner-rest-cards.test.ts -t "Gypsy Schedule Analyzer"
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts -t "Gypsy Schedule Analyzer"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm format:changed
  - git diff --check
---

# Gypsy Schedule Analyzer: R&D-Reveal sichtbar und korrekt abwickeln

## Ziel

`Gypsy™ Schedule Analyzer` soll nach einem erfolgreichen R&D-Run den ersetzten Zugriff nachvollziehbar und regelkonform abwickeln: Die Runner-Ansicht sieht die nacheinander aufgedeckten R&D-Karten bis zur ersten Agenda oder bis R&D leer ist, die gefundene Agenda wandert in HQ, die übrigen aufgedeckten Karten werden deterministisch in R&D gemischt, und die Spielchronik zeigt das Ergebnis verständlich an.

## Kontext und Quellen

- Nutzerfund vom 2026-07-04 aus einem Runner-vs-KI-Playtest: Nach dem Spielen von `Gypsy™ Schedule Analyzer` zeigte die Chronik nur Run-Fortschritt und Run-Ende. Nicht sichtbar war, welche R&D-Karten aufgedeckt wurden, ob eine Agenda gefunden wurde oder ob eine Agenda in HQ verschoben wurde.
- Screenshot: `C:/Users/Lui/AppData/Local/Temp/codex-clipboard-2d601787-277f-4a38-a661-bfdde6f56d44.png`.
- Kartentext in `data/cards/classic-cards.json`: "Make a run on R&D. If run is successful, do not access any cards. Instead, reveal cards one at a time from R&D until you reveal an agenda card or there are no cards left in R&D. Store the agenda, if any, in HQ and shuffle the other revealed cards, if any, into R&D."
- Kartenimplementation `packages/engine/src/card-implementations/classic/runner/events/gypsytm-schedule-analyzer.ts` nutzt `successfulRunAccessReplacement: "reveal_rd_until_agenda_store_in_hq"`.
- Wahrscheinlicher Engine-Einstiegspunkt: `packages/engine/src/game/run/run-access-transition.ts`, dort existieren bereits Felder wie `revealedIds`, `agendaId` und `shuffledIntoRdCount` für diesen Ersatzpfad.
- Wahrscheinliche UI-Einstiegspunkte: `apps/web/app/chronicle.ts`, `apps/web/app/action-cues.ts` und die Run-/Choice-Darstellung für sichtbare, side-sichere Zwischenzustände.

## Scope

- Den aktuellen `Gypsy™ Schedule Analyzer`-Ablauf reproduzieren: erfolgreicher R&D-Run mit mehreren Nicht-Agenda-Karten vor einer Agenda und mindestens ein Fall ohne Agenda.
- Prüfen, ob der Engine-Pfad die aufgedeckten Karten, die gefundene Agenda, die HQ-Verschiebung und das R&D-Shuffle korrekt im State und in PublicEvents abbildet.
- Falls der Effekt aktuell sofort und stumm resolved, eine regelkonforme sichtbare Abwicklung ergänzen. Bevorzugt ist ein Runner-seitiger sichtbarer Resolve-/Fensterpfad mit wiederholbarer Aktion wie "nächste R&D-Karte aufdecken" und abschließendem Bestätigen von "Agenda in HQ / übrige Karten mischen", solange dies mit LegalActions, deterministischem Replay und StateHash sauber modelliert ist.
- Mindestens die Spielchronik so erweitern, dass sie aufgedeckte Karten, gefundene Agenda oder "keine Agenda gefunden", HQ-Verschiebung und Shuffle-Count verständlich nennt.
- Fokussierte Engine- und Web-/Chronik-Regressionen ergänzen.

## Nicht im Scope

- Kein Redesign der gesamten Run-, Access- oder Chronik-UI.
- Keine Änderung an normalen R&D-Access-, Multiaccess-, Steal- oder Trash-Regeln.
- Keine Offenlegung von nicht aufgedeckten R&D-Karten, HQ-Karten, Korp-Hand, KI-Inputs, WebSocket-/Reconnect-Payloads oder Replay-Daten.
- Keine Änderung an Seed, RandomCounter, RandomDrawRecords, StateHash-Determinismus oder allgemeinem Shuffle-Vertrag außer dem für diesen Karteneffekt nötigen Pfad.
- Keine generelle Neuinterpretation anderer Classic- oder Originalset-Karten.

## Akzeptanzkriterien

- [x] Nach erfolgreichem `Gypsy™ Schedule Analyzer`-Run werden die tatsächlich aufgedeckten R&D-Karten für den Runner sichtbar, in Reihenfolge nachvollziehbar und ohne zusätzliche verdeckte R&D-Information angezeigt.
- [x] Wenn eine Agenda gefunden wird, wird genau diese Agenda in HQ gespeichert und die Chronik nennt sie als gefunden beziehungsweise nach HQ verschoben.
- [x] Wenn keine Agenda gefunden wird, nennt die Chronik den Fall ausdrücklich.
- [x] Die übrigen aufgedeckten Nicht-Agenda-Karten werden deterministisch in R&D gemischt; Replay und StateHash bleiben stabil.
- [x] Die Korp erhält nur Informationen, die durch den Reveal-Effekt rechtmäßig öffentlich geworden sind; nicht aufgedeckte R&D-Karten bleiben verdeckt.
- [x] Runner- und Korp-PlayerViews, PublicEvents, WebSocket-/Reconnect-Payloads, Undo-Previews, öffentliche Replays und Logs leaken keine zusätzlichen verdeckten Karten.
- [x] Fokussierte Tests decken mindestens einen Fall "Nicht-Agenda, Nicht-Agenda, Agenda" und einen Fall "R&D ohne Agenda" ab.
- [x] Relevante Checks laufen oder werden begründet eingegrenzt; mindestens `git diff --check` nach Umsetzung.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`, weil Kartenregel, Engine-Resolver, PublicPayload, Chronik und KI-/PlayerView-Sichtbarkeit zusammenhängen.
- Zuerst den bestehenden Resolver in `run-access-transition.ts` verstehen, bevor UI-Verhalten ergänzt wird. Falls dort bereits ein korrektes PublicPayload existiert, ist der erste Fixpunkt wahrscheinlich die Web-Chronik oder ein fehlender sichtbarer Resolve-Step.
- Für einen interaktiven Reveal-Pfad nur `LegalActions`/`ChoiceRequests` verwenden; keine UI-only Regelentscheidung.
- Die KI darf für diesen Pfad keine verdeckten R&D-Informationen voraussetzen. Falls die KI den sichtbaren Resolve-Schritt beantworten muss, soll sie nur aktuelle `LegalActions` nutzen.

## Ergebnisnotiz

Abgeschlossen. Der `Gypsy™ Schedule Analyzer`-Ersatz-Zugriff setzt jetzt eine öffentliche Reveal-Payload mit aufgedeckter Kartenfolge, gefundener Agenda, HQ-Speicherung und Shuffle-Count. Die PublicContext-/Schema-Brücke reicht diese Felder side-sicher durch; die Web-Chronik zeigt für Agenda- und No-Agenda-Fälle konkrete, lesbare Ergebniszeilen statt nur Run-Fortschritt.

Regressionen decken den Fall `Nicht-Agenda, Nicht-Agenda, Agenda`, den Fall `R&D ohne Agenda`, PlayerView-/PublicEvent-Sichtbarkeit, Replay/StateHash und die Chronikformatierung ab. Ein separates Klick-für-Klick-Dialogfenster wurde nicht eingeführt; die bestehende Engine-Auflösung ist jetzt sichtbar und regelkonform dokumentiert.
