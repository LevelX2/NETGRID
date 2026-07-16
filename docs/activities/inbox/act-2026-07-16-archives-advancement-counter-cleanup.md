---
activityId: act-2026-07-16-archives-advancement-counter-cleanup
status: inbox
kind: fix
area: engine
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-16
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Eine installierte Korp-Karte mit Advancement Countern hat nach `trashCorpInstalledCardToArchives` den Wert `advancementCounters: 0`.
- [ ] Beim Zugriff auf eine entwickelte `Vacant Soulkiller` wird die Schadensmenge weiterhin aus der Counter-Anzahl vor dem Trash berechnet; nach Schadensabwicklung oder -verhinderung und anschließendem Trash liegt die Karte ohne Advancement Counter in Archives.
- [ ] Der Access-Trash-Ablauf verwendet weiterhin eine aus `LegalActions` abgeleitete Aktion, und `applyAction` revalidiert den aktuellen Zugriff, die Karte, die Kosten und die StateVersion.
- [ ] Der zentrale Cleanup entfernt weiterhin allgemeine kartengebundene Counter, ohne andere Spielzustandsfelder unbeabsichtigt zu löschen.
- [ ] Mindestens ein weiterer zentraler Archives-Trash-Pfad ist durch Test oder vorhandene passende Regression gegen liegenbleibende Advancement Counter abgesichert.
- [ ] PlayerViews und UI zeigen in Archives keine Advancement Counter, weil der zugrunde liegende Engine-Zustand bereinigt ist.
- [ ] Öffentliche Events verraten keine zusätzliche verdeckte Karteninformation.
- [ ] Replay des korrigierten Ablaufs ist erfolgreich und sein StateHash stimmt mit dem direkt ausgeführten Zustand überein.
- [ ] Fokussierte Engine-Tests, Engine-Typecheck und `git diff --check` sind erfolgreich.

## Umsetzungshinweise

- Wahrscheinlicher kleinster Fixpunkt ist `clearCardCounters` bzw. `cardInstanceWithoutCounters` in `packages/engine/src/game/state/turn-flags-counters.ts`. Vor einer Änderung die vorhandenen Aufrufer prüfen, weil der Helper auch Runner-Karten beim Verlassen des installierten Zustands bereinigt.
- Die Schadenswirkung muss die Advancement Counter vor dem Archives-Cleanup auswerten. Der bestehende Access-Ablauf tut dies vor `trash_accessed_card`; die Regression soll diese Reihenfolge festhalten.
- Keine reine View-Korrektur ergänzen. `advancementCounters` ist Bestandteil des deterministischen GameState und muss am Zonenwechsel selbst bereinigt werden.
- Wenn die Aufruferprüfung weitere Zonenwechsel findet, die denselben Leave-Play-Vertrag umgehen, dafür kleine Folge-Activities anlegen statt diesen Fix zu einem allgemeinen Zonenmodell-Refactor auszuweiten.

## Ergebnisnotiz

Noch offen.
