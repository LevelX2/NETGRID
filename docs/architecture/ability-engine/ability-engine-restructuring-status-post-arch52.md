# Ability Engine Restructuring Status nach ARCH-52

Stand: 2026-05-25  
Auftrag: `ENGINE-STATUS-2-post-arch52-runtime-host-audit`  
Branch: `codex/card-implementation-next-task`

## A. Ausgangspunkt und Commits

Der Audit wurde im aktuellen NETGRID-Worktree auf dem Branch `codex/card-implementation-next-task` durchgeführt. Der Worktree war zu Beginn sauber.

Geprüfte Commit-Voraussetzungen:

| Commit | Befund |
| --- | --- |
| `d62722acace048c6c1d41327f081efd0e0a8200f refactor(engine): extract card implementation activated execution` | vorhanden, ARCH-52 |
| `8dabddbdfbbd82901a0f0f295b488456ac114005 refactor(engine): extract run card implementation actions` | vorhanden, ARCH-51 |
| `f6aafa5636b82c45495d137c8f12a4c545690c5f refactor(engine): extract fort run side families` | vorhanden, ARCH-50 |
| `58c56bff61a77833b371c0d20d39d6974ccca915 refactor(engine): extract run fort pass window boundary` | vorhanden, ARCH-49 |

## B. Methodik und Quellen

Gelesene Projekt- und Architekturquellen:

- `KI-Wissen-NETGRID/00 Projektstart.md`
- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-NETGRID/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md`
- `KI-Wissen-NETGRID/00 Steuerung/Regeldatei KI-Wissenspflege.md`
- `agents/architecture-review-agent.md`
- `docs/architecture/ability-engine/ability-engine-restructuring-status-current.md`
- `docs/architecture/engine-apply-action-boundary-analysis.md`
- `docs/architecture/engine-module-split-audit-and-plan-final.md`
- `docs/architecture/ability-engine/card-implementation-phase-completion-p3-70.md`
- `docs/architecture/ability-engine/pending-choice-replay-marker-stability-p3-71.md`

Codebasis wurde per LOC-Messung, Funktionsgrößenmessung, Importsuche und Direct-ID-Suche geprüft. Es wurde kein Produktivcode und kein Testcode geändert.

## C. Gesamtmesswerte

| Artefakt | LOC aktuell | Einordnung |
| --- | ---: | --- |
| `packages/engine/src/index.ts` | 22.191 | weiterhin Host-/Engine-Monolith |
| `packages/engine/src/index.test.ts` | 48.819 | weiterhin größter Test-Monolith |
| `packages/engine/src/public-context.ts` | 1.804 | PublicPayload-/View-Vertragsknoten |
| `packages/shared/src/index.ts` | 11.249 | Shared-Typ- und Vertragsmonolith |
| `apps/server/src/multiplayer.ts` | 3.422 | Server-Monolith, seit STATUS-1 praktisch stabil |
| `apps/web/app/page.tsx` | 14.538 | Web-App-Monolith |
| `apps/web/app/chronicle.ts` | 2.384 | Web-Chronik-Auswertung |
| `apps/web/app/action-board-ui.ts` | 1.525 | ActionBoard-UI-Vertragsfläche |

Vergleich mit ENGINE-STATUS-1:

| Messwert | STATUS-1 | Aktuell | Veränderung |
| --- | ---: | ---: | ---: |
| `index.ts` | 32.111 | 22.191 | -9.920 LOC, -30,9 % |
| `index.test.ts` | 49.711 | 48.819 | -892 LOC, -1,8 % |
| `public-context.ts` | 1.661 | 1.804 | +143 LOC |
| `apps/server/src/multiplayer.ts` | 3.423 | 3.422 | -1 LOC |
| `apps/web/app/page.tsx` | 13.736 | 14.538 | +802 LOC |

Die Engine-Architekturarbeit seit STATUS-1 hat also real knapp ein Drittel von `index.ts` herausgeschnitten. Test- und Web-Monolithen wurden dabei kaum entlastet.

## D. Größte Funktionen in `index.ts`

| Rang | Funktion | LOC | Zeilen |
| ---: | --- | ---: | --- |
| 1 | `performAction` | 1.324 | 5901-7224 |
| 2 | `runnerMainActions` | 840 | 3733-4572 |
| 3 | `corpMainActions` | 642 | 2878-3519 |
| 4 | `cardImplementationRuntimeDeps` | 661 | 688-1348 |
| 5 | `installCard` | 389 | 7968-8356 |
| 6 | `resolvePendingChoice` | 319 | 16757-17075 |
| 7 | `resolveEventModificationChoice` | 272 | 12725-12996 |
| 8 | `startRun` | 164 | 8520-8683 |
| 9 | `collectRuntimeDamagePreventionCandidates` | 144 | 12038-12181 |
| 10 | `rezCard` | 138 | 8957-9094 |
| 11 | `specialZoneHarnessActions` | 137 | 5297-5433 |
| 12 | `continueRun` | 123 | 9193-9315 |
| 13 | `applyCorpStartOfTurnEffects` | 120 | 10934-11053 |
| 14 | `scoredAgendaFlowHost` | 116 | 15649-15764 |
| 15 | `accessEffectHandlerHost` | 105 | 16627-16731 |
| 16 | `resolveCorpUtilityOperation` | 103 | 21609-21711 |
| 17 | `resolveV1911RunnerHiddenZoneAbility` | 102 | 18860-18961 |
| 18 | `collectReplacementCandidates` | 100 | 12497-12596 |
| 19 | `resolvePileDriverBreakSubroutinesAction` | 100 | 5550-5649 |
| 20 | `advancementDistributionOptions` | 97 | 14506-14602 |
| 21 | `variableIceStateForRezAction` | 96 | 9096-9191 |
| 22 | `runEndCleanupHost` | 95 | 16366-16460 |
| 23 | `getLegalActions` | 92 | 2387-2478 |
| 24 | `resolveDiscardChoice` | 89 | 17133-17221 |
| 25 | `resolveRunnerProgramTrashBeforeInstallChoice` | 88 | 7879-7966 |
| 26 | `eventModificationChoice` | 88 | 12636-12723 |
| 27 | `resolveIncubatorTransformChoice` | 88 | 18174-18261 |
| 28 | `resolveTraceCorpBid` | 87 | 19583-19669 |
| 29 | `runAccessTransitionHost` | 86 | 16540-16625 |
| 30 | `revealForPublicEvent` | 83 | 20439-20521 |
| 31 | `applyQuestForCattekinStartOfTurn` | 82 | 11262-11343 |
| 32 | `resolveReplacementChoice` | 82 | 12998-13079 |
| 33 | `applyRunnerStartOfTurnEffects` | 79 | 11182-11260 |
| 34 | `hiddenZoneSearchHandlerHostBase` | 78 | 15310-15387 |
| 35 | `applyRuntimeDamagePreventionCost` | 73 | 13399-13471 |
| 36 | `startIncubatorTransformChoice` | 72 | 11484-11555 |
| 37 | `resolveTracePostBidLinkChoice` | 72 | 19990-20061 |
| 38 | `resolveRunnerInstalledConnectionTrashBadPublicityChoice` | 72 | 18457-18528 |
| 39 | `applyProteusPurgeableRunnerVirusCorpStartEffects` | 71 | 11055-11125 |
| 40 | `restoreCodeViralCachePreservedCounters` | 70 | 20928-20997 |

Korrektur zur reinen Funktionsmessung: `applyAction` ist wegen Overload-Signatur nicht 4 LOC, sondern der Implementierungsblock umfasst ca. 78 LOC ab Zeile 2484. `buildEvent` umfasst 60 LOC.

## E. Was seit STATUS-1 wirklich entkoppelt ist

Die folgenden Eigentümerschaften sind nicht mehr primär in `index.ts`:

- Access-Flow, Access-Action-Erzeugung und Access-Effect-Handler.
- Run-End-Cleanup, Successful-Run-Interventions und Run-Access-Transition.
- Encounter-Resolution, Encounter-Special-Windows, printed Trace/Damage und printed nontrace Subroutines.
- Encounter-/Movement-LegalAction-Erzeugung.
- Run-Movement-Ausführung.
- Encounter-Entry, Smarteye, Speed Trap und PVR-Encounter-Setup.
- Run-Rez-/Approach-Rez-Window und Root-Rez-Effect-Resolution.
- Fort-Pass-/Run-Window inklusive Singapore/Omni-Reposition.
- Fort-Run-Side-Familien Aardvark, Roving, Paris, Tokyo-Anbindung und Stealth-Loss.
- CardImplementation during-run LegalAction-Erzeugung.
- Activated-CardImplementation-Execution-Dispatch.

Diese Schnitte sind fachlich belastbar: Die neuen Module importieren nicht aus `index.ts`, besitzen eigene fokussierte Tests und halten ActionIDs, Payloads, PendingChoice-Werte und PublicPayload-Felder stabil.

## F. Was nur verlagert wurde

Nicht jeder Schnitt macht automatisch eine kleine Fassade. Mehrere neue Module sind fachlich korrekt, aber groß:

- `access-effect-handlers.ts` ist mit 1.482 LOC ein echter Access-Effect-Knoten.
- `successful-run-interventions.ts`, `encounter-resolution.ts`, `run-end-cleanup.ts`, `encounter-special-windows.ts`, `run-rez-window.ts`, `fort-run-side-families.ts`, `encounter-actions.ts` und `fort-pass-window.ts` sind kohärente Fachmodule, aber bereits groß genug, um später intern weiter geschnitten zu werden.
- Hidden-Zone-Module sind fachlich stark entkoppelt, aber `search-choice-handlers.ts`, `nonsearch-choice-handlers.ts`, `arrange-choice-handlers.ts` und `search-choice-activations.ts` bilden zusammen einen zweiten großen PendingChoice-Komplex.

Das ist derzeit akzeptabel, weil Verantwortlichkeiten aus `index.ts` herausgelöst wurden und modulnahe Tests existieren. Es ist aber kein Endzustand.

## G. Neue Monolith-Kandidaten

| Datei | LOC | Schwelle | Bewertung |
| --- | ---: | --- | --- |
| `game/access/access-effect-handlers.ts` | 1.482 | >1000 | wächst zum Access-Effect-Monolithen; später nach Ambush, Trash/Steal, Payment/Prevention splitten |
| `game/run/successful-run-interventions.ts` | 981 | >750 | kohärent, aber groß; später nach Intervention-Familien splitten |
| `game/view/card-view.ts` | 967 | >750 | View-Vertragsknoten; nicht ohne PublicView-Gate schneiden |
| `game/hidden-zone/search-choice-handlers.ts` | 960 | >750 | kohärent, aber PendingChoice-reich |
| `game/hidden-zone/nonsearch-choice-handlers.ts` | 926 | >750 | kohärent, aber heterogen |
| `game/run/encounter-resolution.ts` | 914 | >750 | fachlich kohärent; später Subroutine-Folgen intern splitten |
| `game/hidden-zone/arrange-choice-handlers.ts` | 901 | >750 | kohärent |
| `game/run/run-end-cleanup.ts` | 851 | >750 | kohärent; Cleanup-/Aftermath-Familien beobachten |
| `game/run/encounter-special-windows.ts` | 816 | >750 | kohärent; Spezialfenster wachsen weiter |
| `game/access/access-flow.ts` | 785 | >750 | kohärent |
| `game/run/run-rez-window.ts` | 761 | >750 | kohärent, nach ARCH-49 entkoppelt |
| `game/hidden-zone/search-choice-activations.ts` | 759 | >750 | aktivierungsnaher Hidden-Zone-Knoten |
| `game/corp/scored-agenda-flow.ts` | 752 | >750 | kohärent |
| `game/run/fort-run-side-families.ts` | 747 | >500 | bewusst heterogene Abschlussfamilie; nicht weiter aufblasen |
| `game/run/encounter-actions.ts` | 716 | >500 | kohärenter LegalAction-Builder |
| `game/payment/trace-payment.ts` | 697 | >500 | Zahlungs-/Trace-Quelle; migrationssensibel |
| `game/run/fort-pass-window.ts` | 681 | >500 | kohärent |
| `game/run/run-duration-payment.ts` | 663 | >500 | Zahlungs-/Run-Dauer-Knoten |
| `game/run/run-access-transition.ts` | 630 | >500 | kohärent |
| `game/corp/install-rez-sequence-handlers.ts` | 585 | >500 | kohärent |
| `game/hidden-zone/corp-zone-choice-handlers.ts` | 545 | >500 | kohärent |
| `game/run/encounter-printed-effects.ts` | 536 | >500 | kohärent |
| `game/run/run-movement.ts` | 505 | >500 | kohärent |
| `game/run/encounter-printed-nontrace-effects.ts` | 502 | >500 | kohärent |
| `game/access/access-actions.ts` | 501 | >500 | kohärent |

## H. Importgrenzen und `game/* -> index`

Produktive `game/* -> index` Imports:

| Datei | Import | Bewertung |
| --- | --- | --- |
| `packages/engine/src/game/apply-game-action.ts` | `applyAction` | Wrapper/Fassade, bewusst |
| `packages/engine/src/game/legal-actions.ts` | `getLegalActions` | Wrapper/Fassade, bewusst |
| `packages/engine/src/game/player-view.ts` | `getPlayerView` | Wrapper/Fassade, bewusst |
| `packages/engine/src/game/replay.ts` | `replayEvents` | Wrapper/Fassade, bewusst |

Testimports aus `game/*` nach `index.ts` bleiben für Cross-Flow-Regressionen bestehen, unter anderem in `game/index.test.ts`, Access-, Trace-, Damage-, View-, Turn-, Run- und Counter-Tests. Es wurde kein neuer problematischer produktiver Import aus einem Fachmodul nach `index.ts` gefunden.

## I. Direct-ID-Reste

Produktive `onr_v1_`-Treffer:

| Bereich | Treffer | Unique | Bewertung |
| --- | ---: | ---: | --- |
| `index.ts` | 0 | 0 | Zielzustand hält |
| `public-context.ts` | 0 | 0 | Zielzustand hält |
| `ability-engine/` | 0 | 0 | Zielzustand hält |
| `game/` | 32 | 24 | bewusst in View-/Corp-Fachmodulen und Fachtests getrennt |
| `mechanics/` | 98 | 96 | Mechanik-Kataloge, bewusst |
| `compatibility/` | 42 | 42 | Runtime-/Payload-/Replay-Kompatibilitätskonstanten, bewusst |

Die produktiven `game/`-Reste liegen in `game/view/card-view.ts`, `game/corp/scored-agenda-abilities.ts` und `game/corp/trace-damage-abilities.ts`. Das ist keine Regression gegenüber dem CardImplementation-Abschluss, aber ein Hinweis für spätere View- und Corp-Ability-Katalog-Schnitte.

## J. `cardImplementationRuntimeDeps` Detailaudit

Aktueller Stand:

- LOC: 661
- Top-Level-Properties: 58
- Einordnung: breite Runtime-Host-Oberfläche, aber nicht direkt move-ready.

`cardImplementationRuntimeDeps` ist weiterhin die zentrale technische Schuld, weil sie sehr viele fachliche Subsysteme in ein RuntimeDeps-Objekt verdichtet. Gleichzeitig ist sie inzwischen besser eingrenzbar: ARCH-51/52 haben während-Run-Action-Erzeugung und Activated-Execution-Dispatch entfernt, ohne die Runtime selbst umzubauen.

Property-Audit:

| Property | Verantwortung | Modus | Nächster Zielbereich | Risiko |
| --- | --- | --- | --- | --- |
| `runnerMadeSuccessfulRunOnServerThisTurn` | Run-Historie | liest | `game/run` Query | mit Tests sicher |
| `runnerLiberatedAgendaSubtypeThisTurn` | Access/Agenda-Historie | liest | `game/access` oder Corp-Agenda Query | mit Tests sicher |
| `corpScoredAgendaSubtypeLastTurn` | Agenda-Historie | liest | `game/corp` Query | mit Tests sicher |
| `createAction` | LegalAction-Building | baut | zentraler Action-Builder | riskant, viele Call-sites |
| `startTrace` | Trace-Orchestrierung | mutiert | `game/trace` Runtime-Adapter | riskant |
| `startRun` | Run-Start-Orchestrierung | mutiert | `game/run` Start-Adapter | riskant |
| `startPrivateLook` | Hidden-Zone/Private-Look | mutiert | `game/hidden-zone` | mit Tests sicher |
| `exposeInstalledCorpCardTargets` | Expose-Targeting | liest | `game/hidden-zone`/View | mit Tests sicher |
| `exposeInstalledCorpCard` | Expose-Ausführung | mutiert | `game/hidden-zone` | mit Tests sicher |
| `startExposeInstalledCorpCardsChoice` | Expose-Choice | mutiert Choice | `game/hidden-zone` | PendingChoice-riskant |
| `exposeOutermostIceEachDataFort` | Expose-Ausführung | mutiert | `game/run`/Hidden-Zone | mit Tests sicher |
| `outermostIceEachDataFortExposeCount` | Expose-Query | liest | `game/run`/Hidden-Zone | sofort sicher |
| `startShowHqAgendasForCreditsChoice` | Hidden-HQ-Choice | mutiert Choice | `game/hidden-zone` | PendingChoice-riskant |
| `searchTrashToGripTargetCount` | Search-Query | liest | `game/hidden-zone` | sofort sicher |
| `searchStackToGripTargetCount` | Search-Query | liest | `game/hidden-zone` | sofort sicher |
| `topTrashToGripTargetCount` | Search-Query | liest | `game/hidden-zone` | sofort sicher |
| `topTrashToGripTargetId` | Search-Query | liest | `game/hidden-zone` | sofort sicher |
| `searchStackInstallTargetCount` | Search/Install-Query | liest | `game/hidden-zone` | mit Tests sicher |
| `stackOrTrashProgramInstallTargetCount` | Search/Install-Query | liest | `game/hidden-zone` | mit Tests sicher |
| `lookTopStackShowToCorpThenInstallMatchingTargetCount` | Look/Install-Query | liest | `game/hidden-zone` | mit Tests sicher |
| `lookTopStackTakeMatchingTargetCount` | Look/Take-Query | liest | `game/hidden-zone` | mit Tests sicher |
| `startSearchTrashToGripChoice` | Search-Choice | mutiert Choice | `game/hidden-zone` | PendingChoice-riskant |
| `startSearchStackToGripChoice` | Search-Choice | mutiert Choice | `game/hidden-zone` | PendingChoice-riskant |
| `moveTopTrashToGrip` | Card movement | mutiert | `game/hidden-zone` | mit Tests sicher |
| `startSearchStackInstallChoice` | Search/Install-Choice | mutiert Choice | `game/hidden-zone` | PendingChoice-riskant |
| `startStackOrTrashProgramInstallChoice` | Search/Install-Choice | mutiert Choice | `game/hidden-zone` | PendingChoice-riskant |
| `startLookTopStackShowToCorpThenInstallMatchingChoice` | Look/Install-Choice | mutiert Choice | `game/hidden-zone` | PendingChoice-riskant |
| `startLookTopStackTakeMatchingChoice` | Look/Take-Choice | mutiert Choice | `game/hidden-zone` | PendingChoice-riskant |
| `startLookTopStackTakeOneArrangeRestChoice` | Look/Arrange-Choice | mutiert Choice | `game/hidden-zone` | PendingChoice-riskant |
| `trashOwnInstalledCardTargetCount` | Trash target query | liest | `game/hidden-zone`/Trash | mit Tests sicher |
| `trashGripCardTargetCount` | Grip-trash query | liest | `game/hidden-zone` | mit Tests sicher |
| `startTrashOwnInstalledCardsForCreditsChoice` | Trash-Choice | mutiert Choice | `game/hidden-zone` | PendingChoice-riskant |
| `startTrashCardsFromGripForCreditsChoice` | Grip-trash Choice | mutiert Choice | `game/hidden-zone` | PendingChoice-riskant |
| `shuffleGripTrashAndStackThenDraw` | Zone movement/draw | mutiert | `game/hidden-zone`/Draw | riskant |
| `rezzedIceTargetCount` | ICE target query | liest | `game/run`/Corp board | sofort sicher |
| `unrezzedIceTargetCount` | ICE target query | liest | `game/run`/Corp board | sofort sicher |
| `installedIceTargetCount` | ICE target query | liest | `game/run`/Corp board | sofort sicher |
| `rezzedBlackIceTargetCount` | ICE target query | liest | `game/run`/Corp board | sofort sicher |
| `corpHqCardCount` | HQ hidden count | liest | Hidden-Zone Query | sofort sicher |
| `runnerValuPakInstallableProgramCount` | Runner install query | liest | `game/turn`/Install | mit Tests sicher |
| `startPayRezCostToTrashRezzedIceChoice` | Payment/Rez/Trash Choice | mutiert Choice | Run/Corp/Payment boundary | riskant |
| `startTrashUnrezzedIceChoice` | Trash ICE Choice | mutiert Choice | Run/Hidden-Zone | PendingChoice-riskant |
| `startCorpChoiceRezOrTrashIceChoice` | Rez/Trash Choice | mutiert Choice | Corp/Rez boundary | riskant |
| `startDerezRezzedBlackIceChoice` | Derez Choice | mutiert Choice | Corp/Run | riskant |
| `startCorpDiscardHqWithRetainPayment` | HQ discard/payment | mutiert | Hidden-Zone/Payment | riskant |
| `startRunnerProgramInstallActionBundle` | Install action bundle | mutiert/startet choices | `game/turn`/Install | riskant |
| `addCounterToAllInstalledRunnerIcebreakers` | Counter mutation | mutiert | Counters/Run | mit Tests sicher |
| `shuffleSourceIntoCorpRd` | Card movement | mutiert | Corp zone movement | riskant |
| `trashCorpInstalledCardsInSourceServer` | Trash installed Corp cards | mutiert | Corp/Trash | riskant |
| `gainRunnerEventAgendaPoint` | Score mutation | mutiert | Runner event/agenda | riskant |
| `corpRandomDiscardFromHq` | Random/HQ discard | mutiert RNG/hidden | nicht anfassen ohne Replay-Gate |
| `startDistributeAdvancementCounters` | Advancement Choice | mutiert Choice | Corp/Advancement | PendingChoice-riskant |
| `startMoveAdvancementCounters` | Advancement Choice | mutiert Choice | Corp/Advancement | PendingChoice-riskant |
| `addCurrentEncounterAdditionalSubroutine` | Encounter mutation | mutiert | `game/run/encounter-resolution` | mit Tests sicher |
| `removeRunnerTags` | Tag mutation | mutiert | Turn/Tags | mit Tests sicher |
| `avoidNextTag` | Tag prevention marker | mutiert | Turn/Tags | mit Tests sicher |
| `returnSourceToGripIfPaid` | Payment + movement | mutiert | Payment/Hidden-Zone | riskant |
| `abilityLimits` | Ability limit tracking | liest/mutiert | `ability-engine` | nicht als isolierter Mini-Schnitt |

Zerlegungskandidaten:

| Kategorie | Kandidaten | Empfehlung |
| --- | --- | --- |
| sofort sicher | reine Target-/Count-Queries wie ICE counts, stack/trash target counts, `corpHqCardCount` | geeignet für kleinen Query-Adapter, aber geringe LOC-Wirkung |
| mit Tests sicher | Hidden-Zone Search/Expose Query+Start-Familien, Counter/Tag-Hilfen, `addCurrentEncounterAdditionalSubroutine` | sinnvoll nach weiterem PendingChoice-Audit |
| riskant | `startTrace`, `startRun`, payment-/rez-/installnahe Choice-Starter, card movement mit hidden info | nicht als ARCH-53 Big-Bang |
| nicht anfassen | `corpRandomDiscardFromHq`, `abilityLimits` als isolierter Move, allgemeines `createAction` | braucht Replay-/Runtime-Design |
| braucht PublicPayload/Replay-Gate | PendingChoice source/kind/id, RNG-Purpose, Hidden-Zone-Barriers, Legacy payload marker | erst nach explizitem Migrationsplan |

## K. `performAction` Detailaudit

Aktuell 1.324 LOC. Der `activated_card_ability`-Branch ist nach ARCH-52 nur noch Dispatch:

- Corp Trace/Damage Activated Ability Handler.
- Scored Agenda Activated Ability Handler.
- generische Runtime-Ability-Resolution über bestehende `cardImplementationRuntimeDeps`.

Größere verbleibende Branch-Familien:

| Familie | Status | Nächster Schnitt |
| --- | --- | --- |
| Turn/basic | teils inline | später TurnFlow-Schnitt |
| install/play | groß, stark mit Payment/Choices gekoppelt | nicht vor Install-/Payment-Audit |
| rez | `rezCard` bleibt bewusst in `index.ts` | später Rez/Payment-Familienschnitt |
| score | teils in Corp-Modulen | weitere Scored-/Agenda-Choice-Reste prüfen |
| activated CardImplementation | Dispatch extrahiert | erledigt für ARCH-52 |
| run/movement/encounter | weitgehend in Run-Modulen | nur Host-Reste beobachten |
| access/steal/trash | Access-Module vorhanden, performAction-Reste bleiben | später Access-Execution-Restprüfung |
| trace | Trace bidding und Choices weiterhin in `index.ts` | Kandidat, aber runtime-/choice-riskant |
| damage | Prevention/Replacement weiterhin in `index.ts` | Kandidat, aber PublicEvent-/Damage-riskant |
| pendingChoice | Dispatcher bleibt groß | eigener Choice-Residual-Schnitt möglich |
| hidden-zone | viele Familien ausgelagert, Reste bleiben | nach PendingChoice-Audit |
| card-specific residuals | viele `v19xx`-Reste | nur fachfamilienweise schneiden |

`performAction` ist noch nicht move-ready. Es ist zwar stärker ein Dispatcher als vor ARCH-41 bis ARCH-52, aber enthält weiterhin breite Mutation, Payment/Revalidation, Choices, Damage/Trace, Install/Rez und legacy card-specific Residuals. Ein kompletter Move wäre jetzt wieder ein Monolith-Transfer.

## L. `corpMainActions` und `runnerMainActions`

Aktuelle Größen:

- `corpMainActions`: 642 LOC.
- `runnerMainActions`: 840 LOC.

Bereits extrahiert wurden unter anderem Run-/Encounter-Actions, Run-Rez-Window-Actions, Fort-Pass-/Run-Window-Actions, FortRunSide-Familien und CardImplementation during-run Actions.

Verbleibende Inline-Familien:

| Funktion | Restfamilien |
| --- | --- |
| `corpMainActions` | Corp install/rez/score/advance, Operation play, Purge/Forgo, Economy/Utility/Hidden-Zone remnants, Corp special actions |
| `runnerMainActions` | Runner install/draw/run/play prep/resource/program/hardware, trash-before-install, hosted install, special-zone installs, card-specific action builders, access/run setup actions |

Diese beiden Funktionen sind derzeit der beste LOC-/Risiko-Kandidat für den nächsten echten Schnitt. Sie sind überwiegend LegalAction-Erzeugung und folgen damit dem erfolgreichen Muster von ARCH-45/49/51. Sie sind aber nicht RuntimeDeps selbst.

## M. `resolvePendingChoice` Detailaudit

Aktuell 319 LOC. Bereits ausgelagert oder delegiert:

- Hidden-Zone Arrange/NonSearch/Search.
- Corp-Zone Choices.
- Corp Install/Rez Sequence Choices.
- ScoredAgendaFlow Choices.
- Singapore/FortPass, Hammer-Stealth, Aardvark, SpeedTrap.
- Run-End, Encounter, Access Payment und Successful-Run Interventions.
- Trace-Phase-Choices sind fachlich noch lokal, aber klar abgegrenzt.

Verbleibende lokale Choice-Familien:

- Setup/Mulligan/Discard.
- Replacement/EventModification.
- Trace bidding.
- Runner program trash before install.
- einzelne Legacy-`v19xx`-Choices.
- Advancement distribution/move.
- Hosting/Incubator/Code Viral Cache.
- Private look and Microtech choices.

Nächster sicherer Choice-Schnitt wäre nicht die ganze Funktion, sondern eine residuale `pending-choice-dispatch.ts`-Boundary oder ein gezielter Trace-/Damage-Choice-Schnitt. Wegen PendingChoice source/kind/id ist das nur mit starker Regressionstestabdeckung sinnvoll.

## N. PublicContext/View-Audit

`public-context.ts` umfasst 1.804 LOC; `publicContextForAction` umfasst 1.744 LOC. Es gibt keine direkten `onr_v1_`-IDs in `public-context.ts`.

Bewertung:

- PublicContext ist ein Vertragsknoten für PublicPayload, PublicEvent, Replay, Chronik und Web.
- Ein Split wäre möglich, aber nicht der nächste beste Code-Schnitt.
- `game/view/card-view.ts` hat 967 LOC und produktive Direct-ID-Reste für bekannte View-Sonderfälle. Das ist ein späterer View-/PublicProjection-Schnitt mit Web-Risiko.

PublicContext/View sollte erst nach einem expliziten PublicPayload-/Chronicle-/Web-Gate geschnitten werden.

## O. Teststrukturstand

`index.test.ts`:

- LOC: 48.819
- `describe`: 86
- `it`/`test`: 596

Größte Tests:

| Testdatei | LOC |
| --- | ---: |
| `index.test.ts` | 48.819 |
| `card-implementations/definition-descriptors.test.ts` | 1.740 |
| `card-implementations/coverage.test.ts` | 1.184 |
| `game/run/run-end-cleanup.test.ts` | 715 |
| `game/damage/prevention.test.ts` | 657 |
| `game/run/successful-run-interventions.test.ts` | 641 |
| `game/view/hidden-info.test.ts` | 594 |
| `game/access/access-flow.test.ts` | 567 |

Modulnahe Tests sind inzwischen gut vertreten, besonders unter `game/run`, `game/access`, `game/corp`, `game/hidden-zone`, `game/view`, `game/damage` und `game/card-implementation`. `index.test.ts` bleibt trotzdem der größte Cross-Flow- und Replay-Schutz. Große Cross-Flow-Tests sollten vorerst bleiben, solange sie Hidden-Info, Replay, PublicPayload und end-to-end LegalAction/PlayerAction-Verträge schützen.

## P. Replay/PendingChoice/PublicPayload-Risiko

Hohe Risikozonen:

- PendingChoice `source`, `kind`, `id`, Options und Visibility.
- PublicPayload-Felder wie `hiddenZoneAction`, `specialZoneReason`, `encounterTaxSource`, `sourceDefinitionId`.
- RNG-Purpose und RandomCounter.
- Replay-kompatible Legacy-Action-Payloads.
- Web-Chronik und ActionBoard-Label-Auswertung.

Der ARCH-41-bis-52-Pfad war erfolgreich, weil er ActionIDs, Payloads, PendingChoice-Werte und PublicPayload unverändert gelassen hat. Diese Regel muss für die nächsten Schnitte bestehen bleiben.

## Q. Roadmap-Kandidaten

| Kandidat | Zielbereich | Erwartete `index.ts`-Reduktion | Risiko | Empfehlung |
| --- | --- | ---: | --- | --- |
| Main Action Generation Boundary | `corpMainActions`/`runnerMainActions` nach `game/turn`/`game/actions` | 700-1.200 LOC | mittel, überwiegend read-only | sofort |
| RuntimeDeps Query Adapter | reine RuntimeDeps-Target-/Count-Queries | 80-180 LOC | niedrig | später oder als Begleitpaket |
| RuntimeDeps Hidden-Zone Adapter | Search/Expose/Choice-Starter | 200-400 LOC | mittel bis hoch wegen PendingChoice | später mit Tests |
| RuntimeDeps Trace Family | `startTrace`, Trace sources, Trace choices | 150-300 LOC | hoch | später |
| RuntimeDeps Damage Family | Damage/Prevention/Replacement | 250-500 LOC | hoch | später |
| Install/Rez/Trash Boundary | `installCard`, `rezCard`, trash lifecycle | 400-800 LOC | hoch wegen payment/revalidation | später |
| PendingChoice Residual Boundary | `resolvePendingChoice` Restfamilien | 150-300 LOC | hoch wegen marker stability | später mit Marker-Gate |
| PublicContext/View Split | `public-context.ts`, `card-view.ts`, Web projection | 300-700 LOC | hoch wegen Web/PublicPayload | nicht jetzt |
| New-module internal split | Access/Run/Hidden-Zone Monolith-Kandidaten | 0 LOC in `index.ts` | niedrig bis mittel | erst nach `index.ts`-Restknoten |
| `performAction` Move | komplette Execution-Fassade | große Verlagerung, wenig Nettoqualität | sehr hoch | nicht |

## R. Empfehlung für nächsten ARCH-Schritt

Empfohlener nächster Code-Schnitt:

`ENGINE-ARCH-53-main-action-generation-boundary`

Ziel: Die read-only LegalAction-Erzeugung aus `corpMainActions` und `runnerMainActions` fachfamilienweise aus `index.ts` lösen, ohne `performAction`, `applyAction`, `installCard`, `rezCard`, Payment/Revalidation oder RuntimeDeps als Ganzes zu bewegen.

Begründung:

- Höchster klarer LOC-Nutzen nach ARCH-52: 1.482 LOC in zwei LegalAction-Buildern.
- Risiko niedriger als RuntimeDeps-/Payment-/Trace-/Damage-Migration.
- Passt zu bewährtem Muster aus ARCH-45, ARCH-49 und ARCH-51.
- Kann ActionIDs/Payloads/Reihenfolge fokussiert testen.
- Entlastet `index.ts`, ohne neue RuntimeDeps-Struktur zu erzwingen.

RuntimeDeps sollte danach nicht als Big-Bang, sondern in Adapter-Familien geschnitten werden. Der erste sinnvolle RuntimeDeps-Schnitt wäre ein reiner Query-Adapter oder ein Hidden-Zone-Adapter mit explizitem PendingChoice-Schutz.

## S. Nicht als nächstes machen

Nicht als nächstes sinnvoll:

- `performAction` oder `applyAction` als Ganzes bewegen.
- `cardImplementationRuntimeDeps` als Ganzes migrieren.
- Payment-/Rez-/Trace-/Damage-/Access-Engine neu modellieren.
- PublicPayload, PendingChoice, ActionID, HiddenZoneAction, SpecialZoneReason oder RNG-Purpose umbenennen.
- PublicContext/View ohne Web-/Chronicle-Gate splitten.
- Neue Fachmodule intern splitten, solange `index.ts` noch größere Restknoten enthält.
- CardImplementationRuntimeDeps global umformen oder Effect-Interpreter umbauen.

## T. Akzeptanzkriterien für späteren `performAction`-/`applyAction`-Move

Ein späterer `performAction`- oder `applyAction`-Move ist erst sinnvoll, wenn:

- `corpMainActions` und `runnerMainActions` nicht mehr inline in `index.ts` leben.
- `installCard` und `rezCard` mindestens in klare Host-Adapter oder Fachmodule geschnitten sind.
- Trace- und Damage-Choice-/Execution-Familien eigene Boundaries haben.
- `resolvePendingChoice` nur noch Dispatcher oder schmale Fassade ist.
- `cardImplementationRuntimeDeps` in fachliche Adaptergruppen zerlegt ist.
- PublicPayload-/Replay-/PendingChoice-Verträge durch fokussierte Tests abgesichert sind.
- `index.ts` hauptsächlich Hostbau, Clone/Validate, StateHash, Event-Endmontage und Wrapper-Exports enthält.

Vorher wäre ein Move technisch möglich, aber architektonisch nur ein Monolith-Transfer.

## U. Bekannte Risiken

- `index.test.ts` bleibt ein sehr großer Schutzwall; Teststrukturarbeit muss Cross-Flow-Schutz erhalten.
- Neue Run-/Access-/Hidden-Zone-Module sind fachlich kohärent, aber wachsen selbst.
- RuntimeDeps enthält viele mutierende Callbacks mit Payment, Hidden-Info, Random, Choice und Replay-Risiko.
- `apps/web/app/page.tsx`, `action-board-ui.ts` und `chronicle.ts` bleiben empfindlich gegenüber PublicPayload-/ActionLabel-Änderungen.
- Direct-ID-Reste in `mechanics/`, `compatibility/` und View/Corp-Fachmodulen sind bewusst, aber spätere Migrationen brauchen eigene Gates.

## V. Kurzfazit

ARCH-41 bis ARCH-52 haben `index.ts` real von 32.111 auf 22.191 LOC reduziert. Die Run-/Encounter-/Access-/Hidden-Zone-/CardImplementation-during-run-Entkopplung ist belastbar und testgestützt. `index.ts` ist aber weiterhin Host-/Engine-Monolith, nicht Fassade.

Der beste nächste Schritt ist kein RuntimeDeps-Big-Bang, sondern ein begrenzter LegalAction-Generation-Schnitt für `corpMainActions` und `runnerMainActions`. RuntimeDeps bleibt die zentrale technische Schuld, sollte aber erst nach einem Query-/Adapter-Plan und mit PendingChoice-/Replay-Schutz in Fachfamilien zerlegt werden.
