---
activityId: act-2026-07-18-hidden-bank-voluntary-payment-support
status: done
kind: fix
area: engine
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-18
startedAt: 2026-07-19
completedAt: 2026-07-19
branch: codex/hidden-bank-voluntary-payment-support
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/payment/runner-payment-support.ts
  - packages/engine/src/game/legal-actions.ts
  - packages/engine/src/game/run/run-duration-payment.ts
  - packages/engine/src/game/install/install-card.ts
  - packages/engine/src/game/play/play-card-execution.ts
  - packages/engine/src/game/access/access-resolution-actions.ts
  - packages/engine/src/game/abilities/trigger-ability-execution.ts
  - packages/engine/src/game/economy/credit-economy-execution.ts
  - packages/engine/src/game/trace/trace-orchestration.ts
  - packages/engine/src/index-tests/proteus/hidden-resource-hardening.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/hidden-resource-hardening.test.ts src/game/run/run-duration-payment.test.ts src/game/run/runner-breaker-action-execution.test.ts src/game/trace/trace-orchestration.test.ts src/game/install/install-card.test.ts
  - corepack pnpm --filter @netgrid/engine test
  - corepack pnpm --filter @netgrid/engine typecheck
  - git diff --check
---

# Hidden Bank Resources bei freiwillig bezahlbaren Kosten anbieten

## Ziel

`Chiba Bank Account` und die verwandten Hidden-Bank-Resources müssen in ihrem
gedruckten Timingfenster auch dann nutzbar sein, wenn der Runner die angekündigte
Kosten- oder Penalty-Zahlung bereits ohne Support bezahlen könnte. Insbesondere
muss der Runner beim Pumpen eines Icebreakers und beim Brechen einer Subroutine
die Bankkarte vor der endgültigen Zahlung regelkonform aufdecken und opfern
können.

## Kontext und Quellen

- Playtest-Fund vom 2026-07-18: Während eines Runs war bei einer kostenpflichtigen
  Icebreaker-Pump-/Break-Aktion weder an `Chiba Bank Account` noch in der
  Aktionsliste eine Möglichkeit sichtbar, die Bankkarte für die Zahlung zu
  opfern.
- Lokaler Kartentext in `docs/source/Proteusspoiler.txt`: `[1], [T]: Gain [4].
  You may use this ability whenever you pay any cost or penalty.`
- Karten-ID: `onr_proteus_133_chiba-bank-account`.
- `packages/engine/src/game/payment/runner-payment-support.ts` öffnet das
  generische Support-Fenster derzeit nur, wenn
  `availableWithoutSupport < amount`. Eine bereits aus normalen oder speziellen
  Pools bezahlbare Zahlung wird sofort ausgeführt; dadurch gibt es kein
  `runner_cost_penalty_support`-Fenster und keine Chiba-`LegalAction`.
- Folgefund zum abgeschlossenen PRO011-1-Paket
  `docs/activities/done/act-2026-05-27-proteus-pro011-1-hidden-resource-timing-hardening.md`
  und zum abgeschlossenen Prozess
  `docs/architecture/engine/runner-payment-support-hidden-resources-process-2026-06-30.md`.

## Scope

- Den generischen Runner-Payment-Support-Vertrag so korrigieren, dass eine
  positive Runner-Kosten- oder Penalty-Zahlung ein freiwilliges Support-Fenster
  anbieten kann, sobald mindestens eine aktuell legal nutzbare
  `runner_cost_penalty_support`-Ability vorhanden ist — auch ohne Credit-Defizit.
- Einen eindeutigen Ablehnen-/Fortsetzen-Pfad bereitstellen: Der Runner muss
  Support überspringen und die ursprüngliche Aktion ohne Doppelzahlung genau
  einmal fortsetzen können.
- Pump- und Break-Zahlungen im Run mit `Chiba Bank Account` als konkrete
  Regression abdecken.
- Die gemeinsam betroffene Familie `Chiba Bank Account`, `Liberated Savings
  Account` und `Swiss Bank Account` gegen denselben freiwilligen Fenstervertrag
  prüfen.
- Sichtbare LegalActions und Labels so prüfen, dass der Runner während des
  Fensters versteht, wie die Bankkarte genutzt oder die Zahlung ohne Support
  fortgesetzt wird.

## Nicht im Scope

- Kein frei nutzbarer Hauptphasen-Knopf für Bankkarten außerhalb einer
  tatsächlich angekündigten Kosten- oder Penalty-Zahlung.
- Kein UI-Redesign und keine kombinatorischen Varianten der ursprünglichen
  Pump-/Break-Aktion pro möglicher Bankkarten-Kombination.
- Keine Änderung der gedruckten Kartenkosten oder Gewinne.
- Keine Abschwächung von Hidden-Info-, LegalAction-, Replay-, StateHash-,
  StateVersion- oder stale-action-Grenzen.
- Keine automatische Auswahl oder automatische Opferung einer Hidden Resource.

## Akzeptanzkriterien

- [x] Bei einer bezahlbaren positiven Icebreaker-Pump-Kostenaktion erhält der
  Runner vor der endgültigen Zahlung eine legale Chiba-Support-Option und eine
  eindeutige Option, ohne Support fortzufahren.
- [x] Dasselbe Verhalten ist für eine bezahlbare Break-Subroutine-Kostenaktion
  abgesichert.
- [x] Nach Auswahl von Chiba werden 1 Credit bezahlt, Chiba aufgedeckt in den
  Runner-Heap gelegt, 4 Credits gewonnen und die ursprüngliche Zahlung danach
  erneut vollständig validiert und genau einmal ausgeführt.
- [x] Nach Ablehnung des Supports wird die ursprüngliche Aktion genau einmal aus
  den zulässigen Runner-Zahlungspools bezahlt und normal aufgelöst.
- [x] Außerhalb einer angekündigten positiven Kosten-/Penalty-Zahlung erscheint
  keine Chiba-Aktion.
- [x] Getappte, bereits geopferte, nicht bezahlbare oder stale Bankkarten werden
  nicht angeboten beziehungsweise von `applyAction` zurückgewiesen.
- [x] Mehrere nutzbare Bankkarten erzeugen keine kombinatorische Explosion der
  ursprünglichen LegalAction und können nur innerhalb desselben gebundenen
  Zahlungsfensters eingesetzt werden.
- [x] Runner- und Korp-PlayerViews, PublicEvents, Replay und StateHash bleiben
  deterministisch und leaken vor der gewählten Aktivierung keine verdeckte
  Kartenidentität.
- [x] Paketnahe Engine-Tests für den generischen Support-Core sowie Pump- und
  Break-Zahlungen sind grün; Engine-Typecheck und `git diff --check` sind grün.

## Umsetzungshinweise

- Primär die Öffnungsbedingung und Zustandsmaschine in
  `packages/engine/src/game/payment/runner-payment-support.ts` prüfen. Die
  bestehende Defizitlogik darf nicht einfach entfernt werden, ohne einen
  expliziten Fortsetzen-/Ablehnen-Pfad gegen Endlosschleifen abzusichern.
- Pump und Break laufen über
  `packages/engine/src/game/run/runner-breaker-action-execution.ts` und
  `spendRunnerRunCredits`; sowohl normale Credits als auch run-spezifische Pools
  müssen bei der Revalidierung erhalten bleiben.
- Bestehende Regressionen in
  `packages/engine/src/index-tests/proteus/hidden-resource-hardening.test.ts`
  erweitern und einen konkreten Run-Regressionstest ergänzen.
- Falls die Engine bereits korrekte LegalActions erzeugt, aber der Webclient sie
  filtert oder missverständlich darstellt, daraus ein separates kleines
  `small-adjustments-agent`-Folgepaket schneiden; die Engine-Regelkorrektur nicht
  mit einem UI-Sonderweg umgehen.

## Ergebnisnotiz

Das gemeinsame Runner-Kostenfenster wird bei jeder positiven, mit vorhandenem
Bank-Support bezahlbaren Zahlung freiwillig geöffnet, auch wenn die normalen
Zahlungspools bereits ausreichen. Die ursprüngliche LegalAction bleibt als
explizit beschriftete Fortsetzen-Option gebunden; beim erneuten Einreichen wird
das Fenster geschlossen und die Zahlung genau einmal revalidiert und ausgeführt.

Die Defizitfilter wurden an allen vorhandenen Einstiegspunkten entfernt, sodass
Pump, Break, Run-Start, Installationen, Events, Abilities, Access-Zahlungen und
Trace denselben Vertrag verwenden. Regressionen prüfen Chiba, Liberated und
Swiss sowie den Support- und Ablehnen-Pfad bei bezahlbaren Pump-/Break-Aktionen.
