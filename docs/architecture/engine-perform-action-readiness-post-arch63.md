# ENGINE-STATUS-3: PerformAction-Readiness nach ARCH-63

Stand: 2026-05-25
Auftrag: `ENGINE-STATUS-3-post-arch63-perform-action-readiness-audit`
Branch: `codex/card-implementation-next-task`

## A. Ausgangspunkt/Branch/Commits

Der Audit wurde im aktuellen NETGRID-Worktree auf `codex/card-implementation-next-task` durchgeführt. Der Worktree war zu Beginn sauber.

Geprüfte Commit-Voraussetzungen:

| Commit | Befund |
| --- | --- |
| `e525b3806f76fd09010e6434a1e98b8560736dad refactor(engine): move event host out of apply action host` | vorhanden, ARCH-63 |
| `b4b7a7718cfb7411a2f33922235602350f772f88 refactor(engine): extract apply action support boundaries` | vorhanden, ARCH-62 |
| `4b13287b61bd74b2fe07bf9fec93f2790eee0660 refactor(engine): extract apply action core boundary` | vorhanden, ARCH-61 |

## B. Methodik und gelesene Quellen

Gelesen wurden die Wiki-Pflichtquellen, `agents/architecture-review-agent.md`, die angeforderten Architekturquellen und die aktuellen ApplyAction-/Event-/LegalAction-/View-/Replay-/Choice-Module. Die Codeanalyse erfolgte per LOC-Messung, Funktionsgrößenmessung, `performAction`-Case-Zerlegung, Importsuche und gezielter Call-Suche.

Gelesene Pflichtquellen:

- `docs/architecture/engine-apply-action-boundary-analysis.md`
- `docs/architecture/ability-engine/ability-engine-restructuring-status-current.md`
- `docs/architecture/ability-engine/ability-engine-restructuring-status-post-arch52.md`
- `docs/architecture/ability-engine/pending-choice-replay-marker-stability-p3-71.md`

Gelesene/analysierte Codebereiche:

- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/engine/src/game/apply-action.ts`
- `packages/engine/src/game/apply-game-action.ts`
- `packages/engine/src/game/events/build-event.ts`
- `packages/engine/src/game/legal-actions.ts`
- `packages/engine/src/game/player-view.ts`
- `packages/engine/src/game/replay.ts`
- `packages/engine/src/game/validation.ts`
- `packages/engine/src/game/hash.ts`
- `packages/engine/src/game/win-conditions.ts`
- `packages/engine/src/game/apply-action-state.ts`
- `packages/engine/src/game/choices/choice-validation.ts`
- `packages/engine/src/game/choices/pending-choice-resolution.ts`
- `packages/engine/src/game/turn/`, `run/`, `access/`, `corp/`, `hidden-zone/`, `trace/`, `damage/`, `payment/`, `card-implementation/`
- `packages/engine/src/ability-engine/`
- `packages/engine/src/card-implementations/`
- `packages/engine/src/compatibility/`
- `packages/engine/src/public-context.ts`

## C. Kernmesswerte

| Artefakt | LOC aktuell | Befund |
| --- | ---: | --- |
| `packages/engine/src/index.ts` | 20.161 | weiterhin Host für `performAction`, RuntimeDeps und lokale Core-Mutatoren |
| `packages/engine/src/index.test.ts` | 48.819 | historischer Cross-Flow-Schutzwall |
| `performAction` in `index.ts` | 1.328 | dominierender Restknoten |
| `cardImplementationRuntimeDeps` in `index.ts` | 661 | weiterhin breite Runtime-Host-Kante |
| `installCard` in `index.ts` | 389 | großer lokaler Install-Mutator |
| `rezCard` in `index.ts` | 138 | lokaler Rez-/Lifecycle-Mutator |
| `startRun` in `index.ts` | 164 | lokaler Run-Start-Mutator |
| `drawRunnerCards` in `index.ts` | 20 | klein, aber von vielen Familien genutzt |
| `drawCorpCards` in `index.ts` | 3 | klein |
| `doDamage` in `index.ts` | 8 | Wrapper, hängt an Damage-Core |
| `spendCredits` in `index.ts` | 12 | klein, aber zentrale Payment-Mutation |
| `trashRunnerInstalledCardToHeap` in `index.ts` | 51 | lokaler Zone-/Trash-Mutator |
| `trashCorpInstalledCardToArchives` in `index.ts` | 64 | lokaler Zone-/Trash-Mutator |
| `finishRun` in `index.ts` | 7 | kleiner Run-End-Wrapper, breit genutzt |
| `resolveTraceCorpBid` in `index.ts` | 87 | Trace-Choice-Mutation |
| `resolveTraceRunnerBid` in `index.ts` | 69 | Trace-Choice-Mutation |
| `completeTraceAfterPostBidLink` in `index.ts` | 15 | Trace-Folgeabschluss |
| `buildEventHost`-Wiring in `index.ts` | 9 | seit ARCH-63 nur EventBuilder-Konfiguration |
| `ApplyActionCoreHost` in `index.ts` | 5 | nur noch `actions.performAction` |
| `game/apply-action.ts` | 145 | echter ApplyAction-Core mit 1 Host-Gruppe |
| `game/events/build-event.ts` | 397 | EventBuilder mit eigenem Host |
| `public-context.ts` | 1.804 | großer read-only PublicPayload-Knoten |
| produktive `game/* -> index` Imports | 0 | Zielzustand seit ARCH-59 bis ARCH-63 hält |

Top 30 verbleibende Funktionen/Objekte in `index.ts`:

| Rang | Funktion/Objekt | LOC | Zeilen |
| ---: | --- | ---: | --- |
| 1 | `performAction` | 1.328 | 4381-5708 |
| 2 | `installCard` | 389 | 6452-6840 |
| 3 | `resolveEventModificationChoice` | 272 | 11209-11480 |
| 4 | `startRun` | 164 | 7004-7167 |
| 5 | `collectRuntimeDamagePreventionCandidates` | 144 | 10522-10665 |
| 6 | `rezCard` | 138 | 7441-7578 |
| 7 | `specialZoneHarnessActions` | 137 | 3777-3913 |
| 8 | `continueRun` | 123 | 7677-7799 |
| 9 | `applyCorpStartOfTurnEffects` | 120 | 9418-9537 |
| 10 | `scoredAgendaFlowHost` | 116 | 14083-14198 |
| 11 | `runnerMainActionGenerationHost` | 113 | 2939-3051 |
| 12 | `accessEffectHandlerHost` | 105 | 15061-15165 |
| 13 | `resolveCorpUtilityOperation` | 103 | 19594-19696 |
| 14 | `corpMainActionGenerationHost` | 102 | 2623-2724 |
| 15 | `resolveV1911RunnerHiddenZoneAbility` | 102 | 17070-17171 |
| 16 | `collectReplacementCandidates` | 100 | 10981-11080 |
| 17 | `resolvePileDriverBreakSubroutinesAction` | 100 | 4030-4129 |
| 18 | `advancementDistributionOptions` | 97 | 12990-13086 |
| 19 | `variableIceStateForRezAction` | 96 | 7580-7675 |
| 20 | `runEndCleanupHost` | 95 | 14800-14894 |
| 21 | `pendingChoiceResolutionHost` | 94 | 15191-15284 |
| 22 | `resolveDiscardChoice` | 89 | 15343-15431 |
| 23 | `resolveRunnerProgramTrashBeforeInstallChoice` | 88 | 6363-6450 |
| 24 | `resolveIncubatorTransformChoice` | 88 | 16384-16471 |
| 25 | `eventModificationChoice` | 88 | 11120-11207 |
| 26 | `resolveTraceCorpBid` | 87 | 17793-17879 |
| 27 | `runAccessTransitionHost` | 86 | 14974-15059 |
| 28 | `applyQuestForCattekinStartOfTurn` | 82 | 9746-9827 |
| 29 | `resolveReplacementChoice` | 82 | 11482-11563 |
| 30 | `applyRunnerStartOfTurnEffects` | 79 | 9666-9744 |

Größte produktive Dateien unter `game/`:

| Datei | LOC | Bewertung |
| --- | ---: | --- |
| `game/access/access-effect-handlers.ts` | 1.482 | >1000, Access-Effect-Monolith-Kandidat |
| `game/turn/runner-main-actions.ts` | 1.094 | >1000, LegalAction-Builder-Monolith-Kandidat |
| `game/run/successful-run-interventions.ts` | 981 | >750, kohärent aber groß |
| `game/view/card-view.ts` | 967 | >750, View-Vertragsknoten |
| `game/hidden-zone/search-choice-handlers.ts` | 960 | >750, PendingChoice-reich |
| `game/hidden-zone/nonsearch-choice-handlers.ts` | 926 | >750, heterogen |
| `game/run/encounter-resolution.ts` | 914 | >750, Run-/Encounter-Kern |
| `game/hidden-zone/arrange-choice-handlers.ts` | 901 | >750, kohärent |
| `game/turn/corp-main-actions.ts` | 861 | >750, LegalAction-Builder-Monolith-Kandidat |
| `game/run/run-end-cleanup.ts` | 851 | >750, Cleanup-/Aftermath-Knoten |
| `game/run/encounter-special-windows.ts` | 816 | >750, Spezialfenster-Knoten |
| `game/access/access-flow.ts` | 785 | >750, Access-Flow-Kern |
| `game/run/run-rez-window.ts` | 761 | >750, Run-Rez-Knoten |
| `game/hidden-zone/search-choice-activations.ts` | 759 | >750, Hidden-Zone-Aktivierungen |
| `game/corp/scored-agenda-flow.ts` | 752 | >750, Scored-Agenda-Knoten |
| `game/run/fort-run-side-families.ts` | 747 | >500, heterogene Run-Side-Familien |
| `game/run/encounter-actions.ts` | 716 | >500, LegalAction-Builder |
| `game/payment/trace-payment.ts` | 697 | >500, Payment-/Trace-Knoten |
| `game/run/fort-pass-window.ts` | 681 | >500, Fort-Pass-Knoten |
| `game/run/run-duration-payment.ts` | 663 | >500, Run-Payment-Knoten |
| `game/run/run-access-transition.ts` | 630 | >500, Run/Access-Übergang |
| `game/corp/install-rez-sequence-handlers.ts` | 585 | >500, Corp-Install-/Rez-Sequenz |
| `game/hidden-zone/corp-zone-choice-handlers.ts` | 545 | >500, Corp-Zone-Choices |
| `game/run/encounter-printed-effects.ts` | 536 | >500, Printed-Effect-Knoten |
| `game/validation.ts` | 535 | >500, Validation-Knoten |
| `game/choices/pending-choice-resolution.ts` | 533 | >500, Choice-Resolution-Fassade |
| `game/run/run-movement.ts` | 505 | >500, Run-Movement |
| `game/run/encounter-printed-nontrace-effects.ts` | 502 | >500, Printed-Nontrace-Knoten |
| `game/access/access-actions.ts` | 501 | >500, Access-LegalAction-Builder |

## D. Fortschritt seit STATUS-1 und STATUS-2

| Messwert | STATUS-1 | STATUS-2 | STATUS-3 | Veränderung seit STATUS-1 |
| --- | ---: | ---: | ---: | ---: |
| `index.ts` | 32.111 | 22.191 | 20.161 | -11.950 LOC, -37,2 % |
| `performAction` | 1.401 | 1.324 | 1.328 | -73 LOC, aber weiter zentral |
| `corpMainActions` in `index.ts` | 851 | 642 | 0 | vollständig verlagert |
| `runnerMainActions` in `index.ts` | 1.041 | 840 | 0 | vollständig verlagert |
| `resolvePendingChoice` in `index.ts` | 436 | 319 | 0 | vollständig verlagert |
| `getLegalActions` in `index.ts` | 92 | 92 | Re-export/Delegation | fachlich in `game/legal-actions.ts` |
| `applyAction` in `index.ts` | ca. 78-90 | ca. 78-90 | 0 | fachlich in `game/apply-action.ts` |
| `buildEvent` in `index.ts` | 60 | 60 | 0 | fachlich in `game/events/build-event.ts` |
| produktive `game/* -> index` Imports | 4 | 4 | 0 | vollständig entfernt |

Seit STATUS-2 sind nicht nur LOC verschwunden, sondern historische Wrapper-Kanten wurden zu echten Game-Fassaden: LegalActions, PlayerView, Replay, ApplyGameAction und ApplyAction sind index-frei. Das macht `performAction` sichtbarer: Es ist nicht mehr eine von vielen großen lokalen ApplyAction-Abhängigkeiten, sondern der verbleibende zentrale Mutationshost.

## E. Aktueller ApplyAction-Stand

`game/apply-action.ts` ist nach ARCH-63 ein echter Core:

- importiert `getLegalActions` aus `game/legal-actions`
- importiert `validateChoiceAction` aus `game/choices/choice-validation`
- importiert `cloneGameStateForAction` aus `game/apply-action-state`
- importiert `checkWinConditions` aus `game/win-conditions`
- importiert `validateGameState` aus `game/validation`
- importiert `hashState` aus `game/hash`
- importiert `buildEvent` aus `game/events/build-event`
- nutzt nur `actions.performAction` aus `ApplyActionCoreHost`

Damit ist der ApplyAction-Pfad fast vollständig in `game/`. Ein späterer `performAction`-Move würde aktuell aber weiterhin `performAction` selbst samt lokaler Helper- und RuntimeDeps-Wand verschieben.

## F. `performAction` Branch-Family Map

`performAction` umfasst 1.328 LOC. Die Case-Zerlegung zeigt zwei dominante Mischzweige:

| Action type / Case | LOC im Case | Einordnung |
| --- | ---: | --- |
| `gain_credit` | 602 | sehr großer Legacy-/Ability-/Economy-Mischzweig mit echter Mutation |
| `trigger_ability` | 251 | großer Legacy-/Ability-Mischzweig, teils delegiert, teils inline |
| `pump_breaker` | 89 | echte Run-/Payment-/Breaker-Mutation |
| `break_subroutine` | 86 | echte Encounter-/Payment-/Subroutine-Mutation |
| `start_run` | 51 | echte Run-Start-Mutation plus Run-Payment |
| `play_operation` | 38 | Operation-Ausführung, Zone-Move, Payment und Payload-Anreicherung |
| `purge_runner_virus_counters` | 25 | echte Action-Debt-/Purge-Mutation |
| `remove_tag` | 23 | echte Tag-/Payment-/Trash-Mutation |
| `forgo_action` | 17 | echte Action-Debt-Mutation |
| `draw_card` | 16 | echte Draw-Mutation, delegiert an Draw-Helfer |
| `advance_card` | 15 | echte Advance-Mutation |
| `activated_card_ability` | 13 | Dispatcher |
| `purge_virus_counters` | 11 | echte Purge-Mutation, kleines Fenster |
| `rez_ice` | 10 | Dispatcher auf `rezCard` plus Cleanup |
| `trash_resource` | 9 | lokaler Trash-Dispatcher |
| `resolve_choice` | 7 | Dispatcher auf `game/choices` |
| `mandatory_draw` | 7 | kleine Draw-Mutation |
| `decline_rez` | 7 | Run-Rez-/Movement-Dispatcher |
| `score_agenda` | 6 | Dispatcher auf `game/corp/scored-agenda-flow.ts` |
| `continue_run` | 5 | Dispatcher mit lokalem Fallback `continueRun` |
| `trash_accessed_card` / `decline_trash` / Access-Familie | 1-4 je Case | Dispatcher auf `game/access` |
| `install_card` | 3 | Dispatcher auf lokalen Mutator `installCard` |
| `play_event` | 3 | Dispatcher auf lokalen `playRunnerEvent` |
| `end_turn` | 3 | Dispatcher auf lokalen `endTurn` |
| Special-Zone/Control-Move | 3 je Case | Dispatcher auf lokale Special-Zone-Helfer |

Branch-Familien:

| Familie | Action types | Dispatcher oder Mutation? | Bereits genutzte Module | Lokale Helper/Kanten | Risiko | Nächster Schnitt |
| --- | --- | --- | --- | --- | --- | --- |
| Turn/basic execution | `mandatory_draw`, `draw_card`, `end_turn`, `remove_tag`, `purge_virus_counters`, `purge_runner_virus_counters`, `forgo_action`, einfacher `gain_credit`-Rest | überwiegend echte Mutation | `game/turn/*` für LegalActions; noch kaum Execution | `drawRunnerCards`, `drawCorpCards`, `endTurn`, `spendClick(s)`, `spendCredits`, ActionDebt, Tag-Mutation | mittel, solange `gain_credit`-Legacy ausgeschlossen wird | ja, eng schneiden |
| Install/rez/score/play execution | `install_card`, `rez_ice`, `score_agenda`, `play_event`, `play_operation`, `advance_card` | Score ist Dispatcher; Install/Rez lokale große Mutatoren; Operation/Advance inline | `game/corp/scored-agenda-flow`, `game/corp/install-rez-sequence-handlers`, `game/payment/*` | `installCard`, `rezCard`, `playRunnerEvent`, `resolveCorpOperation`, `spendCredits`, Zone-Moves | hoch | später, nicht erster Schnitt |
| Run execution | `start_run`, `jack_out`, `continue_run`, `decline_rez` | teils Dispatcher, teils lokale Mutation | `game/run/run-movement`, `run-rez-window`, `run-duration-payment`, `fort-run-side-families` | `startRun`, `continueRun`, `finishRun`, `payRunStartTaxCredits` | mittel-hoch | guter späterer Schnitt |
| Encounter/icebreaker execution | `pump_breaker`, `break_subroutine` | echte Mutation | `game/run`, `game/payment/run-duration-payment`, `fort-run-side-families` | `executeEffectCommands`, `spendRunnerRunCredits`, `finishRun`, Aardvark/PileDriver/Blink helpers | mittel | guter Kandidat nach Turn-basic |
| Access execution | `access_card`, `steal_agenda`, `trash_accessed_card`, `trash_resource`, `decline_trash` | fast nur Dispatcher | `game/access/access-flow`, `access-effect-handlers` | `trashResource` bleibt lokal | mittel, wegen Hidden-Info | nicht erster Schnitt; Access-Module sind schon groß |
| Trace execution | Trace-start via `gain_credit`/Operation, Trace choices außerhalb Case | echte Mutation und PendingChoice | `game/trace/*`, `game/payment/trace-payment` | `startTraceFromOperation`, `resolveTraceCorpBid`, `resolveTraceRunnerBid`, `completeTraceAfterPostBidLink`, `spendCredits` | hoch wegen Choice-/Payload-Marker | später, eigenes Gate |
| Damage execution | damage via card abilities/effect commands; prevention/replacement lokal | echte Mutation | `game/damage/prevention`, Corp damage modules | `doDamage`, `collectRuntimeDamagePreventionCandidates`, `collectReplacementCandidates`, `resolveEventModificationChoice` | hoch wegen Hidden-Info/Event/PendingChoice | später |
| CardImplementation execution | `activated_card_ability`, viele `gain_credit`/`trigger_ability` payload families | `activated_card_ability` Dispatcher; Legacy cases teils inline | `game/card-implementation`, `ability-engine` | `cardImplementationRuntimeDeps`, legacy helpers, RuntimeDeps mutators | hoch | nicht als Big-Bang |
| Hidden-zone/PendingChoice execution | `resolve_choice`, Special-Zone moves, v1911/v19xx residuals | Choice-Resolution Dispatcher; residual helpers lokal | `game/choices`, `game/hidden-zone` | `pendingChoiceResolutionHost`, `moveToSpecialZone`, hidden-zone legacy helpers | mittel-hoch | nur residuale Familien |
| Payment/revalidation | Zahlungen in vielen Cases | echte Mutation | `game/payment/*` für Quotes/Run/Trace | `spendCredits`, `spendRunnerRunCredits`, `spendRunnerTagRemovalCredits` | hoch, weil Querschnitt | nicht isoliert zuerst |
| Public/Event integration | keine Event-Endmontage mehr in `performAction` | ausgelagert | `game/events/build-event` | keine direkte performAction-Kante außer Payload-Mutation in Actions | niedrig | erledigt |

## G. Lokale Helper, die `performAction` noch binden

| Helper | LOC | liest/mutiert | Callers/Verwendung | Zielmodul | Einzeln verschieben? | Risiko |
| --- | ---: | --- | --- | --- | --- | --- |
| `installCard` | 389 | mutiert | `performAction`, install-/hidden-zone-nahe Choice- und RuntimeDeps-Pfade | `game/turn/install-card-execution.ts` oder `game/install` | nur mit Install-Familie | hoch |
| `rezCard` | 138 | mutiert | `performAction`, Rez-/ICE-/Root-Rez-Familien | `game/corp/rez-card-execution.ts` | mit Rez-Familie | hoch |
| `startRun` | 164 | mutiert | `performAction`, RuntimeDeps, Run-trigger-Familien | `game/run/start-run-execution.ts` | mit Run-Start-Familie | mittel-hoch |
| `continueRun` | 123 | mutiert | `performAction` Fallback | `game/run/run-continuation.ts` | ja, mit Run-Movement | mittel |
| `drawRunnerCards` | 20 | mutiert | `performAction`, RuntimeDeps, damage/hidden-zone/effect commands | `game/turn/draw-execution.ts` | ja, aber nur mit Draw-Familie sinnvoll | niedrig-mittel |
| `drawCorpCards` | 3 | mutiert | RuntimeDeps/effects | `game/turn/draw-execution.ts` | ja | niedrig |
| `doDamage` | 8 | mutiert | RuntimeDeps, Damage-/Access-/Effect-Pfade | `game/damage/damage-core.ts` | nein, nur als Damage-Familie | hoch |
| `spendCredits` | 12 | mutiert | fast alle Kostenfamilien | `game/payment/payment-execution.ts` | nicht isoliert | hoch |
| `spendRunnerTagRemovalCredits` | 44 | mutiert | `remove_tag` | `game/turn/tag-execution.ts` oder Payment | ja, mit RemoveTag | mittel |
| `trashRunnerInstalledCardToHeap` | 51 | mutiert | Install, Access, Ability, RuntimeDeps | `game/zones/trash-execution.ts` oder fachnah | nur mit Familie | hoch |
| `trashCorpInstalledCardToArchives` | 64 | mutiert | Rez/Install/Access/Ability/RuntimeDeps | `game/corp/trash-execution.ts` oder fachnah | nur mit Familie | hoch |
| `finishRun` | 7 | mutiert | Run, Breaker, Access, Damage | `game/run/run-end.ts` | ja, aber breit angebunden | mittel |
| `endTurn` | 46 | mutiert | `performAction` | `game/turn/end-turn-execution.ts` | ja | mittel |
| `resolveTraceCorpBid` | 87 | mutiert | PendingChoice/Trace | `game/trace/trace-choice-resolution.ts` | mit Trace-Familie | hoch |
| `resolveTraceRunnerBid` | 69 | mutiert | PendingChoice/Trace | `game/trace/trace-choice-resolution.ts` | mit Trace-Familie | hoch |
| `completeTraceAfterPostBidLink` | 15 | mutiert | Trace-Followup | `game/trace/trace-choice-resolution.ts` | mit Trace-Familie | hoch |
| `collectRuntimeDamagePreventionCandidates` | 144 | liest | Damage/Prevention | `game/damage/prevention` | mit Damage-Familie | mittel-hoch |
| `collectReplacementCandidates` | 100 | liest | Damage/Event replacement | `game/damage/replacement` | mit Damage-Familie | mittel-hoch |
| `resolveEventModificationChoice` | 272 | mutiert | PendingChoice/EventModification | `game/damage` oder `game/events` | nur mit eigenem Choice-Gate | hoch |

## H. RuntimeDeps-Light-Audit für performAction

`cardImplementationRuntimeDeps` bleibt 661 LOC und enthält weiter lokale Mutationskanten. Für `performAction` relevant sind besonders:

| RuntimeDeps-Familie | Lokale Index-Kanten | Blockiert performAction-Move? | Bewertung |
| --- | --- | --- | --- |
| Run/Trace starter | `startRun`, `startTraceFromOperation` | ja | würde beim Move sofort Host-Breite erzeugen |
| Hidden-Zone/Search Choices | `startSearch*`, `startLook*`, `startPrivateLook`, `moveTopTrashToGrip` | teilweise | Choice-Werte stabil, nicht nebenbei schneiden |
| Install bundle | `startRunnerProgramInstallActionBundle`, `installCard` | ja | koppelt RuntimeDeps an Install-Ausführung |
| Rez/Trash ICE Choices | `startPayRezCostToTrashRezzedIceChoice`, `startCorpChoiceRezOrTrashIceChoice`, `startDerezRezzedBlackIceChoice` | ja | Payment-/Rez-/Choice-Grenze |
| Zone movement/trash | `shuffleSourceIntoCorpRd`, `trashCorpInstalledCardsInSourceServer`, `corpRandomDiscardFromHq` | ja | Hidden-Info/RNG/Replay-Risiko |
| Counter/tag helpers | `addCounterToAllInstalledRunnerIcebreakers`, `removeRunnerTags`, `avoidNextTag` | teilweise | kleiner, aber fachlich Turn/Counter |
| Encounter mutation | `addCurrentEncounterAdditionalSubroutine` | teilweise | könnte mit Encounter-Familie schrumpfen |
| Ability limits | `abilityLimits` | ja | darf nicht als isolierte Mini-Migration verschoben werden |

Ein Branch-Familien-Schnitt kann RuntimeDeps punktuell verkleinern, aber ein RuntimeDeps-Big-Bang bleibt ungeeignet. Besonders Install/Run/Trace/Hidden-Zone-Callbacks würden bei einem vollständigen `performAction`-Move sonst als zweite Host-Wand wieder auftauchen.

## I. Branch-Familien, die nur noch Dispatcher sind

| Familie | Befund | Move-Readiness |
| --- | --- | --- |
| `activated_card_ability` | 13 LOC, ruft `handleActivatedCardImplementationAction` mit drei Handlern | gut, aber braucht RuntimeDeps weiter |
| `resolve_choice` | 7 LOC, ruft `resolvePendingChoice(pendingChoiceResolutionHost(...))` | technisch move-ready, aber Host ist 94 LOC in `index.ts` |
| Access-Ausführung | `access_card`, `steal_agenda`, `trash_accessed_card`, `decline_trash` delegieren an `handleAccessExecution` | gut, aber `trash_resource` bleibt lokal |
| `score_agenda` | 6 LOC, delegiert an `scoreAgenda(scoredAgendaFlowHost(...))` | gut, aber Host noch in `index.ts` |
| `jack_out` | 3 LOC, delegiert an Run-Movement | gut |
| Special-Zone-Move-Cases | `move_to_set_aside`, `move_to_removed_from_game`, `return_from_set_aside`, `change_card_control` | klein, aber lokale Mutatoren bleiben |
| `rez_ice` | Case ist kurz, aber `rezCard` ist lokal groß | nicht wirklich dispatcher-clean |
| `install_card` | Case ist kurz, aber `installCard` ist lokal groß | nicht dispatcher-clean |

Diese Dispatcher allein zu verschieben wäre ein Mikro-Schnitt. Sie werden wertvoll, wenn ihre Host-/Mutator-Familie mitzieht.

## J. Branch-Familien mit echter Mutation

| Familie | Mutation | Risiko |
| --- | --- | --- |
| `gain_credit` | Credits, Counter, Reveals, Hidden-Zone, Trace, random, draw-after, scored agenda ability dispatch, legacy payload enrichment | hoch |
| `trigger_ability` | Hidden-zone abilities, trash/move/control, run followups, special windows, Shell Traders, Wilson, ACME, expose decisions | hoch |
| `pump_breaker` / `break_subroutine` | Run credits, breaker strength, subroutine state, Aardvark choices, on-use run end | mittel-hoch |
| `start_run` | click spend, bonus-run flags, Wilson run spending cap, run start tax | mittel-hoch |
| `installCard` | install costs, zones, uniqueness, hosting, hidden runner resource, region/root effects | hoch |
| `rezCard` | rez costs, variable ICE, root/asset/ICE lifecycle, run windows | hoch |
| `play_operation` | credits, archives move, operation effect, hidden-zone payload markers | hoch |
| `advance_card` | credits/clicks, counters, Roving marker | mittel |
| `remove_tag` | credits, tags, resource trash, payload enrichment | mittel |
| Purge/action debt | virus counter purge, action debt, future debt window | mittel |
| Trace/Damage helpers | PendingChoice, prevention/replacement, event modification | hoch |

## K. Branch-Familien als neue ARCH-Kandidaten

| Kandidat | Zielmodule | Erwartete `index.ts`-Reduktion | Host-Breite | Risiko | Tests | Empfehlung |
| --- | --- | ---: | --- | --- | --- | --- |
| `ENGINE-ARCH-64-turn-basic-execution-boundary` | `game/turn/basic-execution.ts`, evtl. `game/turn/draw-execution.ts`, `game/turn/tag-execution.ts` | 120-260 LOC, mehr falls `endTurn`/ActionDebt mitzieht | klein bis mittel | mittel | `apply-action`, `turn`, `index.test.ts`-Regressionen, Tag/Purge/Draw/EndTurn | sofort, eng geschnitten |
| `ENGINE-ARCH-64-install-card-execution-boundary` | `game/turn/install-card-execution.ts` oder `game/install/install-card.ts` | 350-500 LOC | mittel bis groß | hoch | Install, hidden runner resource, hosting, uniqueness, replay | später |
| `ENGINE-ARCH-64-rez-card-execution-boundary` | `game/corp/rez-card-execution.ts` | 180-280 LOC | mittel | hoch | Rez, root/ICE/asset, run-rez-window, variable ICE | später |
| `ENGINE-ARCH-64-draw-card-execution-boundary` | `game/turn/draw-execution.ts` | 40-120 LOC | klein | niedrig-mittel | mandatory draw, runner draw, corp draw, City Surveillance/Crash Everett | als Teil von Turn-basic |
| `ENGINE-ARCH-64-trace-orchestration-boundary` | `game/trace/trace-choice-resolution.ts`, `game/trace/trace-execution.ts` | 160-260 LOC | mittel | hoch wegen PendingChoice/markers | Trace bid, base link, post-bid, replay marker | später |
| `ENGINE-ARCH-64-damage-core-boundary` | `game/damage/damage-core.ts`, `game/damage/replacement.ts` | 250-500 LOC | groß | hoch | damage/prevention/replacement/flatline/PublicEvent | später |
| `ENGINE-ARCH-64-payment-execution-boundary` | `game/payment/payment-execution.ts` | 80-180 LOC isoliert, mehr als Familienpaket | groß als Querschnitt | hoch | stale costs, hosted/restricted credits, run duration | nicht isoliert |
| `ENGINE-ARCH-64-runtime-deps-family-boundary` | RuntimeDeps query/adapter family | 80-250 LOC | mittel | mittel-hoch | Runtime/cardImplementation focused tests | später, nur kleine Familie |
| `ENGINE-ARCH-64-icebreaker-encounter-execution-boundary` | `game/run/icebreaker-execution.ts` oder `game/run/encounter-action-execution.ts` | 170-240 LOC | mittel | mittel-hoch | pump/break, run-duration payment, Aardvark, Blink, PileDriver, StateHash | gute Alternative nach Turn-basic |

## L. Ist `performAction` jetzt move-ready?

Nein.

Der Move ist technisch näher als in ARCH-1, aber architektonisch noch nicht sauber. `applyAction` ist move-ready und umgesetzt; `performAction` ist es noch nicht.

Fehlende Bedingungen:

1. `performAction` ist noch kein überwiegender Dispatcher. Die beiden größten Cases `gain_credit` und `trigger_ability` enthalten zusammen 853 LOC mit echter Mutation.
2. Lokale Core-Mutatoren wie `installCard`, `rezCard`, `startRun`, `continueRun`, Trace-Choice-Resolver, Damage-/Replacement-Helfer, Trash-/Zone-Mutatoren und Payment-Helfer leben weiter in `index.ts`.
3. `cardImplementationRuntimeDeps` bindet Runtime-Ausführung weiter an lokale Mutatoren und würde bei einem Move als breite Host-Wand mitwandern.
4. Payment/Revalidation ist als Execution-Pfad über Turn, Run, Trace, Install, Rez, Access und Ability-Nutzung verteilt.
5. Trace/Damage/PendingChoice/PublicPayload-Marker sind stabilisiert, aber noch nicht so geschnitten, dass ein großer Dispatcher-Move risikoarm wäre.

Ein späterer `performAction`-Move wäre akzeptabel, wenn:

- `performAction` deutlich unter ca. 500 LOC liegt und überwiegend `handleX(...)`-Module aufruft.
- Install/Rez/RunStart/Trace/Damage/Payment nicht mehr als lokale Index-Core-Helper benötigt werden.
- `cardImplementationRuntimeDeps` entweder kleiner ist oder seine mutierenden Familien fachlich verteilt sind.
- `ApplyActionCoreHost` nicht von einer neuen 25+-Property-Host-Wand ersetzt wird.
- `src/index.test.ts`, `src/game/apply-action.test.ts` und modulnahe Run/Access/Trace/Damage/Payment/Turn-Tests grün bleiben.

## M. Empfohlener nächster ARCH-Code-Schnitt

Empfohlen wird:

`ENGINE-ARCH-64-turn-basic-execution-boundary`

Scope:

- `mandatory_draw`
- `draw_card`
- normales `remove_tag`
- `purge_virus_counters`
- `purge_runner_virus_counters`
- `forgo_action`
- `end_turn`
- kleine Draw-/Tag-/ActionDebt-/Purge-Helper, soweit ohne Payment-Big-Bang möglich

Explizit nicht im ersten Turn-basic-Schnitt:

- der große `gain_credit`-Legacy-/Ability-Mischzweig
- `trigger_ability`
- Install/Rez/Run/Trace/Damage/Payment-Querschnitt
- RuntimeDeps-Gesamtmigration

Begründung:

- Der Schnitt schafft eine echte Execution-Boundary unter `game/turn`, nicht nur LegalAction-Erzeugung.
- Host-Breite bleibt kontrollierbar.
- Draw/Tag/Purge/ActionDebt/EndTurn haben klare modulnahe Testmöglichkeiten.
- Er berührt weniger PublicPayload-/PendingChoice-/Replay-Vertrag als Install, Trace, Damage oder Payment.
- Er bereitet spätere, größere Schnitte vor, ohne `performAction` als Ganzes zu bewegen.

Erwartete Netto-Reduktion: 120-260 LOC in `index.ts`, abhängig davon, ob `endTurn`, Draw-Helper und ActionDebt-Helfer vollständig mitziehen.

## N. Alternativen und warum sie schlechter sind

| Alternative | Warum nicht zuerst |
| --- | --- |
| kompletter `performAction`-Move | wäre Monolith-Transfer oder neue breite Host-Wand |
| Install-Execution | guter LOC-Hebel, aber hohes Payment-/Zone-/Hidden-Resource-/Uniqueness-Risiko |
| Rez-Execution | kleiner als Install, aber ICE/Root/Run-Rez/Lifecycle-riskant |
| Trace-Orchestration | bestehende `game/trace`-Module helfen, aber PendingChoice- und Markerwerte sind hochsensibel |
| Damage-Core | hoher Nutzen, aber Prevention/Replacement/EventModification/Hidden-Info-Risiko |
| Payment-Execution isoliert | Querschnitt; Quote und Spend dürfen nicht auseinanderdriften |
| RuntimeDeps-Familie | sinnvoll später, aber nicht als nächster Hauptschnitt, solange klare performAction-Branches einfacher sind |
| PublicContext/View | read-only, aber Web-/Chronik-/Payload-Vertrag; nicht vor Execution-Schnitten |
| neue Monolith-Kandidaten unter `game/` splitten | reduziert `index.ts` nicht und ist kein aktueller Restknoten-Hebel |

## O. Was ausdrücklich nicht als nächstes machen

- Kein kompletter `performAction`-Move.
- Kein `performAction`-Move mit breitem Host-Objekt.
- Kein RuntimeDeps-Big-Bang.
- Keine PublicPayload-, PublicEvent-, PlayerView-, Replay-, StateHash-, PendingChoice-, ActionID- oder Markerwert-Migration.
- Keine Payment-Engine-Neumodellierung neben Turn-basic.
- Kein `gain_credit`-/`trigger_ability`-Big-Bang als Legacy-Ability-Sammelmove.
- Kein PublicContext-Split.
- Keine Teststruktur-Moves gleichzeitig mit dem nächsten Produktionsschnitt.

## P. Teststrategie für den nächsten Schnitt

Für `ENGINE-ARCH-64-turn-basic-execution-boundary`:

- neue modulnahe Tests unter `packages/engine/src/game/turn/basic-execution.test.ts` oder spezifischer `turn-execution.test.ts`
- `mandatory_draw` und `draw_card`: gleiche Card-Moves, gleiche private/public Event-Projektion über `applyAction`
- `remove_tag`: normale Tag-Removal-Kosten und Danshi-Sonderpfad, falls im Scope
- Purge: normale Virus-Counter und Runner-Virus-Purge mit ActionDebt
- `forgo_action`: ActionDebt-Payload und Click-Kosten stabil
- `end_turn`: Turnwechsel, Start-of-turn-Hooks und stateVersion/EventLog via `applyAction`
- no mutation am Originalstate außerhalb `applyAction`-Clone-Pfad
- Regression: `src/game/apply-action.test.ts`, `src/game/turn`, `src/game/run`, `src/game/damage`, `src/game/trace`, `src/index.test.ts`

## Q. Risiken

| Risiko | Bewertung | Gegenmaßnahme |
| --- | --- | --- |
| `gain_credit` bleibt größter Mischzweig | hoch | bewusst separater Legacy-/Ability-Audit nach Turn-basic |
| ActionDebt/Purge berührt Future-Action-Marker | mittel | Markerwerte und Payloadfelder pinnen, bestehende Proteus-Tests laufen lassen |
| Draw wirkt auf Hidden-Info und random/damage Followups | mittel | Draw-Execution eng testen; PublicEvent bleibt über ApplyAction geprüft |
| Install/Rez bleiben große lokale Blocker | hoch | nach Turn-basic separat schneiden, nicht nebenbei |
| RuntimeDeps bleibt breit | hoch | später kleine RuntimeDeps-Familien, keine Gesamtmigration |
| `game/` hat neue Monolith-Kandidaten | mittel | nicht weiter aufblasen, neue Execution-Module fokussiert halten |
| PublicContext bleibt read-only Monolith | mittel | nicht in ARCH-64 anfassen |

## R. Akzeptanzkriterien für späteren performAction-Move

Ein späterer performAction-Move ist erst akzeptabel, wenn:

- `performAction` überwiegend Dispatcher ist.
- `gain_credit` und `trigger_ability` intern nach Fachfamilien getrennt sind oder deutlich kleiner wurden.
- Install/Rez/RunStart/Trace/Damage/Payment-Core-Helfer aus `index.ts` heraus oder hinter schmalen Fachmodulen liegen.
- `cardImplementationRuntimeDeps` nicht als 661-LOC-Hostwand mitwandern muss.
- produktive `game/* -> index` Imports weiter 0 bleiben.
- keine neue 25+-Property-Hostwand entsteht.
- PublicPayload, PlayerView, PublicEvent, Replay, StateHash, PendingChoice-Werte, ActionIDs und Markerwerte unverändert bleiben.
- `applyAction`-Core, EventBuilder und LegalAction-Fassade grün bleiben.
- `src/index.test.ts` und modulnahe Turn/Run/Access/Trace/Damage/Payment/Choice-Tests grün bleiben.

## Kurzfazit

ARCH-63 hat die ApplyAction-Hostfläche auf den Punkt gebracht: `game/apply-action.ts` braucht praktisch nur noch `performAction`. Genau dadurch ist sichtbar, dass `performAction` noch nicht move-ready ist. Es enthält weiter große echte Mutation, besonders in `gain_credit`, `trigger_ability`, Install/Rez, RunStart, Icebreaker/Encounter, Trace, Damage und Payment.

Der nächste Code-Schnitt sollte kein Big-Bang-Move sein. Der beste Nutzen/Risiko-Schnitt ist ein enger Turn-basic-Execution-Schnitt, der Draw, RemoveTag, Purge, ActionDebt und EndTurn fachlich nach `game/turn` bringt und `performAction` weiter in Richtung Dispatcher reduziert.
