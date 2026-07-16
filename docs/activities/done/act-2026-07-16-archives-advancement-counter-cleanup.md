---
activityId: act-2026-07-16-archives-advancement-counter-cleanup
status: done
kind: fix
area: engine
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-16
startedAt: 2026-07-16
completedAt: 2026-07-16
branch: codex/activities-worktree-20260716-counter-cleanup
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/state/turn-flags-counters.ts
  - packages/engine/src/game/state/turn-flags-counters.test.ts
  - packages/engine/src/index-tests/originalset/hidden-access-run-regressions.test.ts
  - packages/engine/src/index-tests/releases/card-release-smokes.test.ts
checks:
  - corepack pnpm exec vitest run packages/engine/src/game/state/turn-flags-counters.test.ts --reporter=dot
  - corepack pnpm exec vitest run packages/engine/src/index-tests/originalset/hidden-access-run-regressions.test.ts --reporter=dot
  - corepack pnpm exec vitest run packages/engine/src/index-tests/releases/card-release-smokes.test.ts -t "lets the Corp install an agenda over an installed asset" --reporter=dot
  - corepack pnpm --filter @netgrid/engine typecheck
  - git diff --check
---

# Advancement Counter beim Wechsel nach Archives entfernen

## Ziel

Wenn eine Korp-Karte nach Archives gelangt, liegen auf ihr keine Advancement Counter mehr. Das gilt insbesondere, wenn der Runner eine zuvor entwickelte Ambush-/Node-Karte nach dem Zugriff und der Schadensabwicklung trasht.

## Kontext und Quellen

- Playtest-Beobachtung vom 2026-07-16: Eine für 2 Credits gerezzte und zweimal entwickelte Ambush-/Node-Karte, wahrscheinlich `Vacant Soulkiller`, wurde vom Runner zugegriffen. Der Runner verhinderte den ausgelösten Schaden und trashte die Karte anschließend. In Archives wurden weiterhin zwei Advancement Counter auf der Karte angezeigt.
- `data/cards/originalset-v1-cards.json`: `Vacant Soulkiller` (`onr_v1_346_vacant-soulkiller`) hat Rez-Kosten 2 und verursacht beim Zugriff pro Advancement Counter 1 Core Damage.
- `packages/engine/src/game/access/access-flow.ts`: Die Aktion `trash_accessed_card` führt installierte Korp-Karten über `trashCorpInstalledCardToArchives` nach Archives.
- `packages/engine/src/game/engine-runtime-internal/lifecycle-runtime.ts`: Der zentrale Archives-Trash-Helfer ruft nach dem Zonenwechsel `clearCardCounters` auf.
- `packages/engine/src/game/state/turn-flags-counters.ts`: `clearCardCounters` entfernt derzeit nur die allgemeine `counters`-Map. Das separate, StateHash-relevante Feld `advancementCounters` bleibt unverändert und erklärt den beobachteten Fehler.
- Follow-up zu `docs/activities/done/act-2026-05-17-agenda-install-over-node-replacement.md`: Dort wurde bereits als Ergebnis festgehalten, dass der zentrale Archives-Trash-Helfer Counter aufräumt; der aktuelle Befund zeigt, dass dieser Vertrag Advancement Counter noch nicht vollständig erfüllt.

## Scope

- Den zentralen Counter-Cleanup-Vertrag so korrigieren, dass beim Verlassen des installierten Zustands in Richtung Archives auch `advancementCounters` deterministisch auf `0` gesetzt wird.
- Prüfen, dass alle Aufrufer von `trashCorpInstalledCardToArchives` davon profitieren, insbesondere:
  - Runner trasht eine zugegriffene installierte Korp-Karte.
  - Korp-Karte wird durch Installations-/Kapazitäts-Replacement nach Archives gelegt.
  - Korp-Karte trasht sich selbst oder wird durch einen Karteneffekt getrasht.
- Eine fokussierte Regression für eine entwickelte Access-Ambush-Karte aufnehmen, bevorzugt `Vacant Soulkiller`: Zugriff, Schadensabwicklung bzw. Schadensverhinderung, anschließend Trash; danach liegt die Karte mit `advancementCounters: 0` in Archives.
- Mindestens einen Regressionstest für den zentralen Cleanup-Helfer oder einen zweiten Archives-Trash-Aufrufer ergänzen, damit die Korrektur nicht nur kartenindividuell abgesichert ist.
- Replay und StateHash des korrigierten Ablaufs prüfen.

## Nicht im Scope

- Keine Änderung an Schaden, Schadensverhinderung, Access-Reihenfolge, Rez-Entscheidung oder Trash-Kosten von `Vacant Soulkiller` oder anderen Ambush-Karten.
- Keine Änderung daran, dass Advancement Counter auf installierten verdeckten Korp-Karten öffentlich sichtbar sind.
- Keine UI-Sonderbehandlung, die verbliebene Counter nur in Archives ausblendet; der Engine-Zustand selbst muss korrekt sein.
- Keine pauschale Neudefinition kartenindividueller persistenter Counter außerhalb des normalen Leave-Play-/Zonenwechselvertrags.
- Keine Hidden-Info-, LegalAction-, PublicEvent-, Replay- oder StateHash-Aufweichung.

## Akzeptanzkriterien

- [x] Eine installierte Korp-Karte mit Advancement Countern hat nach `trashCorpInstalledCardToArchives` den Wert `advancementCounters: 0`.
- [x] Beim Zugriff auf eine entwickelte `Vacant Soulkiller` wird die Schadensmenge weiterhin aus der Counter-Anzahl vor dem Trash berechnet; nach Schadensabwicklung oder -verhinderung und anschließendem Trash liegt die Karte ohne Advancement Counter in Archives.
- [x] Der Access-Trash-Ablauf verwendet weiterhin eine aus `LegalActions` abgeleitete Aktion, und `applyAction` revalidiert den aktuellen Zugriff, die Karte, die Kosten und die StateVersion.
- [x] Der zentrale Cleanup entfernt weiterhin allgemeine kartengebundene Counter, ohne andere Spielzustandsfelder unbeabsichtigt zu löschen.
- [x] Mindestens ein weiterer zentraler Archives-Trash-Pfad ist durch Test oder vorhandene passende Regression gegen liegenbleibende Advancement Counter abgesichert.
- [x] PlayerViews und UI zeigen in Archives keine Advancement Counter, weil der zugrunde liegende Engine-Zustand bereinigt ist.
- [x] Öffentliche Events verraten keine zusätzliche verdeckte Karteninformation.
- [x] Replay des korrigierten Ablaufs ist erfolgreich und sein StateHash stimmt mit dem direkt ausgeführten Zustand überein.
- [x] Fokussierte Engine-Tests, Engine-Typecheck und `git diff --check` sind erfolgreich.

## Umsetzungshinweise

- Wahrscheinlicher kleinster Fixpunkt ist `clearCardCounters` bzw. `cardInstanceWithoutCounters` in `packages/engine/src/game/state/turn-flags-counters.ts`. Vor einer Änderung die vorhandenen Aufrufer prüfen, weil der Helper auch Runner-Karten beim Verlassen des installierten Zustands bereinigt.
- Die Schadenswirkung muss die Advancement Counter vor dem Archives-Cleanup auswerten. Der bestehende Access-Ablauf tut dies vor `trash_accessed_card`; die Regression soll diese Reihenfolge festhalten.
- Keine reine View-Korrektur ergänzen. `advancementCounters` ist Bestandteil des deterministischen GameState und muss am Zonenwechsel selbst bereinigt werden.
- Wenn die Aufruferprüfung weitere Zonenwechsel findet, die denselben Leave-Play-Vertrag umgehen, dafür kleine Folge-Activities anlegen statt diesen Fix zu einem allgemeinen Zonenmodell-Refactor auszuweiten.

## Ergebnisnotiz

Abgeschlossen am 2026-07-16. `cardInstanceWithoutCounters` entfernt weiterhin die allgemeine `counters`-Map und setzt jetzt zusätzlich das separate Feld `advancementCounters` deterministisch auf `0`. Damit bereinigt der zentrale Archives-Trash-Helfer alle kartengebundenen Counter, ohne den vorangehenden Access-Effekt zu verändern.

Die neue Vacant-Soulkiller-Regression bildet den Playtest-Ablauf mit zwei Advancement Countern, partiellem Core-Damage-Schutz durch Lifesaver Nanosurgeons und anschließendem legalen `trash_accessed_card` ab. Vor dem Trash bleiben die Counter für die Schadensberechnung erhalten; danach sind Engine-State und Runner-Archives-Ansicht counterfrei. Replay und StateHash stimmen überein. Der bestehende Agenda-over-Asset-Replacement-Test sichert denselben Cleanup zusätzlich für einen zweiten zentralen Archives-Pfad. Alle paketbezogenen Tests, der Engine-Typecheck und `git diff --check` sind grün; es bleiben keine paketbezogenen Folgepunkte offen.
