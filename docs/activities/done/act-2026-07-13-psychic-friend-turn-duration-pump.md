---
activityId: act-2026-07-13-psychic-friend-turn-duration-pump
status: done
kind: fix
area: engine
priority: hotfix
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-07-13
startedAt: 2026-07-13
completedAt: 2026-07-13
branch: codex/act-2026-07-13-psychic-friend-turn-duration
releaseTarget: Classic current-state correction
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/state/temporary-breaker-strength.ts
  - packages/engine/src/index-tests/mechanics/classic-psychic-friend-turn-duration.test.ts
  - docs/releases/classic/classic-rule-decisions-2026-06-30.md
  - data/scenarios/classic-04-runner-program-smoke.json
checks:
  - 44 fokussierte Vitest-Regressionen grün
  - Engine-Typecheck grün
  - Package-Boundaries grün
  - git diff --check grün
  - Architektur-Gate weiterhin rot nur durch fünf bestehende Shell-Traders-Treffer außerhalb dieses Pakets
---

# Psychic Friend: Stärke-Pump bis zum Zugende erhalten

## Ziel

`Psychic Friend` soll für 2 Credits `+1 Stärke bis zum Ende des Zuges` erhalten. Der Bonus bleibt nach dem Ende des aktuellen Runs bestehen, gilt in weiteren Runs desselben Runner-Zuges weiter, stapelt sich bei mehrmaliger Nutzung und verfällt erst beim Ende dieses Zuges.

## Kontext und Quellen

- Nutzerbefund vom 2026-07-13: Die Karte kann für 1 Credit eine Code-Gate-Subroutine brechen und für 2 Credits `+1 Stärke bis zum Ende des Zuges` erhalten. Die aktuelle Anwendung entfernt den Stärke-Bonus jedoch bereits am Run-Ende.
- `data/cards/classic-cards.json` bestätigt für `onr_classic_030_psychic-friend` den Text `[1]: Break code gate subroutine. [2]: +1 strength until end of turn`.
- `packages/engine/src/card-implementations/classic/runner/programs/psychic-friend.ts` modelliert den Pump derzeit ausdrücklich als `pumpDuration: "current_run"`.
- `packages/engine/src/ability-engine/definition-types.ts` und `packages/engine/src/ability-engine/icebreaker-abilities.ts` kennen für Icebreaker-Pumps derzeit nur `current_encounter` und `current_run`.
- `packages/engine/src/game/run/runner-breaker-action-execution.ts` schreibt `current_run`-Bonusse in `run.remainderStrengthBonusByBreaker`; dieses Feld verschwindet erwartungsgemäß mit dem Run-Ende.
- `packages/engine/src/game/run/run-end-cleanup.ts` setzt allgemeine `strengthModifier` aller Runner-Programme am Run-Ende zurück. Ein Turn-Bonus darf deshalb nicht unmarkiert in denselben flüchtigen Wert geschrieben werden.
- Für echte Turn-Dauer existieren bereits eng verwandte Muster: `GameState.temporaryIceStrengthModifiersUntilEndOfTurn`, Sterdroids Turn-Pump und der Cleanup in `turn-runtime-resolvers.ts`.
- Die bisherige Abweichung ist in `docs/releases/classic/classic-rule-decisions-2026-06-30.md` bewusst als `current_run` dokumentiert. Diese Vereinfachung ist durch den Nutzerbefund verworfen und muss im aktuellen Stand korrigiert werden.
- `data/scenarios/classic-04-runner-program-smoke.json` enthält ebenfalls die falsche Erwartung, der Bonus bestehe nur für den aktuellen Run.
- Die Kartendaten-Suche findet im aktiven Kartenpool keinen weiteren Icebreaker-Regeltext mit `strength until end of turn`; die Runtime-Abstraktion soll trotzdem neutral als Turn-Dauer modelliert werden, nicht als kartennamiger Sonderfall.

## Scope

- Die Icebreaker-Pump-Dauer um einen neutralen Wert `current_turn` erweitern und ihn durch CardImplementation, Runtime-Adapter, LegalAction-Revalidierung und Ausführung führen.
- Psychic Friend von `current_run` auf `current_turn` umstellen.
- Turn-gebundene Breaker-Stärke getrennt und deterministisch im `GameState` erfassen, einschließlich Ziel-Breaker, kumuliertem Betrag, erzeugendem Turn und Ablauf `turn_end`.
- Die effektive Breaker-Stärkeberechnung in jedem Encounter um den aktiven Turn-Bonus erweitern, ohne Encounter-, Run- oder permanente Counter-Boni zu verändern.
- Den Bonus weder beim Passieren eines ICE noch beim erfolgreichen, erfolglosen oder freiwilligen Run-Ende entfernen.
- Beim Ende des Runner-Zuges genau die fälligen Turn-Boni entfernen; der Cleanup muss auch nach mehreren Pumps und mehreren Runs korrekt sein.
- Den öffentlichen Modifier-/PlayerView-Vertrag so ergänzen, dass der aktuelle `+N Stärke`-Bonus mit Dauer `turn` für den betroffenen sichtbaren Breaker nachvollziehbar bleibt, ohne neue Hidden-Info-Daten zu veröffentlichen.
- Die falsche Classic-Regelentscheidung und das CLASSIC-04-Smoke-Szenario auf die verbindliche Turn-Dauer korrigieren.
- Prüfen, ob AI-Run-/Encounter-Bewertungen die Engine-/PlayerView-Stärke bereits konsumieren. Nur falls sie den neuen Turn-Bonus sonst ignorieren, die kleinste side-sichere Anpassung im selben Paket vornehmen.

## Nicht im Scope

- Keine Änderung an den Kosten: 1 Credit pro gebrochener Code-Gate-Subroutine und 2 Credits pro `+1 Stärke` bleiben unverändert.
- Keine Änderung an Karten ohne ausdrückliche Turn-Dauer; insbesondere bleiben normale Encounter-Pumps und echte Run-Dauer-Pumps wie `Grubb` unverändert.
- Kein kartennamiger Psychic-Friend-Sonderpfad in allgemeiner Stärke-, Cleanup- oder KI-Logik.
- Kein breiter Umbau aller temporären Modifier oder der gesamten Ability-Engine.
- Keine clientseitige Auswertung des Kartentexts als Regelautorität.
- Keine Änderung an LegalAction-Grundprinzip, Hidden-Info-Grenzen, Zufall, Replay-Reihenfolge oder StateHash-Determinismus.
- Keine Rückwärtskompatibilitätsmigration für alte lokale Replays oder SQLite-Spielstände der Version-0-Umgebung.

## Akzeptanzkriterien

- [x] Psychic Friend bietet im Code-Gate-Encounter weiterhin eine Break-Aktion für 1 Credit und eine Pump-Aktion für 2 Credits an.
- [x] Ein einmaliger Pump erhöht die effektive Stärke sofort um 1; zwei Pumps erhöhen sie kumuliert um 2.
- [x] Der Pump bleibt nach Verlassen des aktuellen ICE und nach Beendigung des aktuellen Runs erhalten.
- [x] In einem zweiten Run desselben Runner-Zuges wird derselbe Turn-Bonus bei der Legalität und Auflösung von Break-Aktionen berücksichtigt, ohne erneut bezahlt werden zu müssen.
- [x] Erfolgreiches Run-Ende, `jack_out` und ein durch eine Subroutine beendeter Run entfernen den Turn-Bonus jeweils nicht.
- [x] Erst das Ende des Runner-Zuges entfernt alle in diesem Zug erzeugten Psychic-Friend-Turn-Boni; im nächsten Runner-Zug gilt wieder die gedruckte Basisstärke, sofern keine anderen Modifier wirken.
- [x] Encounter-, Run-, Turn- und permanente Stärkeanteile stapeln und bereinigen sich unabhängig; Run-End-Cleanup löscht keinen Turn- oder permanenten Anteil.
- [x] Stale oder manipulierte Pump-Aktionen werden weiterhin durch `applyAction` und die vorhandene Kosten-/Timing-Revalidierung abgewiesen.
- [x] PlayerView beziehungsweise öffentliche ActiveModifier-Evidence zeigt den aktiven Breaker-Bonus mit Dauer `turn`, ohne verdeckte Karten- oder Zielinformationen zu leaken.
- [x] Replay desselben Seeds und derselben Aktionen bleibt deterministisch; StateHash berücksichtigt den neuen Turn-Dauer-Zustand.
- [x] `docs/releases/classic/classic-rule-decisions-2026-06-30.md` und `data/scenarios/classic-04-runner-program-smoke.json` behaupten nicht länger fälschlich `current_run`.
- [x] Fokussierte Engine-Regressionen decken mindestens Stapeln, zwei Runs im selben Zug, alle relevanten Run-End-Arten und Cleanup am Runner-Zugende ab.
- [x] Die relevanten Engine-Tests, Engine-Typecheck und `git diff --check` sind grün oder ein bereits bestehender paketfremder Fehler ist klar benannt.

## Umsetzungshinweise

- Bevorzugt das vorhandene Turn-Dauer-Muster von Sterdroid verallgemeinern, ohne ICE- und Breaker-Ziele in dasselbe unscharfe Feld zu mischen. Ein typisiertes `temporaryBreakerStrengthModifiersUntilEndOfTurn` oder ein gleichwertiger neutraler Vertrag ist gegenüber einer Nutzung von `CardInstance.strengthModifier` vorzuziehen, weil Run-End-Cleanup diesen Wert pauschal auf 0 setzt.
- Wahrscheinliche Kernstellen:
  - `packages/shared/src/index.ts`
  - `packages/engine/src/ability-engine/definition-types.ts`
  - `packages/engine/src/ability-engine/icebreaker-abilities.ts`
  - `packages/engine/src/card-implementations/helpers.ts`
  - `packages/engine/src/card-implementations/classic/runner/programs/psychic-friend.ts`
  - `packages/engine/src/game/run/runner-breaker-action-execution.ts`
  - `packages/engine/src/game/engine-runtime-internal/card-strength-cost-runtime-services.ts`
  - `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts`
  - `packages/engine/src/ability-engine/active-modifiers.ts`
- Die roten Regressionen sollen zuerst die heutige falsche Run-Ende-Auslöschung nachweisen. Danach dieselbe Spielsituation bis zum Runner-Zugende fortführen und dort den korrekten Ablauf beweisen.
- Bei der Dokumentationskorrektur die frühere Vereinfachung sichtbar als abgelöst markieren, nicht als weiterhin zulässige Abweichung stehen lassen.

## Ergebnisnotiz

Psychic Friend verwendet jetzt die neutrale Icebreaker-Pump-Dauer `current_turn`. Der kumulierte Bonus liegt getrennt von Encounter-, Run- und permanenten Stärkeanteilen im deterministischen GameState, wirkt in LegalActions und PlayerView, bleibt über erzwungene, freiwillige und erfolgreiche Run-Enden bestehen und verfällt erst am Runner-Zugende. Die KI-Pfade lesen Engine-LegalActions und die sichtbare Breaker-Stärke; daher war keine KI-Sonderlogik erforderlich.
