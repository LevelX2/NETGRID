# ENGINE-STATUS-4: Index-/RuntimeDeps-Readiness nach ARCH-74

Stand: 2026-05-26
Auftrag: `ENGINE-STATUS-4-post-arch74-index-runtime-deps-audit`
Branch: `codex/card-implementation-next-task`

## A. Ausgangspunkt/Branch/Commits

Der Audit wurde im aktuellen NETGRID-Worktree auf `codex/card-implementation-next-task` durchgeführt. Der Worktree war zu Beginn sauber.

Geprüfte Commit-Voraussetzungen:

| Commit | Befund |
| --- | --- |
| `cafa2bf0 refactor(engine): extract hidden zone trigger execution` | vorhanden, ARCH-74 |
| `3da9f5ade09f056cc66ddc25bf0d34e2bf2e5bd1 refactor(engine): extract counter utility trigger execution` | vorhanden, ARCH-73 |
| `c9eaad4bc8efa860d86668b664a4d74589e1f297 refactor(engine): extract run fort trigger execution` | vorhanden, ARCH-72 |
| `572e496be9cabff2b6fb93d6e3fbf0fc80864caf refactor(engine): extract runner special trigger execution` | vorhanden, ARCH-71 |
| `d31911498dc89c713b596538a9fc0affe7a994d7` | vorhanden, STATUS-3 |

## B. Methodik und gelesene Quellen

Gelesen wurden die Wiki-Pflichtquellen, `agents/architecture-review-agent.md`, die angeforderten Architekturquellen und die aktuellen ApplyAction-/LegalAction-/Replay-/View-/Choice-/Runtime-/Game-Module. Die Messung erfolgte per LOC-Zählung, Blockgrößenzählung, Case-Zerlegung, Importsuche, `onr_v1_`-Suche und gezielter Host-/RuntimeDeps-Analyse.

Gelesene Pflichtquellen:

- `docs/architecture/engine-perform-action-readiness-post-arch63.md`
- `docs/architecture/engine-apply-action-boundary-analysis.md`
- `docs/architecture/ability-engine/ability-engine-restructuring-status-post-arch52.md`
- `docs/architecture/ability-engine/ability-engine-restructuring-status-current.md`
- `docs/architecture/ability-engine/pending-choice-replay-marker-stability-p3-71.md`

Analysierte Codebereiche:

- `packages/engine/src/index.ts`, `packages/engine/src/index.test.ts`
- `packages/engine/src/public-context.ts`
- `packages/engine/src/game/apply-action.ts`, `apply-game-action.ts`, `legal-actions.ts`, `player-view.ts`, `replay.ts`, `events/build-event.ts`
- `packages/engine/src/game/abilities/`, `economy/`, `damage/`, `trace/`, `rez/`, `install/`, `turn/`, `run/`, `access/`, `corp/`, `hidden-zone/`, `payment/`, `view/`
- `packages/engine/src/ability-engine/`
- `packages/engine/src/card-implementations/`
- `packages/engine/src/compatibility/`

## C. Kernmesswerte

| Artefakt | LOC aktuell | Befund |
| --- | ---: | --- |
| `packages/engine/src/index.ts` | 15.832 | unter 16k; weiterhin Host-/RuntimeDeps-/Helper-Zentrale |
| Reduktion seit STATUS-1 (`32.111`) | 16.279 | ca. 50,7 % |
| `performAction` | 384 | deutlich kleiner, aber noch nicht move-ready |
| `cardImplementationRuntimeDeps` | 661 | größter einzelner Host-Block in `index.ts` |
| Top-Level-Properties in `cardImplementationRuntimeDeps` | 68 | weiter breite Runtime-Host-Fläche |
| `public-context.ts` | 1.820 | read-only PublicPayload-/View-Monolith |
| `publicContextForAction` | 1.760 | eine große Funktion |
| `buildEventHost` in `index.ts` | 9 | nur noch Wiring |
| `ApplyActionCoreHost` in `index.ts` | 5 | nur `actions.performAction` |
| `LegalActionGenerationHost`-Factory in `index.ts` | 29 | Fassade, aber hostet große Subhosts |
| `TriggerAbilityExecutionHost`-Factory in `index.ts` | 56 | nach ARCH-74 fachlich klarer, aber weiter Host-Wiring |
| produktive `game/* -> index` Imports | 0 | Zielgrenze hält |
| Testimports `game/*.test.ts -> index` | 48 | bewusst als Cross-Flow-Regression |

Top 40 verbleibende Funktionen/Objekte in `index.ts`:

| Rang | Funktion/Objekt | LOC | Startzeile | Einordnung |
| ---: | --- | ---: | ---: | --- |
| 1 | `cardImplementationRuntimeDeps` | 661 | 771 | RuntimeDeps-Host |
| 2 | `RUNNER_EVENT_RESOLVERS` | 439 | 1789 | Runner-Event-Resolverkatalog |
| 3 | `performAction` | 384 | 5080 | Execution-Dispatcher mit Restmutation |
| 4 | `CORP_OPERATION_RESOLVERS` | 193 | 2229 | Corp-Operation-Resolverkatalog |
| 5 | `startRun` | 164 | 5851 | lokaler Run-Start-Mutator |
| 6 | `specialZoneHarnessActions` | 137 | 3873 | Special-Zone-LegalActions |
| 7 | `continueRun` | 123 | 6251 | lokaler Run-Continuation-Fallback |
| 8 | `runnerMainActionGenerationHost` | 121 | 3027 | Host-Factory |
| 9 | `applyCorpStartOfTurnEffects` | 120 | 7824 | Turn-/Start-of-turn-Mutation |
| 10 | `installCardHost` | 117 | 4815 | Host-Factory |
| 11 | `scoredAgendaFlowHost` | 116 | 10488 | Host-Factory |
| 12 | `corpMainActionGenerationHost` | 105 | 2704 | Host-Factory |
| 13 | `creditEconomyExecutionHost` | 105 | 4502 | Host-Factory |
| 14 | `accessEffectHandlerHost` | 105 | 11466 | Host-Factory |
| 15 | `resolveCorpUtilityOperation` | 103 | 15265 | Operation-/Utility-Mutator |
| 16 | `resolveV1911RunnerHiddenZoneAbility` | 102 | 13445 | Hidden-Zone-Resthelper |
| 17 | `resolvePileDriverBreakSubroutinesAction` | 100 | 4126 | Encounter-/Breaker-Mutation |
| 18 | `advancementDistributionOptions` | 97 | 9395 | Choice-Option-Builder |
| 19 | `runEndCleanupHost` | 95 | 11205 | Host-Factory |
| 20 | `pendingChoiceResolutionHost` | 95 | 11596 | Host-Factory |
| 21 | `resolveDiscardChoice` | 89 | 11749 | Choice-Mutation |
| 22 | `resolveRunnerProgramTrashBeforeInstallChoice` | 88 | 5655 | Install-/Choice-Mutation |
| 23 | `resolveIncubatorTransformChoice` | 88 | 12759 | Hidden-Zone-/Choice-Mutation |
| 24 | `runAccessTransitionHost` | 86 | 11379 | Host-Factory |
| 25 | `applyRunnerStartOfTurnEffects` | 82 | 8072 | Turn-/Start-of-turn-Mutation |
| 26 | `applyQuestForCattekinStartOfTurn` | 82 | 8155 | Start-of-turn-Sondermutation |
| 27 | `hiddenZoneSearchHandlerHostBase` | 78 | 10149 | Host-Factory |
| 28 | `traceOrchestrationHost` | 77 | 5002 | Host-Factory |
| 29 | `startIncubatorTransformChoice` | 72 | 8377 | Hidden-Zone-Choice |
| 30 | `resolveRunnerInstalledConnectionTrashBadPublicityChoice` | 72 | 13042 | Choice-/Trash-Mutation |
| 31 | `applyProteusPurgeableRunnerVirusCorpStartEffects` | 71 | 7945 | Turn-/Counter-Mutation |
| 32 | `restoreCodeViralCachePreservedCounters` | 70 | 14600 | Counter-/Choice-Mutation |
| 33 | `moveToSpecialZone` | 69 | 15564 | Zone-Mutator |
| 34 | `rezCardHost` | 68 | 4933 | Host-Factory |
| 35 | `resolveCardImplementationMoveAdvancementChoice` | 68 | 9746 | Choice-/Counter-Mutation |
| 36 | `scoredAgendaAbilityHost` | 68 | 10605 | Host-Factory |
| 37 | `executeEffectCommands` | 68 | 14205 | Effect-Command-Mutator |
| 38 | `resolveBlinkBreakSubroutineAction` | 67 | 6414 | Encounter-/Damage-Mutation |
| 39 | `resolveForgedActivationOrdersCorpChoice` | 67 | 12434 | Choice-/Rez-Mutation |
| 40 | `resolveV1921PlayfulAiChoice` | 66 | 13342 | Choice-/RNG-Mutation |

Größte produktive Dateien unter `game/`:

| Rang | Datei | LOC | Schwelle |
| ---: | --- | ---: | --- |
| 1 | `game/damage/damage-core.ts` | 2.276 | >2000 |
| 2 | `game/access/access-effect-handlers.ts` | 1.485 | >1000 |
| 3 | `game/turn/runner-main-actions.ts` | 1.095 | >1000 |
| 4 | `game/view/card-view.ts` | 985 | >750 |
| 5 | `game/run/successful-run-interventions.ts` | 982 | >750 |
| 6 | `game/hidden-zone/search-choice-handlers.ts` | 961 | >750 |
| 7 | `game/run/run-end-cleanup.ts` | 932 | >750 |
| 8 | `game/hidden-zone/nonsearch-choice-handlers.ts` | 927 | >750 |
| 9 | `game/run/encounter-resolution.ts` | 915 | >750 |
| 10 | `game/hidden-zone/arrange-choice-handlers.ts` | 902 | >750 |
| 11 | `game/turn/corp-main-actions.ts` | 871 | >750 |
| 12 | `game/trace/trace-orchestration.ts` | 829 | >750 |
| 13 | `game/run/encounter-special-windows.ts` | 819 | >750 |
| 14 | `game/access/access-flow.ts` | 807 | >750 |
| 15 | `game/economy/credit-economy-execution.ts` | 805 | >750 |
| 16 | `game/run/run-rez-window.ts` | 762 | >750 |
| 17 | `game/hidden-zone/search-choice-activations.ts` | 760 | >750 |
| 18 | `game/corp/scored-agenda-flow.ts` | 753 | >750 |
| 19 | `game/run/fort-run-side-families.ts` | 748 | >500 |
| 20 | `game/run/encounter-actions.ts` | 717 | >500 |
| 21 | `game/payment/trace-payment.ts` | 698 | >500 |
| 22 | `game/run/fort-pass-window.ts` | 682 | >500 |
| 23 | `game/run/run-duration-payment.ts` | 664 | >500 |
| 24 | `game/install/install-card.ts` | 639 | >500 |
| 25 | `game/run/run-access-transition.ts` | 631 | >500 |
| 26 | `game/corp/install-rez-sequence-handlers.ts` | 586 | >500 |
| 27 | `game/abilities/runner-special-trigger-execution.ts` | 560 | >500 |
| 28 | `game/hidden-zone/corp-zone-choice-handlers.ts` | 546 | >500 |
| 29 | `game/run/encounter-printed-effects.ts` | 537 | >500 |
| 30 | `game/validation.ts` | 536 | >500 |
| 31 | `game/choices/pending-choice-resolution.ts` | 513 | >500 |
| 32 | `game/run/run-movement.ts` | 506 | >500 |
| 33 | `game/run/encounter-printed-nontrace-effects.ts` | 503 | >500 |
| 34 | `game/access/access-actions.ts` | 502 | >500 |

Top-Dateien unter `ability-engine/`:

| Datei | LOC | Befund |
| --- | ---: | --- |
| `ability-engine/card-implementation-runtime.ts` | 2.215 | Runtime-Orchestrierung, groß aber ID-frei |
| `ability-engine/definition-types.ts` | 1.847 | DSL-/Typ-Monolith |
| `ability-engine/effect-interpreter.ts` | 1.725 | Effect-Interpreter-Monolith |
| `ability-engine/card-implementation-effect-adapters.ts` | 395 | schmaler Adapterknoten |
| `ability-engine/card-implementation-modifiers.ts` | 349 | Modifier-Knoten |
| `ability-engine/active-modifiers.ts` | 312 | Modifier-Knoten |

## D. Fortschritt seit STATUS-1, STATUS-2 und STATUS-3

| Messwert | STATUS-1 | STATUS-2 | STATUS-3 | STATUS-4 | Veränderung seit STATUS-1 |
| --- | ---: | ---: | ---: | ---: | ---: |
| `index.ts` | 32.111 | 22.191 | 20.161 | 15.832 | -16.279 LOC, ca. -50,7 % |
| `performAction` | 1.401 | 1.324 | 1.328 | 384 | -1.017 LOC, ca. -72,6 % |
| `cardImplementationRuntimeDeps` | 647 | 661 | 661 | 661 | weiter breit |
| `public-context.ts` | 1.661 | 1.804 | 1.804 | 1.820 | leicht gewachsen |
| produktive `game/* -> index` Imports | mehrere Wrapper | Wrapper | 0 Fachimporte | 0 | Zielgrenze hält |

Seit STATUS-3 wurden die großen `performAction`-Familien Turn-basic, Install, Rez, Trace, Damage, Economy, TriggerAbility und mehrere Trigger-Delegate-Familien fachlich nach `game/` verlagert. Der zentrale Restknoten ist damit nicht mehr primär `performAction`, sondern die Kombination aus RuntimeDeps, Host-Factories, PublicContext-Wiring und lokalen Shared-Mutatoren.

## E. Aktueller `applyAction`-/`performAction`-Stand

`game/apply-action.ts` ist weiter der echte ApplyAction-Core. `index.ts` konfiguriert nur noch:

- `ApplyActionCoreHost` mit `actions.performAction` (5 LOC)
- `ApplyGameActionHost` mit `applyAction`
- `ReplayHost` mit `applyAction`
- `BuildEventHost` mit `publicContextForAction`
- `LegalActionGenerationHost` mit Subhost-Factories

`performAction` ist 384 LOC und enthält aktuell diese Cases:

| Case | LOC | Einordnung |
| --- | ---: | --- |
| `activated_card_ability` | 13 | Dispatcher auf CardImplementation/Corp/Agenda-Handler |
| `gain_credit` | 3 | Dispatcher auf Economy |
| `play_event` | 3 | Dispatcher auf lokalen Runner-Event-Resolver |
| `play_operation` | 38 | echte Operation-/Zone-/Payment-Mutation |
| `install_card` | 3 | Dispatcher auf InstallCard |
| `advance_card` | 15 | echte Advance-/Credit-/Roving-Mutation |
| `score_agenda` | 6 | Dispatcher auf ScoredAgendaFlow |
| `start_run` | 51 | echte Run-Start-/Wilson-/Tax-Mutation |
| `jack_out` | 3 | Dispatcher auf RunMovement |
| `rez_ice` | 10 | Dispatcher auf Rez plus Corporate-Retreat-Cleanup |
| `decline_rez` | 7 | Run-Rez-/Movement-Dispatcher |
| `pump_breaker` | 89 | echte Payment-/Breaker-/Aardvark-/Debt-Mutation |
| `break_subroutine` | 86 | echte Payment-/Encounter-/Breaker-Mutation |
| `continue_run` | 5 | Dispatcher plus lokaler Fallback |
| Access-Cases | 10 | überwiegend Dispatcher auf AccessFlow |
| Special-Zone-Cases | 12 | lokale Zone-Mutatoren |
| `resolve_choice` | 7 | Dispatcher auf PendingChoiceResolutionHost |
| `trigger_ability` | 4 | Dispatcher auf TriggerAbility |

## F. Aktuelle `index.ts`-Bereichskarte

| Bereich | LOC/Größe | Hauptfunktion | Art | Zielmodul | Move-ready | Risiko | nächster möglicher Schnitt |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| Public API/Re-Exports | klein | kompatible Engine-API | public API | `game/` Fassade | ja, aber wertarm | niedrig | nicht separat |
| ApplyActionCoreHost | 5 | `performAction` injizieren | Host | `game/apply-action` | erledigt bis auf `performAction` | niedrig | erst nach Restkanten |
| LegalActionGenerationHost | 29 plus Subhosts | Action-Erzeugung dispatchen | Host | `game/legal-actions` | teilweise | mittel | Host-Factories ausdünnen |
| BuildEvent/PublicContext-Wiring | 9 plus `publicContextDeps` | Event-Payload-Kontext bauen | Host/read-only | `game/events`/`game/view` | teilweise | hoch wegen Payload | später |
| `performAction` | 384 | Execution-Dispatch + Restmutation | mutiert | `game/apply-action` oder `game/execution` | nein | mittel-hoch | erst Run/Breaker/Operation-Reste |
| `cardImplementationRuntimeDeps` | 661 / 68 Properties | Runtime Host | Host/mutiert | Fachfamilienadapter | nein als Ganzes | hoch | bester nächster Familienschnitt |
| Runner/Corp resolver maps | 439 + 193 | Event-/Operation-Resolver | mutiert | `game/corp`, `game/runner`, `game/card-implementation` | teilweise | mittel | später fachfamilienweise |
| Start-/End-turn helpers | mehrere 50-120 LOC | Turn-Hooks, Draw, Recurring, Proteus | mutiert | `game/turn` | teilweise | mittel | guter späterer Schnitt |
| Run/Breaker helpers | `startRun` 164, `continueRun` 123, Breaker helpers | Run/Encounter-Mutation | mutiert | `game/run` | nein | mittel-hoch | guter ARCH-75/76-Kandidat |
| Payment/Credit helpers | kleine Spend-/Hosted-/Recurring-Helfer | Credits mutieren | mutiert | `game/payment` | nicht isoliert | hoch | nur Restboundary |
| Zone/Card/Server mutators | `removeFromAllZones`, trash helpers, special zones | Zone-Mutation | mutiert | `game/zones` oder fachnah | nein | hoch | mit Familie bewegen |
| PendingChoice Host/Residuals | `pendingChoiceResolutionHost` 95 plus lokale Resolver | Choice-Dispatch | mutiert | `game/choices` | teilweise | hoch | nur residuale Familien |

## G. Lokale Helper, die `index.ts` noch binden

| Helper/Block | LOC | liest/mutiert | aktuelle Caller | Zielmodul | einzeln verschiebbar | Risiko |
| --- | ---: | --- | --- | --- | --- | --- |
| `cardImplementationRuntimeDeps` | 661 | liest/mutiert | AbilityEngine Runtime | Fachadapter nach Familie | nein als Ganzes | hoch |
| `RUNNER_EVENT_RESOLVERS` | 439 | mutiert | `playRunnerEvent` | `game/runner`/`game/card-implementation` | nur familienweise | mittel-hoch |
| `CORP_OPERATION_RESOLVERS` | 193 | mutiert | `resolveCorpOperation` | `game/corp` | nur familienweise | mittel-hoch |
| `startRun` | 164 | mutiert | `performAction`, RuntimeDeps | `game/run/start-run` | mit Run-Start-Familie | mittel-hoch |
| `continueRun` | 123 | mutiert | `performAction`, Run-Followups | `game/run` | mit Run-Movement | mittel |
| `applyCorpStartOfTurnEffects` | 120 | mutiert | `endTurn`/turn flow | `game/turn` | mit EndTurn | mittel |
| `applyRunnerStartOfTurnEffects` | 82 | mutiert | `endTurn`/turn flow | `game/turn` | mit EndTurn | mittel |
| `resolveV1911RunnerHiddenZoneAbility` | 102 | mutiert | RuntimeDeps/Runner events | `game/hidden-zone` | nicht ohne Choice-Gate | hoch |
| `pendingChoiceResolutionHost` | 95 | Host | `resolve_choice` | `game/choices` | ja, aber breite Hostwand | hoch |
| `moveToSpecialZone` | 69 | mutiert | Special-Zone actions | `game/hidden-zone`/`game/zones` | mit Special-Zone-Familie | mittel |
| `executeEffectCommands` | 68 | mutiert | Breaker/Runtime/Effects | `ability-engine`/`game/effects` | nein | hoch |
| `trashCorpInstalledCardToArchives` | 64 | mutiert | Runtime/Install/Rez/Access | Fachnah | nein | hoch |
| `shuffleGripTrashAndStackThenDrawForCardImplementation` | 64 | mutiert/RNG | RuntimeDeps | Hidden-Zone/Draw | nur mit Replay-Gate | hoch |
| `refreshRecurringCredits` | 57 | mutiert | Turn/Rez/Runtime | `game/turn`/`game/payment` | ja, aber quer | mittel |
| `removeFromAllZones` | 49 | mutiert | viele Mutatoren | `game/zones` | nein | hoch |
| `spendCredits` | 12 | mutiert | viele Kostenpfade | `game/payment` | nicht isoliert | hoch |
| `drawRunnerCards` | 20 | mutiert | Draw/Damage/Runtime | `game/turn` | später | mittel |
| `drawCorpCards` | 3 | mutiert | Draw/Runtime | `game/turn` | ja | niedrig |

## H. `performAction` readiness nach ARCH-74

`performAction` ist noch nicht move-ready.

Der Unterschied zu STATUS-3 ist aber wesentlich: Ein Move wäre nicht mehr ein 1.300-LOC-Monolithentransfer, sondern ein 384-LOC-Dispatcher-Move mit mehreren noch zu breiten Host-Kanten. Der harte Blocker ist nicht mehr die Größe allein, sondern die Hostwand, die für RunStart, Breaker/Encounter, Operation play, Special-Zones, PendingChoice und RuntimeDeps nötig wäre.

Noch echte Mutation in `performAction`:

- `play_operation`: Klick/Credits, Zone-Move in Archives, Operation-Effekt, Payload-Anreicherung.
- `advance_card`: Klick/Credits, Advancement-Counter, Roving-Submarine-Marker.
- `start_run`: Klick/Wilson/BONUS-Run, `startRun`, Run-Tax und Payload-Marker.
- `pump_breaker`: Run-Credits, Aardvark, Run-Remainder-Bonus, Future-Action-Debt, EffectCommands.
- `break_subroutine`: Run-Credits, Multi-break, Subroutine-Checks, Aardvark/Blink, Stealth-loss, usage markers.
- Special-Zone-Cases: `move_to_set_aside`, `move_to_removed_from_game`, `return_from_set_aside`, `change_card_control`.

Nur noch Dispatcher oder fast Dispatcher:

- `gain_credit`, `trigger_ability`, `install_card`, `score_agenda`, `jack_out`, `continue_run`, Access-Cases, `resolve_choice`, `activated_card_ability`, `rez_ice` mit kleinem Cleanup.

Ein jetziger Move bräuchte grob diese Host-Gruppen: `state`, `actions`, `turn`, `run`, `access`, `install`, `rez`, `operation`, `breaker`, `payment`, `zones`, `choices`, `cardImplementation`, `callbacks`, `constants`. Das wäre zwar unterhalb der früheren 25+-Property-Wand möglich, aber noch kein sauberer Dispatcher-Move.

Akzeptabel wird ein `performAction`-Move erst, wenn:

- `performAction` unter ca. 250 LOC liegt oder praktisch nur noch `handleX(...)` aufruft.
- `startRun`/`continueRun` und Breaker-/Encounter-Execution nicht mehr lokal sind.
- `play_operation` und Special-Zone-Mutatoren nicht direkt im Switch mutieren.
- `pendingChoiceResolutionHost` und `cardImplementationRuntimeDeps` nicht als breite Hostwand mitwandern.

## I. RuntimeDeps-Light-Audit

`cardImplementationRuntimeDeps` umfasst 661 LOC und 68 Top-Level-Properties. Es ist der wichtigste verbleibende Strukturknoten in `index.ts`.

Gruppierung der Properties:

| Gruppe | Beispiele | Bewertung |
| --- | --- | --- |
| cards/definitions | `definitionFor`, `mustInstance`, `cardCounter`, `runnerInstalledCardIds`, `rezzedCorpRootCardIds` | teilweise einfache Query-Kanten |
| action/legal action | `createAction`, `appendResolvedEffectsToPayload`, `spendClick` | zentral, nicht isoliert bewegen |
| credits/payment | `spendCredits`, `startPayRezCostToTrashRezzedIceChoice`, `returnSourceToGripIfPaid`, `startCorpDiscardHqWithRetainPayment` | hochsensibel |
| damage | über EffectAdapters plus Damage-Followups | durch Damage-Core vorbereitet |
| trace | `startTrace` | delegiert auf `traceOrchestrationHost`, aber noch index-adaptiert |
| run | `startRun`, run history queries | `startRun` ist breiter lokaler Mutator |
| access/expose | `exposeInstalledCorpCard*`, `exposeOutermostIceEachDataFort` | teils move-ready, aber Hidden-Info-sensibel |
| install/rez | `startRunnerProgramInstallActionBundle`, Rez/Trash-ICE-Choices | nicht ohne Payment/Choice-Gate |
| hidden-zone | Search-/Look-/Trash-/Arrange-Choice-Starter | viele delegieren bereits in `game/hidden-zone` |
| counters | `addCounterToAllInstalledRunnerIcebreakers`, advancement choices | teils sicher, teils PendingChoice |
| lifecycle/zones | `shuffleSourceIntoCorpRd`, `trashCorpInstalledCardsInSourceServer`, `gainRunnerEventAgendaPoint` | mutierend, fachlich heterogen |
| random/replay | `corpRandomDiscardFromHq`, shuffle/draw | hohes RNG-/Replay-Risiko |
| limits | `abilityLimits` | fachlich AbilityEngine, nicht isoliert als Mini-Move |

Properties, die bereits im Kern auf Game-Module delegieren:

- `startTrace` -> `traceOrchestrationHost`
- Hidden-Zone-Search-/Look-/Install-Choice-Starter -> `game/hidden-zone/search-choice-activations`
- Hidden-Zone-Arrange-/NonSearch-Choice-Starter -> `game/hidden-zone/*`
- Expose-/Corp-Zone-Choice-Teile -> `game/hidden-zone`/Corp-Choice-Handler
- Damage/Draw/Credit/Trash-Primitive teilweise über `cardImplementationEffectAdapters`

Properties, die weiterhin lokale `index.ts`-Mutatoren brauchen:

- `startRun`, `spendCredits`, `startPrivateLook`
- `shuffleGripTrashAndStackThenDraw`
- `startPayRezCostToTrashRezzedIceChoice`, `startTrashUnrezzedIceChoice`, `startCorpChoiceRezOrTrashIceChoice`, `startDerezRezzedBlackIceChoice`
- `startRunnerProgramInstallActionBundle`
- `shuffleSourceIntoCorpRd`, `trashCorpInstalledCardsInSourceServer`, `corpRandomDiscardFromHq`
- `startDistributeAdvancementCounters`, `startMoveAdvancementCounters`
- `addCurrentEncounterAdditionalSubroutine`, `returnSourceToGripIfPaid`

RuntimeDeps-Family-Split-Kandidaten:

| Kandidat | erwarteter LOC-Hebel | Host-Breite | Risiko | Testbedarf | Empfehlung |
| --- | ---: | --- | --- | --- | --- |
| Hidden-Zone RuntimeDeps Family | 180-300 | mittel | mittel-hoch wegen PendingChoice | `game/hidden-zone`, `trigger`, `index.test.ts` | sofort, aber nur Search/Look/Expose-Adapter, keine Choice-Werte ändern |
| Trace RuntimeDeps Family | 40-80 | klein-mittel | mittel wegen Payload/Trace | `trace-orchestration`, `trace-flow`, `index.test.ts` | guter kleiner Kandidat nach Hidden-Zone |
| Damage RuntimeDeps Family | 60-140 | mittel | hoch wegen prevention/replacement | `damage-core`, prevention, replay | später |
| Install/Rez RuntimeDeps Family | 120-220 | mittel-hoch | hoch wegen Payment/Choice | install/rez/run-rez | später |
| Economy/Credit RuntimeDeps Family | 40-100 | klein-mittel | mittel | economy/payment | später |
| Run/Access RuntimeDeps Family | 150-260 | hoch | hoch wegen Run/Access/Hidden-Info | run/access/replay | später |
| Counter/Lifecycle RuntimeDeps Family | 80-180 | mittel | mittel-hoch | counter/choice/replay | später, nach Query-Adapter |

## J. PublicContext/EventBuilder-Wiring-Audit

`public-context.ts` bleibt ein read-only Monolith:

- 1.820 LOC Datei
- `publicContextForAction`: 1.760 LOC
- keine direkten `onr_v1_`-IDs
- viele `v19xx`-/`p3_`-/`hiddenZoneAction`-/`specialZoneReason`-/`randomPurpose`-Kompatibilitätsfelder

Wiring in `index.ts`:

- `publicContextDeps`: kleine Dependency-Gruppe für Definitionen, Serverlabels, Public Reveal und Run-Zugriff
- `buildEventHost`: 9 LOC, ruft `publicContextForAction` über `game/events/build-event`
- `game/events/build-event.ts`: EventBuilder ist bereits aus `index.ts` heraus

Ein reiner Host-Wiring-Schnitt wäre möglich, aber der LOC-Hebel in `index.ts` ist gering. Ein interner PublicContext-Familiensplit wäre fachlich sinnvoll, aber nicht der beste nächste Schritt: Er reduziert `index.ts` kaum und berührt PublicPayload/Web/Chronik/Replay-Verträge. Der Split sollte read-only bleiben und nur mit PublicPayload-/Hidden-Info-/Web-Regression erfolgen.

## K. Neue Monolith-Kandidaten in `game/`

| Datei | LOC | Kohäsion | Sofort splitten? | Risiko | Priorität |
| --- | ---: | --- | --- | --- | --- |
| `game/damage/damage-core.ts` | 2.276 | mittel | nein | hoch wegen Flatline/Replacement | mittel, wenn Index-Ziel pausiert |
| `game/access/access-effect-handlers.ts` | 1.485 | mittel | nein | hoch wegen Hidden-Info/Access | später |
| `game/turn/runner-main-actions.ts` | 1.095 | mittel | nein | LegalAction order/actionId | später |
| `game/view/card-view.ts` | 985 | mittel | nein | PlayerView/PublicView | später |
| `game/run/successful-run-interventions.ts` | 982 | hoch | nein | Run/Access-Followups | später |
| `game/hidden-zone/search-choice-handlers.ts` | 961 | hoch | nein | PendingChoice | später |
| `game/run/run-end-cleanup.ts` | 932 | mittel | nein | RunEnd/Damage/Trace-Followups | später |
| `game/hidden-zone/nonsearch-choice-handlers.ts` | 927 | mittel | nein | Hidden-Zone/PendingChoice | später |
| `game/run/encounter-resolution.ts` | 915 | hoch | nein | Encounter semantics | später |
| `game/hidden-zone/arrange-choice-handlers.ts` | 902 | hoch | nein | Hidden-Zone/PendingChoice | später |
| `game/trace/trace-orchestration.ts` | 829 | hoch | nein | Trace/PendingChoice | später |
| `game/economy/credit-economy-execution.ts` | 805 | mittel | nein | Economy/Legacy payload | später |
| `game/install/install-card.ts` | 639 | hoch | nein | Install/zone identity | später |
| `game/abilities/runner-special-trigger-execution.ts` | 560 | mittel | nein | Hidden-Zone/SpecialZone | niedrig |
| `public-context.ts` | 1.820 | niedrig-mittel | nein | PublicPayload/Web | später |
| `ability-engine/card-implementation-runtime.ts` | 2.215 | mittel | nein | Runtime semantics | später |

Diese Dateien sind echte Monolith-Kandidaten, aber sie sind nicht der beste ARCH-75-Hebel, solange `index.ts` noch RuntimeDeps und lokale Host-Factories hält.

## L. Produktive Importgrenzen

Produktive `game/* -> index` Imports: 0.

Die 48 gefundenen Testimports aus `game/*.test.ts` nach `index.ts` sind Cross-Flow-Regressionsimporte. Sie sind bewusst und schützen ApplyAction, LegalActions, PlayerView, Replay und Hidden-Info-Verträge. Sie sollten nicht zusammen mit Produktions-Refactoring bewegt werden.

## M. Direkte `onr_v1_`-Reste

| Bereich | Treffer | Unique | Bewertung |
| --- | ---: | ---: | --- |
| `index.ts` | 0 | 0 | Zielzustand hält |
| `public-context.ts` | 0 | 0 | Zielzustand hält |
| `game/` produktiv | 32 | 24 | bewusst in View-/Corp-Fachmodulen |
| `game/` Tests | 158 | 59 | erwartbar |
| `ability-engine/` produktiv | 0 | 0 | Zielzustand hält |
| `ability-engine/` Tests | 42 | 41 | Testdaten |
| `mechanics/` produktiv | 98 | 96 | Mechanik-/Compatibility-Kataloge |
| `compatibility/` produktiv | 42 | 42 | stabile Runtime-/Replay-Konstanten |

Die produktiven `game/`-Reste liegen vor allem in `game/view/card-view.ts`, `game/corp/scored-agenda-abilities.ts` und `game/corp/trace-damage-abilities.ts`. Das ist keine Regression für `index.ts`, aber später ein eigener View-/Corp-Ability-Katalogschnitt.

## N. Top-Kandidaten für ARCH-75

| Kandidat | Zielmodule | `index.ts`-Reduktion | Host-/RuntimeDeps-Reduktion | Risiko | Empfehlung |
| --- | --- | ---: | ---: | --- | --- |
| `ENGINE-ARCH-75-cardimplementation-runtime-deps-family-boundary` | `game/card-implementation/runtime-deps-hidden-zone.ts` oder `game/hidden-zone/card-implementation-runtime-adapter.ts` | 150-300 | hoch | mittel-hoch wegen PendingChoice | sofort, begrenzt auf Hidden-Zone/Search/Expose-Adapter |
| `ENGINE-ARCH-75-perform-action-dispatcher-move` | `game/apply-action/perform-action.ts` | 300-380 Brutto, wenig Netto | gering | mittel-hoch wegen Hostwand | später |
| `ENGINE-ARCH-75-end-turn-flow-boundary` | `game/turn/end-turn-flow.ts` | 180-280 | mittel | mittel | guter späterer Code-Schnitt |
| `ENGINE-ARCH-75-draw-execution-boundary` | `game/turn/draw-execution.ts` | 80-160 | klein | mittel wegen draw replacements | später |
| `ENGINE-ARCH-75-payment-execution-rest-boundary` | `game/payment/payment-execution.ts` | 80-180 | mittel | hoch | später, keine neue Payment-Engine |
| `ENGINE-ARCH-75-public-context-host-boundary` | `game/events/public-context-host.ts` | 20-60 | gering | niedrig-mittel | nicht priorisieren |
| `ENGINE-ARCH-75-public-context-family-split` | `game/view/public-context/*` | 0-30 in `index.ts` | keine | hoch | später |
| `ENGINE-ARCH-75-damage-core-internal-split` | `game/damage/prevention-resolution.ts`, `replacement-resolution.ts`, `flatline.ts` | 0 | keine | mittel-hoch | später, wenn Index-Ziel pausiert |
| `ENGINE-ARCH-75-trace-orchestration-internal-split` | `game/trace/base-link-orchestration.ts`, `trace-result-orchestration.ts` | 0 | keine | mittel | später |
| `ENGINE-ARCH-75-trigger-remaining-audit` | `game/abilities/*` | gering | gering | niedrig-mittel | nicht als nächstes |
| `ENGINE-ARCH-75-run-breaker-execution-boundary` | `game/run/breaker-execution.ts` | 170-260 | mittel | mittel-hoch | gute Alternative, aber nach RuntimeDeps-Audit weniger struktureller Hebel |

## O. Empfohlener nächster ARCH-Code-Schnitt

Empfohlen wird:

`ENGINE-ARCH-75-cardimplementation-runtime-deps-family-boundary`

Scope:

- kein RuntimeDeps-Big-Bang
- eine begrenzte Family, bevorzugt Hidden-Zone/Search/Expose RuntimeDeps-Adapter
- Properties aus `cardImplementationRuntimeDeps`, die bereits an `game/hidden-zone/*` delegieren, in ein fachliches Adaptermodul ziehen
- `index.ts` behält nur schmale Factory-/Host-Kanten
- PendingChoice source/kind/id, `hiddenZoneAction`, `specialZoneReason`, RNG-Purpose und PublicPayload-Felder unverändert lassen

Begründung:

- `performAction` ist klein genug; weitere blinde Branch-Schnitte liefern weniger Strukturgewinn.
- `cardImplementationRuntimeDeps` ist mit 661 LOC und 68 Properties der größte echte Restknoten.
- Viele Hidden-Zone-RuntimeDeps sind bereits Adapter auf bestehende `game/hidden-zone`-Module. Das reduziert Risiko gegenüber Run/Access/Payment.
- Ein Family-Schnitt kann RuntimeDeps messbar verkleinern, ohne AbilityEngine oder Payment neu zu bauen.
- Er bereitet später einen echten `performAction`-Move besser vor als ein weiterer kleiner Trigger-Delegate-Schnitt.

## P. Alternativen und warum sie schlechter sind

| Alternative | Warum schlechter als nächstes |
| --- | --- |
| kompletter `performAction`-Move | noch Hostwand-Move; `startRun`, Breaker, Operation, Special-Zone und RuntimeDeps bleiben zu breit |
| PublicContext-Split | fachlich wichtig, aber reduziert `index.ts` kaum und berührt Web/PublicPayload-Vertrag |
| Damage-Core intern splitten | wichtig, aber entlastet `index.ts` nicht |
| Trace-Orchestration intern splitten | ähnlich: modulinterne Qualität, kein aktueller Restknoten-Hebel |
| EndTurn/Draw | sinnvoll, aber RuntimeDeps bleibt größter Hostknoten |
| Payment-Restboundary | zu querschnittlich, Quote/Spend/Revalidation dürfen nicht driften |
| weiterer Trigger-Restschnitt | ARCH-74 zeigte, dass dort nur noch kleine sichere Delegates liegen |

## Q. Was ausdrücklich nicht als nächstes machen

- Kein kompletter `performAction`-Move.
- Kein RuntimeDeps-Big-Bang.
- Keine CardImplementationRuntime-Neuarchitektur.
- Keine Payment-Engine-Migration.
- Kein PublicPayload-/Replay-/StateHash-/PendingChoice-/ActionID-/Markerwert-Move.
- Kein PublicContext-Feldsplit.
- Keine Hidden-Zone-Choice-Neumodellierung als Nebenprodukt.
- Keine internen Splits großer `game/`-Module, solange der nächste `index.ts`-Restknoten klarer ist.

## R. Teststrategie für den nächsten Schnitt

Für einen Hidden-Zone RuntimeDeps-Family-Schnitt:

- neue modulnahe Tests für den RuntimeDeps-Adapter
- bestehende `game/hidden-zone`-Suite vollständig laufen lassen
- `game/abilities/trigger-ability-execution.test.ts` und `runner-special-trigger-execution.test.ts`
- `game/economy/credit-economy-execution.test.ts`, falls Economy-Callbacks betroffen sind
- `game/apply-action.test.ts`, `game/events/build-event.test.ts`, `game/replay.test.ts`
- `game/view/hidden-info.test.ts` und `game/view/choice-view.test.ts`
- `src/index.test.ts` als Cross-Flow-Schutz
- Web/Server-Typechecks, wenn PublicPayload-Felder auch nur indirekt berührt werden

## S. Risiken

| Risiko | Bewertung | Gegenmaßnahme |
| --- | --- | --- |
| RuntimeDeps-Family-Schnitt wird doch ein Big-Bang | hoch | genau eine Property-Familie, keine globalen Typumbenennungen |
| PendingChoice source/kind/id driftet | hoch | Markerwerte pinnen, Hidden-Zone-Tests laufen lassen |
| Hidden-Info-Leak in Search/Expose | hoch | PlayerView/hidden-info Tests und keine neuen PublicPayload-Felder |
| `performAction`-Move zu früh | mittel-hoch | erst Run/Breaker/Operation/SpecialZone-Reste reduzieren |
| PublicContext bleibt Monolith | mittel | akzeptieren, später read-only splitten |
| neue `game/`-Monolithen wachsen | mittel | keine weiteren Sammelmodule ohne klare Familie |
| RuntimeDeps-Adapter dupliziert Hidden-Zone-Logik | mittel | nur bestehende Module delegieren, nicht neu implementieren |

## T. Akzeptanzkriterien für späteren `performAction`-Move

Ein späterer Move ist akzeptabel, wenn:

- `performAction` unter ca. 250 LOC liegt oder klar überwiegend Dispatcher ist.
- `start_run`, `pump_breaker`, `break_subroutine`, `play_operation`, Special-Zone-Cases und `advance_card` fachlich ausgelagert oder extrem schmal sind.
- keine lokale Install/Rez/Trace/Damage/Economy/Trigger-Core-Logik mehr nötig ist.
- `cardImplementationRuntimeDeps` nicht als 661-LOC-Hostwand mitwandern muss.
- der neue Host keine 25+ flachen Properties bekommt.
- `applyAction`, `src/index.test.ts`, Replay/StateHash und modulnahe Tests grün bleiben.

## U. Akzeptanzkriterien für späteren RuntimeDeps-Family-Move

Ein RuntimeDeps-Family-Move ist akzeptabel, wenn:

- genau eine fachliche Familie bewegt wird.
- RuntimeDeps-Property-Namen und CardImplementation-Aufrufer stabil bleiben oder nur über kompatible Adapter geändert werden.
- keine neue Payment-, Trace-, Damage-, Access-, Run- oder Hidden-Zone-Engine entsteht.
- PendingChoice-/PublicPayload-/RNG-/Replay-Markerwerte unverändert bleiben.
- das Zielmodul nicht aus `index.ts` importiert.
- modulnahe Tests plus `src/index.test.ts` grün sind.

## V. Akzeptanzkriterien für späteren PublicContext-Split

Ein PublicContext-Split ist akzeptabel, wenn:

- er read-only bleibt.
- Feldnamen, Redaction, PublicPayload-Shape und `toPublicEvent`-Output unverändert bleiben.
- keine Web-/Chronik-/ActionBoard-Migration im selben Commit nötig ist.
- Familien wie Run, Access, Trace, Damage, Payment und Hidden-Zone nur Kontext-Builder sind.
- `game/view/hidden-info.test.ts`, PublicEvent-/PlayerView-Tests, Replay-Tests und relevante Web-Tests grün sind.

## Kurzfazit

ARCH-64 bis ARCH-74 haben `index.ts` strukturell halbiert und `performAction` von einem großen Mutationsmonolithen zu einem kleinen, aber noch nicht move-ready Dispatcher mit Restmutation gemacht. Der nächste entscheidende Hebel ist jetzt nicht ein weiterer mechanischer `performAction`-Schnitt, sondern die Entflechtung der breiten Hostfläche.

Der beste nächste Code-Schnitt ist ein begrenzter `cardImplementationRuntimeDeps`-Family-Schnitt, bevorzugt für Hidden-Zone/Search/Expose-Adapter. Ein kompletter `performAction`-Move bleibt zu früh; ein RuntimeDeps-Big-Bang ist ebenfalls falsch.
