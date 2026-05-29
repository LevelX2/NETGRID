# ENGINE-STATUS-5: Index-Host-Komposition nach performAction-Extraktion

## A. Ausgangspunkt und Commits

- Worktree: `C:\Projekte\NETGRID-ability-engine-refactor`
- Branch: `codex/card-implementation-next-task`
- HEAD beim Audit: `fdabcd6894ee09852dbaa3111a94423b9ecd1691` (`Merge branch 'main' into codex/card-implementation-next-task`)
- Worktree zu Beginn: sauber
- Bestätigte Anker:
  - ARCH-90: `ae0aee5c60390256b58c8a39e7166298694c8ad5`
  - ARCH-89: `f89cfed8dba1820df926462b65025c60fc0268fc`
  - ARCH-88: `22144e701668ffa7d551b3cae4eff01f3568369c`
  - ARCH-85: `ef78c3f4e11f59c04ae170256bb68d844e47c5d7`
  - STATUS-4: `145222c80171fb622e1755bbd8a94bee1bdf9c4c`

ARCH-90 hat `performAction` vollständig aus `packages/engine/src/index.ts` nach `packages/engine/src/game/apply/perform-action.ts` verlagert. Der ursprüngliche ApplyAction-Blocker aus STATUS-1/ARCH-1 ist damit erledigt: `index.ts` besitzt nicht mehr die zentrale Action-Mutationsfunktion, sondern vor allem Public-API-Exports, Host-Komposition, Event/PublicContext-Wiring und ältere Fachhelper.

Die aktuellen LOC-Werte wurden im gemergten Worktree mit `Measure-Object -Line` erhoben. Die direkt nach ARCH-90 gemeldeten Werte bleiben als historischer Punkt gültig; dieser Audit nutzt den aktuellen Branchzustand.

## B. Methodik und gelesene Quellen

Gelesene Architekturquellen:

- `docs/architecture/engine-perform-action-dispatcher-readiness-post-arch84.md`
- `docs/architecture/engine-index-runtime-readiness-post-arch74.md`
- `docs/architecture/engine-perform-action-readiness-post-arch63.md`
- `docs/architecture/engine-apply-action-boundary-analysis.md`
- `docs/architecture/ability-engine/ability-engine-restructuring-status-post-arch52.md`
- `docs/architecture/ability-engine/ability-engine-restructuring-status-current.md`
- `docs/architecture/ability-engine/pending-choice-replay-marker-stability-p3-71.md`

Gelesene Codebereiche:

- `packages/engine/src/index.ts`
- `packages/engine/src/game/apply/perform-action.ts`
- `packages/engine/src/game/apply-action.ts`
- `packages/engine/src/game/events/build-event.ts`
- `packages/engine/src/public-context.ts`
- zentrale Game-Boundaries aus Run, Access, Play, Board, Rez, Damage, Trace, Economy, Hidden-Zone, Choices, CardImplementation und View.

Suchläufe prüften Host-Factory-Namen, `performAction`-Kanten, `publicContextForAction`, `buildEvent`, `resolveCorpOperation`, direkte `onr_v1_`-Reste und produktive `game/* -> index`-Imports.

## C. Kernmesswerte

| Metrik | Aktueller Stand |
| --- | ---: |
| `packages/engine/src/index.ts` | 13.712 LOC |
| STATUS-1-Ausgangswert `index.ts` | 32.111 LOC |
| Reduktion seit STATUS-1 | ca. 18.399 LOC / ca. 57,3 % |
| `packages/engine/src/game/apply/perform-action.ts` | 342 LOC |
| `packages/engine/src/game/apply-action.ts` | 133 LOC |
| `packages/engine/src/game/events/build-event.ts` | 381 LOC |
| `packages/engine/src/public-context.ts` | 1.821 LOC |
| `publicContextForAction` | ca. 1.772 LOC |
| `packages/engine/src/index.test.ts` | 3.435 LOC |
| `packages/engine/src/game/apply/perform-action.test.ts` | 272 LOC |
| `performAction` in `index.ts` | 0 LOC |
| `performAction` Case-Labels im neuen Modul | 25 |
| Produktive `game/* -> index` Imports | 0 |
| Testimports `game/*.test.ts -> index` | 72 |

Direkte `onr_v1_`-Treffer:

| Bereich | Treffer |
| --- | ---: |
| `index.ts` | 0 |
| `public-context.ts` | 0 |
| `game/` | 32 |
| `ability-engine/` | 0 |
| `mechanics/` | 98 |
| `compatibility/` | 42 |

Die direkten Karten-ID-Reste liegen nicht mehr in `index.ts` oder `public-context.ts`, sondern vor allem in Mechanik-/Kompatibilitätsmodulen. Das ist strukturell deutlich sauberer als der STATUS-1-Zustand.

## D. Fortschritt seit STATUS-1, STATUS-4 und ARCH-90

STATUS-1 beschrieb `index.ts` als zentrale Host-/Engine-Fläche für ApplyAction, LegalActions, Turnflow, Runflow, Access, Payment, Damage, Trace, PendingChoices und CardImplementation-Host-Primitives. STATUS-4 hatte diese Fläche bereits stark reduziert, aber `performAction` und RuntimeDeps-/Host-Familien waren noch wesentliche Anker.

Seitdem wurden folgende Blocker herausgeschnitten:

- RuntimeDeps-Root und CardImplementation-Host-Familien.
- RunFlow- und AccessFlow-Host-Komposition.
- `startRun`, `continueRun`, Runner-Breaker-Actions, Play-Card-Execution, Board-State-Actions, StartRun-/Rez-Action-Wrappers.
- `performAction` selbst als Dispatcher-Boundary.

ARCH-90 ist deshalb ein echter Architekturwechsel: `index.ts` ist nicht mehr der zentrale Action-Mutator. Die Datei ist aber noch kein reiner Public-API-Index, weil Operation-/OnPlay-Logik, PublicContext/EventBuilder-Wiring, LegalAction-Generation-Hostbau, PendingChoice-/HiddenZone-Kanten und zentrale Zone-/Payment-/State-Primitives weiterhin lokal liegen.

## E. performAction-Move-Nachprüfung

`performAction` liegt in `packages/engine/src/game/apply/perform-action.ts` und importiert nicht aus `index.ts`.

`PerformActionExecutionHost` ist gruppiert und akzeptabel schmal:

| Gruppe | Zweck | Bewertung |
| --- | --- | --- |
| `turn` | Turn-Basic-Vorhandler | sauber delegierend |
| `economy` | Credit-Economy-Actions | sauber delegierend |
| `abilities` | TriggerAbility | sauber delegierend |
| `cardImplementation` | Activated CardImplementation | noch lokale Host-Komposition in `index.ts`, aber keine Branch-Mutation |
| `play` | Event/Operation-Play | sauber auf `game/play` delegierend |
| `install` | InstallCard | sauber delegierend |
| `board` | Advance/Special-Zone/Control/TrashResource | sauber delegierend |
| `corp` | ScoreAgenda | sauber delegierend |
| `run` | StartRun, Movement, Breaker, Continue | sauber delegierend |
| `rez` | Rez/DeclineRez | sauber delegierend |
| `access` | AccessAction | sauber delegierend |
| `choices` | PendingChoice-Resolution | sauber delegierend |

Der Move ist technisch sauber: keine produktiven Rückimporte, keine neue Engine-Kopie, keine PublicPayload-/Replay-/StateHash-Logik im `perform-action.ts`-Modul. `performAction` enthält noch die 25 bekannten Case-Labels, aber die Branches sind Dispatcher-Delegation. Die einzige auffällige Restkante ist nicht im neuen Modul, sondern in `index.ts`: `activatedCardImplementationExecutionHost` komponiert weiterhin Corp-Trace/Damage-, ScoredAgenda- und CardImplementation-Runtime-Kanten.

Follow-up-Risiken:

- Die Host-Komposition für `performAction` wird noch direkt in `configureApplyActionCoreHost` in `index.ts` zusammengesteckt.
- `pendingChoiceResolutionHost` und `activatedCardImplementationExecutionHost` ziehen HiddenZone-, Trace-/Damage- und ScoredAgenda-Kanten aus `index.ts` in den ApplyAction-Pfad.
- Eine weitere Reduktion des ApplyAction-Bereichs sollte Host-Komposition bewegen, nicht `performAction` erneut fachlich umbauen.

## F. Aktuelle `index.ts`-Bereichskarte

| Bereich | Grobe LOC / Anker | Hauptfunktion | Art | Caller | Ziel / Bleibt | Move-ready | Risiko | Möglicher Schnitt |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| Public API / Re-Exports | verteilt | `createGame`, `applyAction`, `getLegalActions`, Views, Replay, Validation | Public API | externe Pakete und Tests | bewusst in `index.ts` | nein | niedrig | keiner |
| ApplyAction-/PerformAction-Wiring | ca. 30 LOC plus Host-Funktionen | `configureApplyActionCoreHost`, `createPerformActionExecutorFromDependencies` | Hostbau | `apply-action.ts` | nach `game/apply` möglich | ja | mittel | `apply-action-host-composition-boundary` |
| EventBuilder/PublicContext | ca. 35 LOC Wiring, 1.821 LOC extern | `buildEventHost`, `publicContextForAction` | Hostbau + PublicContext | `apply-action.ts`, Eventtests | Wiring move-ready, PublicContext nicht | teilweise | mittel/hoch | EventHost-Wiring zuerst |
| LegalActions-Fassade | `legalActionGenerationHost` ca. 68 LOC plus MainAction-Hosts | LegalAction-Hostbau | Hostbau | `legal-actions.ts` | mittelfristig möglich | teilweise | mittel | LegalActionsHost boundary |
| PendingChoice | `pendingChoiceResolutionHost` ca. 97 LOC | Choice-Resolver-Host | Hostbau + HiddenZone-Kanten | `performAction`, choices | später | teilweise | hoch | PendingChoiceHost composition |
| Run/Access Host-Komposition | lokale Wrapper klein, echte Komposition extern | Adapter auf `runFlow`/`accessFlow` | Wiring | viele Fachhosts | weitgehend erledigt | niedrig | niedrig | nur Restwrapper bei Bedarf |
| Operation/OnPlay | ab ca. Zeile 13.713 | `canPlayCorpOperation`, `resolveCorpOperation`, Utility-Operationen, printed OnPlay | echte Fachlogik | PlayCard, LegalActions | sehr guter nächster Code-Hebel | ja, mit hartem Scope | mittel/hoch | CorpOperationResolution boundary |
| Payment/Credit/Zone-Primitives | ab ca. Zeile 13.313 und 14.070 | `spendCredits`, `spendClick`, `removeFromAllZones`, Zone-Moves | zentrale State-Primitives | fast alle Fachflows | bewusst noch zentral | nein | hoch | später, nur nach eigenem Audit |
| PublicContext/View | `public-context.ts` 1.821 LOC | PublicPayload-/HiddenInfo-Kontext | read-only Vertragsfläche | EventBuilder, PlayerView-nahe Tests | nicht sofort splitten | nein | hoch | PublicContext readiness/split später |
| Tests | `index.test.ts` 3.435 LOC | Integrationsregression | Testmonolith | Testlauf | teststrukturell möglich | ja | niedrig | Teststruktur-Split, nicht ARCH-91-Codehebel |

Größte lokale Function-Declaration-Spans in `index.ts`:

| Funktion | Start | LOC |
| --- | ---: | ---: |
| `scoredAgendaKindForDefinition` | 1.426 | 652 |
| `gameCardImplementationRuntimeDepsHost` | 817 | 470 |
| `specialZoneHarnessActions` | 3.563 | 138 |
| `runnerMainActionGenerationHost` | 2.687 | 123 |
| `applyCorpStartOfTurnEffects` | 6.892 | 121 |
| `installCardHost` | 4.561 | 118 |
| `scoredAgendaFlowHost` | 9.506 | 117 |
| `resolveMultiBreakSubroutinesAction` | 3.825 | 114 |
| `corpMainActionGenerationHost` | 2.363 | 108 |
| `creditEconomyExecutionHost` | 4.246 | 106 |
| `runnerBreakerActionExecutionHost` | 9.838 | 106 |
| `resolveCorpUtilityOperation` | 13.828 | 104 |
| `resolveV1911RunnerHiddenZoneAbility` | 11.970 | 103 |
| `advancementDistributionOptions` | 8.413 | 98 |
| `pendingChoiceResolutionHost` | 10.121 | 97 |
| `resolveDiscardChoice` | 10.274 | 90 |
| `resolveRunnerProgramTrashBeforeInstallChoice` | 5.073 | 89 |
| `resolveIncubatorTransformChoice` | 11.284 | 89 |
| `applyQuestForCattekinStartOfTurn` | 7.223 | 83 |
| `applyRunnerStartOfTurnEffects` | 7.140 | 83 |

Diese Tabelle ist als Priorisierung zu lesen, nicht als perfekte Ownership-Karte: Einige Spans enthalten historisch benachbarte Helper. Sie zeigt trotzdem die Reststruktur klar: Operation/OnPlay, CardImplementation-RuntimeDeps-Host und Choice/HiddenZone-Kanten sind die größten lokalen Anker.

## G. Host-Composition-Audit

| Cluster | Wo gebaut? | LOC in `index.ts` | Zielmodul | Nur Wiring? | Root-Boundary möglich? | Risiko | Empfohlene Aktion |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| `ApplyActionCoreHost` | `index.ts` | ca. 25 | `game/apply` | ja | ja | mittel | nach Operation oder als kleiner Host-Schnitt |
| `PerformActionExecutionHost` | `index.ts` + `game/apply/perform-action.ts` | ca. 30 in `index.ts` | `game/apply` | ja | ja | mittel | Host-Komposition kann später folgen |
| `BuildEventHost` | `index.ts` | ca. 12 plus deps | `game/events` | ja | ja | mittel | sicherer Wiring-Schnitt, aber kleiner Hebel |
| `LegalActionsHost` | `index.ts` | ca. 68 plus Unterhosts | `game/legal-actions` oder `game/actions` | gemischt | ja, später | mittel | erst nach Operation prüfen |
| `ReplayHost` | `index.ts` | ca. 6 | `game/replay` | ja | möglich | niedrig | nicht prioritär |
| `ApplyGameActionHost` | `index.ts` | ca. 5 | `game/apply` | ja | möglich | niedrig | nicht prioritär |
| PlayerView/LegalAction coupling | verteilt | klein | `game/view`/`game/legal-actions` | teils | später | mittel | nicht ARCH-91 |
| `PendingChoiceResolutionHost` | `index.ts` | ca. 97 | `game/choices` | gemischt | ja, aber riskant | hoch | nach Operation/Eventhost |
| `RunFlowHost` | `game/run/run-flow-hosts.ts` | lokale Wrapper klein | `game/run` | erledigt | erledigt | niedrig | keine Großaktion |
| `AccessFlowCompositionHost` | `game/access/access-flow-hosts.ts` | lokale Wrapper klein | `game/access` | erledigt | erledigt | niedrig | keine Großaktion |
| `CardImplementationRuntimeDepsHost` | `index.ts` | ca. 470 Span | `game/card-implementation` | gemischt | teilweise | mittel/hoch | interner Folgeaudit |
| `TriggerAbilityExecutionHost` | `index.ts` | mittel | `game/abilities` | gemischt | später | mittel | nicht zuerst |
| `CreditEconomyExecutionHost` | `index.ts` | ca. 106 | `game/economy` | gemischt | später | mittel | nach Operation |
| `DamageCoreHost` | `index.ts` const | klein | `game/damage` | ja | ja | niedrig | klein, nicht ARCH-91 |
| `TraceOrchestrationHost` | `index.ts` | ca. 78 | `game/trace` | gemischt | später | mittel | nicht zuerst |
| `InstallCardHost` | `index.ts` | ca. 118 | `game/install` | gemischt | später | mittel | nicht zuerst |
| `RezCardHost` | `index.ts` | ca. 69 | `game/rez` | gemischt | später | mittel | optional später |
| `ScoredAgendaFlowHost` | `index.ts` | ca. 117 | `game/corp` | gemischt | später | mittel | nicht zuerst |
| `CorpZoneChoiceHandlerHost` | `index.ts` | mittel | `game/hidden-zone`/`game/corp` | gemischt | später | hoch | PendingChoice/HiddenZone-Schnitt |
| HiddenZone handler hosts | `index.ts` | mehrere mittelgroße | `game/hidden-zone` | gemischt | ja, aber riskant | hoch | eigener Audit |
| `PlayCardExecutionHost` | `index.ts` | klein | `game/play` | ja, aber Operation callback lokal | ja | mittel | Operation boundary zuerst |
| `BoardStateActionExecutionHost` | `index.ts` | klein/mittel | `game/board` | ja | später | mittel | nicht prioritär |
| `RunnerBreakerActionExecutionHost` | `index.ts` | ca. 106 | `game/run` | gemischt | später | mittel | nicht ARCH-91 |
| `StartRunActionExecutionHost` | `index.ts` | klein/mittel | `game/run` | gemischt | später | mittel | nicht ARCH-91 |
| `RezActionExecutionHost` | `index.ts` | klein | `game/rez` | ja | später | niedrig | nicht prioritär |

Die wichtige Änderung nach ARCH-90: Die größten noch relevanten Knoten sind nicht mehr `performAction`-Branches, sondern Host-Kompositions- und Fachhelper-Cluster. Ein weiterer reiner Host-Wiring-Schnitt ist möglich, aber der größte Produktionscode-Hebel liegt im Operation/OnPlay-Cluster.

## H. PublicContext/EventBuilder-Audit

| Punkt | Befund |
| --- | --- |
| `public-context.ts` | 1.821 LOC |
| `publicContextForAction` | ca. 1.772 LOC |
| direkte `onr_v1_`-IDs | 0 |
| Payload-Familien | Action-Kontext, Kosten-/Zielkontext, Run/Access/Trace/Damage/HiddenZone- und Kartenkontext |
| Schutztests | `build-event.test.ts`, `player-view.test.ts`, `hidden-info.test.ts`, `replay.test.ts`, `index.test.ts` |
| sofortiger Split | nicht empfohlen |
| EventHost-Wiring-Schnitt | möglich, aber kleiner LOC-Hebel |

`publicContextForAction` ist jetzt wahrscheinlich der größte read-only Monolith im Engine-Umfeld. Er ist aber PublicPayload-/PublicEvent-/Replay-Vertragsfläche. Ein Feldfamilien-Split kann technisch sinnvoll werden, muss aber als eigener high-risk Schnitt mit PublicPayload-Snapshots, Hidden-Info-Regressionen, Replay und Web/Server-Typechecks vorbereitet werden.

Ein `game/events/event-context-host.ts` oder `game/view/public-context-host.ts`-Schnitt ist als Host-Wiring möglich, sollte aber ausdrücklich keinen Payload-Feldsplit enthalten. Als ARCH-91 wäre das sicherer als Operation/OnPlay, aber mit geringerem Strukturgewinn.

Bewertung: später für Feldsplit, möglich für reinen Host-Schnitt, nicht als erster großer Produktionscode-Hebel nach STATUS-5.

## I. Operation/OnPlay-Audit

Der Operation/OnPlay-Cluster liegt weiterhin in `index.ts`:

- `canPlayCorpOperation`
- `resolveCorpOperation`
- `resolveCorpUtilityOperation`
- `cardImplementationOperationLegalActions`
- printed-cost-on-play Kanten
- resource-target-revalidation
- HiddenZone-/Damage-/Trace-/Economy-Folgeeffekte
- CardImplementation-OnPlay-Ausführung

Beziehung zu `game/play/play-card-execution.ts`: `play_operation` ist bereits aus `performAction` heraus. Das neue Play-Modul delegiert aber `resolveCorpOperation` weiterhin als Callback in `index.ts`. Dadurch ist `game/play` nur die Action-Hülle, während Operation-Resolution und OnPlay-Branching weiter lokaler Fachknoten bleiben.

Bewertung:

- Nächster guter Code-Schnitt: ja.
- Zielmodul: `packages/engine/src/game/play/corp-operation-resolution.ts` oder `packages/engine/src/game/corp/corp-operation-resolution.ts`.
- Erwartete `index.ts`-Reduktion: mittel bis hoch, grob 250 bis 450 LOC, je nachdem ob `cardImplementationOperationLegalActions` und Utility-Operationen mitgezogen werden.
- Risiko: mittel/hoch wegen Payload-Anreicherung, HiddenZone-Choices, Trace/Damage/Economy-Folgeeffekten und CardImplementation-OnPlay.
- Akzeptabler Scope: Operation-Resolution und LegalAction-OnPlay-Wiring bewegen, aber keine PublicPayload-/PendingChoice-Werte ändern und keine CardImplementationRuntime neu bauen.

Der Schnitt passt gut zu ARCH-87: Dort wurde Play-Card-Execution aus `performAction` herausgezogen; ARCH-91 kann die verbliebene Operation-/OnPlay-Fachlogik hinter dieselbe Play/Corp-Grenze ziehen.

## J. PendingChoice-/HiddenZone-Host-Audit

`pendingChoiceResolutionHost` ist mit ca. 97 LOC ein sichtbarer Host-Cluster, aber er hängt an mehreren sensiblen Vertragsflächen:

- PendingChoice `source`, `kind`, `id` und `selectedChoices`.
- HiddenZone-Such-, Arrange- und NonSearch-Handler.
- Run-/Access-/Trace-/Damage-Folgefenster.
- Public payloads, die später EventBuilder und PlayerView erreichen.

Der P3.71-Stabilitätsaudit bleibt hier bindend: PendingChoice-, Replay- und Markerwerte dürfen nicht nebenbei verändert werden. Ein Host-Kompositionsschnitt kann später sinnvoll sein, aber nicht als unmittelbarer ARCH-91-Produktionscodehebel, solange Operation/OnPlay noch lokale Fachlogik enthält.

## K. Zone-/Payment-/State-Mutation-Primitives

Zentrale Primitives bleiben bewusst in `index.ts`:

- `removeFromAllZones`
- `trashRunnerInstalledCardToHeap`
- `trashCorpCardToArchives`
- `spendCredits`
- `spendClick`
- `definitionFor`
- `mustInstance`
- `mustServer`
- `ensureRunnerTurnFlags`
- `ensureCorpTurnFlags`
- Random-/Shuffle-Primitives

Diese Funktionen sind breit genutzt und StateHash-/Replay-relevant. Sie sind nicht der nächste sichere Schnitt. Ein späterer `zone-mutation-primitives-boundary` kann sinnvoll sein, braucht aber ein engeres API-Design, weil Zone-Mutation gleichzeitig HiddenInfo, PublicPayload, hosted cards, cleanup und Validation berührt.

## L. Neue Monolith-Kandidaten

Dateien über 500 LOC unter `packages/engine/src/game`:

| Datei | LOC | Kohäsion | Monolith-Gefahr | Index-Entlastung | Priorität |
| --- | ---: | --- | --- | --- | --- |
| `game/damage/damage-core.ts` | 2.202 | mittel | hoch | nein | später |
| `game/access/access-effect-handlers.ts` | 1.444 | mittel | hoch | nein | später |
| `game/run/run-flow-hosts.ts` | 1.232 | mittel | mittel | nein | später |
| `game/turn/runner-main-actions.ts` | 1.218 | mittel | mittel | indirekt | später |
| `game/run/successful-run-interventions.ts` | 950 | mittel | mittel | nein | später |
| `game/view/card-view.ts` | 928 | hoch | mittel | nein | später |
| `game/hidden-zone/search-choice-handlers.ts` | 921 | mittel | mittel | nein | später |
| `game/run/run-end-cleanup.ts` | 902 | mittel | mittel | nein | später |
| `game/hidden-zone/nonsearch-choice-handlers.ts` | 893 | mittel | mittel | nein | später |
| `game/run/encounter-resolution.ts` | 878 | mittel | mittel | nein | später |
| `game/turn/corp-main-actions.ts` | 873 | mittel | mittel | indirekt | später |
| `game/hidden-zone/arrange-choice-handlers.ts` | 867 | mittel | mittel | nein | später |
| `game/trace/trace-orchestration.ts` | 836 | mittel | mittel | nein | später |
| `game/run/encounter-actions.ts` | 831 | mittel | mittel | nein | später |
| `game/access/access-flow.ts` | 807 | hoch | mittel | nein | später |
| `game/economy/credit-economy-execution.ts` | 797 | mittel | mittel | nein | später |
| `game/run/encounter-special-windows.ts` | 780 | mittel | mittel | nein | später |
| `game/hidden-zone/search-choice-activations.ts` | 731 | mittel | mittel | nein | später |
| `game/run/run-rez-window.ts` | 730 | mittel | mittel | nein | später |
| `game/corp/scored-agenda-flow.ts` | 725 | mittel | mittel | teilweise | später |
| `game/run/fort-run-side-families.ts` | 708 | mittel | mittel | nein | später |
| `game/install/install-card.ts` | 673 | mittel | mittel | teilweise | später |
| `game/run/fort-pass-window.ts` | 657 | mittel | mittel | nein | später |
| `game/payment/trace-payment.ts` | 652 | hoch | niedrig | nein | später |
| `game/run/run-access-transition.ts` | 647 | hoch | niedrig | nein | später |
| `game/run/run-duration-payment.ts` | 626 | hoch | niedrig | nein | später |
| `game/run/encounter-printed-effects.ts` | 572 | mittel | mittel | nein | später |
| `game/corp/install-rez-sequence-handlers.ts` | 567 | mittel | mittel | teilweise | später |
| `game/run/encounter-entry.ts` | 558 | hoch | niedrig | nein | später |
| `game/abilities/runner-special-trigger-execution.ts` | 533 | mittel | mittel | nein | später |
| `game/validation.ts` | 526 | hoch | niedrig | nein | später |
| `game/hidden-zone/corp-zone-choice-handlers.ts` | 524 | mittel | mittel | teilweise | später |
| `game/choices/pending-choice-resolution.ts` | 508 | mittel | mittel | teilweise | später |
| `game/card-implementation/card-implementation-runtime-deps.ts` | 501 | mittel | mittel | teilweise | später |

Weitere Kandidaten außerhalb `game/`:

| Datei | LOC | Bewertung |
| --- | ---: | --- |
| `public-context.ts` | 1.821 | größter read-only Vertragsmonolith, hoher Split-Risiko |
| `index.test.ts` | 3.435 | Testmonolith, low-risk Split, aber kein Produktionscode-Hebel |
| `ability-engine/card-implementation-runtime.ts` | 2.211 | eigener Ability-Engine-Monolith, kein Index-Hebel |
| `ability-engine/effect-interpreter.ts` | 1.767 | eigener Ability-Engine-Monolith, kein Index-Hebel |
| `ability-engine/definition-types.ts` | 1.787 | Typfläche, kein Index-Hebel |

## M. Produktive Importgrenzen

Produktive `game/* -> index`-Imports bleiben bei 0. Das ist weiterhin die wichtigste harte Grenze: Neue Game-Boundaries dürfen aus `index.ts` keine Engine-Services importieren. Alle nächsten Schnitte müssen diese Richtung halten und lokale `index.ts`-Kanten als Host-Callbacks oder direkte Importe aus tieferen Modulen modellieren.

Testimports aus `game/*.test.ts` nach `index.ts` liegen bei 72. Das ist für Integrationstests akzeptabel, aber ein späterer Teststruktur-Schnitt kann die Tests stärker entlang neuer Boundaries ordnen.

## N. Direkte `onr_v1_`-Reste

`index.ts` und `public-context.ts` enthalten keine direkten `onr_v1_`-IDs. Die Treffer liegen in:

- `mechanics/`: 98, fachlich erwartbar für Mechanik-Konstanten.
- `compatibility/`: 42, erwartbar für Kompatibilitätsmappings.
- `game/`: 32, zu prüfen, aber nicht STATUS-5-blockierend.

ARCH-91 sollte keine Karten-ID-Migration starten. Das wäre ein anderes Thema als Index-Host-Komposition.

## O. Kandidaten für ARCH-91

| Kandidat | Zielmodule | Erwartete `index.ts`-Reduktion | Strukturgewinn | Host-Breite | Vertragsrisiko | PendingChoice-Risiko | Testbedarf | Empfehlung |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| `ENGINE-ARCH-91-corp-operation-resolution-boundary` | `game/play/corp-operation-resolution.ts` oder `game/corp/corp-operation-resolution.ts` | 250-450 LOC | hoch | mittel | mittel/hoch | mittel | Play, Corp, HiddenZone, Damage, Trace, Replay, Index | sofort |
| `ENGINE-ARCH-91-apply-action-host-composition-boundary` | `game/apply/apply-action-hosts.ts` | 60-120 LOC | mittel | mittel | niedrig/mittel | niedrig | ApplyAction, PerformAction, Index | später |
| `ENGINE-ARCH-91-build-event-host-composition-boundary` | `game/events/build-event-hosts.ts` | 30-80 LOC | mittel | klein | mittel | niedrig | BuildEvent, PublicContext, Replay, HiddenInfo | später |
| `ENGINE-ARCH-91-public-context-family-split` | `game/view/public-context/*` | hoch, aber extern zu index | hoch | hoch | hoch | mittel | PublicPayload, PlayerView, PublicEvent, Replay, Web | nicht sofort |
| `ENGINE-ARCH-91-pending-choice-host-composition-boundary` | `game/choices/pending-choice-hosts.ts` | 80-140 LOC | mittel | mittel | mittel | hoch | Choices, HiddenZone, Replay, Index | später |
| `ENGINE-ARCH-91-zone-mutation-primitives-boundary` | `game/zones/zone-mutation.ts` | mittel | hoch | hoch | hoch | mittel | broad regression | nicht sofort |
| `ENGINE-ARCH-91-index-test-structure-boundary` | `src/index.test.ts` Split | 0 Produktions-LOC | mittel für Tests | keine | niedrig | niedrig | test-only | später |
| `ENGINE-ARCH-91-public-context-readiness-audit` | Dokument | 0 | hoch für Planung | keine | niedrig | niedrig | typecheck | nur falls Code-Gate blockiert |
| `ENGINE-ARCH-91-run-flow-hosts-internal-split` | `game/run/*` | 0 index | mittel | intern | niedrig/mittel | niedrig | run tests | später |
| `ENGINE-ARCH-91-damage-core-internal-split` | `game/damage/*` | 0 index | mittel | intern | hoch | niedrig | damage tests | später |

## P. Empfohlener nächster Code-Schnitt

Empfohlen für ARCH-91:

`ENGINE-ARCH-91-corp-operation-resolution-boundary`

Ziel:

- `canPlayCorpOperation`, `resolveCorpOperation`, `resolveCorpUtilityOperation` und die direkt gekoppelte Operation-/OnPlay-LegalAction-Kante aus `index.ts` herausziehen.
- Bestehende CardImplementationRuntime, HiddenZone, Damage, Trace, Economy und Choice-Handler nur delegieren.
- Keine neue Operation-Engine bauen.
- Keine PublicPayload-, PendingChoice-, Replay- oder StateHash-Verträge ändern.

Warum dieser Schnitt jetzt der beste Hebel ist:

- `performAction` ist erledigt; Operation/OnPlay ist einer der größten verbleibenden echten Fachlogik-Cluster in `index.ts`.
- Der Cluster ist fachlich kohärent und passt zur ARCH-87-Play-Card-Boundary.
- Ein reiner ApplyActionHost- oder BuildEventHost-Schnitt wäre sicherer, aber kleiner und würde die nächste echte Fachlogikinsel nicht auflösen.
- Ein PublicContext-Split wäre größer, aber deutlich riskanter, weil er direkt PublicPayload/PublicEvent/Replay-Verträge berührt.

## Q. Alternativen und warum schlechter

- `build-event-host-composition-boundary`: sinnvoller Low-/Mid-Risk-Schnitt, aber zu kleiner Produktionscode-Hebel direkt nach ARCH-90.
- `apply-action-host-composition-boundary`: kann die ApplyAction-Fassade abrunden, löst aber keinen großen lokalen Fachknoten.
- `public-context-family-split`: wahrscheinlich langfristig wichtig, aber jetzt zu vertragsnah.
- `pending-choice-host-composition-boundary`: strukturell interessant, aber PendingChoice-/HiddenZone-/Replay-Risiko ist höher als beim Operation-Schnitt.
- `zone-mutation-primitives-boundary`: großer theoretischer Hebel, aber aktuell zu breit und StateHash-/HiddenInfo-riskant.
- `index-test-structure-boundary`: gut für Wartbarkeit, aber kein Produktionscode-Schnitt.

## R. Was ausdrücklich nicht als nächstes machen

- Kein PublicContext-Feldsplit ohne eigenen Akzeptanzkatalog und Snapshot-/Replay-Schutz.
- Keine Zone-/Payment-/Random-Primitives als großes Sammelpaket bewegen.
- Keine CardImplementationRuntime- oder AbilityEngine-Neuarchitektur im Windschatten von ARCH-91.
- Keine `game/* -> index`-Importe zulassen.
- Keine ActionID-, PendingChoice-, PublicPayload-, PublicEvent-, PlayerView-, Replay- oder StateHash-Vertragsänderung.
- Kein test-only ARCH-91, solange der Operation/OnPlay-Code-Schnitt sicher möglich ist.

## S. Teststrategie für den nächsten Schnitt

Für `ENGINE-ARCH-91-corp-operation-resolution-boundary`:

- Neues Modul: `packages/engine/src/game/play/corp-operation-resolution.ts` oder `packages/engine/src/game/corp/corp-operation-resolution.ts`.
- Neuer Test: `corp-operation-resolution.test.ts`.
- Pflichttests:
  - printed-cost-on-play delegiert an CardImplementationRuntime mit identischen Parametern.
  - Utility-Operationen behalten Payload-Felder und Kosten-/Zielsemantik.
  - HiddenZone-Operationen behalten PendingChoice `source`, `kind`, `id`.
  - Damage-/Trace-/Economy-Folgeeffekte bleiben delegiert.
  - `play-card-execution.test.ts`, `apply-action.test.ts`, `build-event.test.ts`, `replay.test.ts`, `hidden-info.test.ts`, `index.test.ts`.
  - `game/corp`, `game/hidden-zone`, `game/damage`, `game/trace`, `game/play`.
  - Engine/Web/Server-Typechecks und `git diff --check`.

## T. Risiken

- Operation/OnPlay schreibt Payload-Felder, die PublicEvents und Replay sichtbar beeinflussen können.
- HiddenZone-Operationen können PendingChoice-Stabilität verletzen, wenn Choice-Quellen oder Options-IDs auch nur umbenannt werden.
- CardImplementation-OnPlay darf nicht dupliziert oder in eine zweite Runtime umgebaut werden.
- Der aktuelle Branch enthält einen Merge nach ARCH-90; Metriken müssen bei ARCH-91 erneut am dann aktuellen HEAD erhoben werden.

## U. Akzeptanzkriterien für spätere PublicContext-Splits

- Keine Änderung an PublicPayload-, PublicEvent-, PlayerView- oder Replay-Shape.
- Keine neuen direkten Karten-ID-Spezialfälle in `public-context.ts`.
- Vorher/Nachher-Snapshots für repräsentative Actionfamilien.
- Hidden-Info-Tests für Corp-Hand, R&D, Archives, verdeckte Ressourcen und Choice-Views.
- Web/Server-Typechecks grün.
- Split entlang read-only Familien, nicht entlang einzelner Karten.

## V. Akzeptanzkriterien für weitere Host-Composition-Moves

- Neues Modul importiert nicht aus `index.ts`.
- Host-Oberfläche bleibt gruppiert, nicht 25+ flache Properties.
- Bestehende Fachmodule bleiben Eigentümer ihrer Logik.
- PublicPayload/EventBuilder bleibt außerhalb des Schnitts, außer der Schnitt ist explizit Event/PublicContext.
- Tests enthalten mindestens einen Delegations-/Smoke-Test und die betroffenen Regression-Suiten.

## W. Akzeptanzkriterien für spätere Teststruktur-Splits

- Keine Produktionscodeänderung im selben Commit.
- `index.test.ts`-Szenarien werden in fachliche Suites verschoben, nicht gelöscht.
- Cross-Feature-Regressionsfälle bleiben als Integrationssuite erhalten.
- Testnamen und Fixtures bleiben so nah wie möglich an den bisherigen Szenarien.
- Vorher/Nachher-Testlauf enthält mindestens `src/index.test.ts`, neue fachliche Suite und betroffene Game-Suites.
