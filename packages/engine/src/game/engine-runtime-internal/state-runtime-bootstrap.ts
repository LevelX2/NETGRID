import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { type GameState, type LegalAction, type PlayerAction } from "@netgrid/shared";
import { rezCostForCard } from "../payment";
import { selectedChoiceIds } from "../choices/choice-validation";
import {
  corpInstalledCardIds,
  corpRootMainCardIdsInServer,
  definitionFor,
  mustInstance,
  mustServer,
  runnerInstalledCardIds,
} from "../state/card-server-lookup";
import {
  drawCorpCards,
  rollDeterministicDie,
  shuffleStateIds,
  mustArrayValue,
  nextRandom,
  recordStateRandomMarkers,
} from "../state/draw-random";
import { credits, spendCredits } from "../state/economy-mutation";
import {
  addCardCounter,
  cardCounter,
  clearCardCounters,
  ensureRunnerTurnFlags,
  hasSuccessfulHqRunThisTurn,
  setCardCounter,
  spendCardCounter,
} from "../state/turn-flags-counters";
import { hostedCardsOn, removeFromAllZones, setHostedOn } from "../state/zone-mutation";
import { type LegalActionHostComposition } from "../legal-action-hosts";
import { resolveTraceChoice } from "../trace/trace-orchestration";
import { type MainActionHostComposition } from "../turn/main-action-hosts";
import {
  resolveDelayedInstallPlacementChoice,
  resolveDelayedInstallStartTurnChoice,
} from "../abilities/runner-special-trigger-execution";
import {
  addRunnerTagsWithPrevention,
  resolveEventModificationChoice,
  resolvePdcaDamageReplacementChoice,
  resolveReplacementChoice,
  type DamageCoreHost,
} from "../damage/damage-core";
import {
  lookTopStackShowToCorpThenInstallMatchingTargets,
  searchStackInstallTargets,
  temporaryProgramInstallableProgramIds,
  startAujourdOuiTop5Activation,
  startRunnerStackSearchChoiceActivation,
} from "../hidden-zone/search-choice-activations";
import { handleHiddenZoneSearchChoice } from "../hidden-zone/search-choice-handlers";
import {
  handleHiddenZoneArrangeChoice,
  startRunnerStackArrangeChoice,
} from "../hidden-zone/arrange-choice-handlers";
import { handleHiddenZoneNonSearchChoice } from "../hidden-zone/nonsearch-choice-handlers";
import { handleCorpZoneChoice } from "../hidden-zone/corp-zone-choice-handlers";
import { handleCorpInstallRezSequenceChoice } from "../corp/install-rez-sequence-handlers";
import { handleScoredAgendaFlowChoice } from "../corp/scored-agenda-flow";
import {
  resolveAccessInstalledRunnerProgramReturnChoice,
  resolveAccessPaymentChoice,
} from "../access/access-effect-handlers";
import {
  resolvePreAccessTopRdReorderChoice,
  resolveRevealRdUntilAgendaStoreInHqChoice,
  resolveSuccessfulRunCreditLossSpendChoice,
} from "../run/run-access-transition";
import { resolveSuccessfulRunInterventionChoice as resolveSuccessfulRunInterventionChoiceInRunModule } from "../run/successful-run-interventions";
import { resolveBrokenIceVirusCounterChoice } from "../run/run-end-cleanup";
import { shouldLoadLegacyRecurringCredits } from "../run/run-duration-payment";
import {
  resolvePassRezzedIceProgramTrashChoice as resolvePassRezzedIceProgramTrashChoiceInRunModule,
  resolveActiveIceProgramTrashChoice as resolveActiveIceProgramTrashChoiceInRunModule,
} from "../run/encounter-resolution";
import { resolveSecretSpendCompareChoice as resolveSecretSpendCompareChoiceInRunModule } from "../run/encounter-special-windows";
import { type GameCardImplementationRuntimeDepsHost } from "../card-implementation/card-implementation-runtime-deps";
import type { CardImplementationRuntimeDependencies } from "../../ability-engine/card-implementation-runtime";
import type { CardImplementationEffectAdapters } from "../../ability-engine/card-implementation-effect-adapters";
import { type HiddenZoneRuntimeDepsHost } from "../card-implementation/hidden-zone-runtime-deps";
import { type InstallRezRuntimeDepsHost } from "../card-implementation/install-rez-runtime-deps";
import { type CounterLifecycleRuntimeDepsHost } from "../card-implementation/counter-lifecycle-runtime-deps";
import { type TraceRuntimeDepsHost } from "../card-implementation/trace-runtime-deps";
import { resolveRezInterruptJackOutChoice } from "../run/run-rez-window";
import { resolveHqIceSwapChoice } from "../run/fort-pass-window";
import {
  resolveAardvarkInterceptionChoice,
  resolveHammerStealthLossChoice,
} from "../run/fort-run-side-families";
import { type RunAccessLegalActionHostComposition } from "../run/run-access-legal-action-hosts";
import { shuffleRunnerStackAndRefreshZones } from "../hidden-zone/runner-stack-shuffle";
import { type ApplyActionHostCompositionHost } from "../apply/apply-action-hosts";
import { maxHandSize, runnerMemoryLimit } from "../../ability-engine/effective-values";
import { publicServerLabel, publicServerLabelForCard } from "../view/server-view";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { isHiddenZoneChoiceSource } from "../hidden-zone/choice-sources";
import { executeCardImplementationEffects } from "../../ability-engine/effect-interpreter";
import { executeCardImplementationLifecycleEffects } from "../../ability-engine/card-implementation-runtime";

import {
  DEFAULT_CONTROLLERS,
  INITIAL_HAND_SIZE,
  agendaPointsForScoredCard,
  cardImplementationAgendaPointInstallCost,
  drawTaxSourceIds,
  corpScoredBlackOpsAgendaLastTurn,
  corpTracePaymentDeps,
  effectiveAgendaDifficultyDeps,
  finishRun,
  handForSide,
  hasCardImplementationMemoryUnitModifier,
  recurringTraceCreditPoolSourceIds,
  recurringTraceCreditPoolTotal,
  pickRunnerAgendaForAgendaPointCost,
  privateLookCardIds,
  requireRunnerTagged,
  resolveRunnerLastTurnInstalledResourceTargetId,
  runnerInstalledHardwareTrashTarget,
  runnerInstalledResourceLastTurn,
  runnerLastTurnInstalledResourceIds,
  runnerRunAttemptsLastTurn,
  runnerRunAttemptsThisGame,
  runnerStoleAgendaLastTurn,
  runnerStoleAgendaSubtypeThisTurn,
  runnerStolenAgendaAdvancementCountersLastTurn,
  runnerTracePaymentDeps,
  runnerTrashedNodeLastTurn,
  sanitizeId,
  spendAgendaPointFromScoredCard,
} from "./runtime-bootstrap-support";
export function initializeStateRuntimeBootstrap(
  {
    cardImplementationRuntimeDeps,
    cardImplementationEffectAdapters,
    hiddenZoneRuntimeDepsHost,
    traceRuntimeDepsHost,
    installRezRuntimeDepsHost,
    counterLifecycleRuntimeDepsHost,
    gameCardImplementationRuntimeDepsHost,
    resolveFortHqReplacementChoice,
    resolveSenatorialFieldTripChoice,
    runAccessLegalActionHostComposition,
    runFlow,
    accessFlow,
    damageCoreHost,
    mainActionHostComposition,
    legalActionHostComposition,
    applyActionHostComposition,
  }: {
    cardImplementationRuntimeDeps: CardImplementationRuntimeDependencies;
    cardImplementationEffectAdapters: CardImplementationEffectAdapters;
    hiddenZoneRuntimeDepsHost: () => HiddenZoneRuntimeDepsHost;
    traceRuntimeDepsHost: () => TraceRuntimeDepsHost;
    installRezRuntimeDepsHost: () => InstallRezRuntimeDepsHost;
    counterLifecycleRuntimeDepsHost: () => CounterLifecycleRuntimeDepsHost;
    gameCardImplementationRuntimeDepsHost: () => GameCardImplementationRuntimeDepsHost;
    resolveFortHqReplacementChoice: (
      state: GameState,
      legalAction: LegalAction,
      playerAction: PlayerAction,
    ) => void;
    resolveSenatorialFieldTripChoice: (
      state: GameState,
      legalAction: LegalAction,
      playerAction: PlayerAction,
    ) => void;
    runAccessLegalActionHostComposition: RunAccessLegalActionHostComposition;
    runFlow: RunAccessLegalActionHostComposition["runFlow"];
    accessFlow: RunAccessLegalActionHostComposition["accessFlow"];
    damageCoreHost: DamageCoreHost;
    mainActionHostComposition: MainActionHostComposition;
    legalActionHostComposition: LegalActionHostComposition;
    applyActionHostComposition: ApplyActionHostCompositionHost;
  },
  runtimeDomainTarget: object,
) {
  const runtimeDomainDeps = {
    CARD_DEFINITIONS_BY_ID,
    INITIAL_HAND_SIZE,
    addCardCounter,
    agendaPointsForScoredCard,
    cardCounter,
    cardImplementationForDefinitionId,
    cardImplementationRuntimeDeps,
    drawTaxSourceIds,
    clearCardCounters,
    corpInstalledCardIds,
    corpRootMainCardIdsInServer,
    definitionFor,
    drawCorpCards,
    ensureRunnerTurnFlags,
    executeCardImplementationEffects,
    executeCardImplementationLifecycleEffects,
    handForSide,
    handleCorpInstallRezSequenceChoice,
    handleCorpZoneChoice,
    handleHiddenZoneArrangeChoice,
    handleHiddenZoneNonSearchChoice,
    handleHiddenZoneSearchChoice,
    handleScoredAgendaFlowChoice,
    hasCardImplementationMemoryUnitModifier,
    hasSuccessfulHqRunThisTurn,
    hostedCardsOn,
    isHiddenZoneChoiceSource,
    lookTopStackShowToCorpThenInstallMatchingTargets,
    maxHandSize,
    mustArrayValue,
    mustServer,
    nextRandom,
    publicServerLabel,
    publicServerLabelForCard,
    recordStateRandomMarkers,
    removeFromAllZones,
    resolveAardvarkInterceptionChoice,
    resolveAccessInstalledRunnerProgramReturnChoice,
    resolveAccessPaymentChoice,
    resolveEventModificationChoice,
    resolveFortHqReplacementChoice,
    resolveHammerStealthLossChoice,
    resolvePdcaDamageReplacementChoice,
    resolvePreAccessTopRdReorderChoice,
    resolveRevealRdUntilAgendaStoreInHqChoice,
    resolvePassRezzedIceProgramTrashChoiceInRunModule,
    resolveBrokenIceVirusCounterChoice,
    resolveSuccessfulRunCreditLossSpendChoice,
    resolveReplacementChoice,
    resolveDelayedInstallPlacementChoice,
    resolveDelayedInstallStartTurnChoice,
    resolveSenatorialFieldTripChoice,
    resolveHqIceSwapChoice,
    resolveRezInterruptJackOutChoice,
    resolveSuccessfulRunInterventionChoiceInRunModule,
    resolveSecretSpendCompareChoiceInRunModule,
    resolveTraceChoice,
    resolveActiveIceProgramTrashChoiceInRunModule,
    rezCostForCard,
    rollDeterministicDie,
    runnerInstalledCardIds,
    runnerMemoryLimit,
    runnerStoleAgendaSubtypeThisTurn,
    sanitizeId,
    searchStackInstallTargets,
    selectedChoiceIds,
    setCardCounter,
    setHostedOn,
    shouldLoadLegacyRecurringCredits,
    shuffleRunnerStackAndRefreshZones,
    shuffleStateIds,
    temporaryProgramInstallableProgramIds,
    spendCardCounter,
    spendCredits,
    startAujourdOuiTop5Activation,
    startRunnerStackArrangeChoice,
    startRunnerStackSearchChoiceActivation,
    mustInstance,
    credits,
    DEFAULT_CONTROLLERS,
    accessFlow,
    addRunnerTagsWithPrevention,
    applyActionHostComposition,
    cardImplementationAgendaPointInstallCost,
    cardImplementationEffectAdapters,
    corpScoredBlackOpsAgendaLastTurn,
    corpTracePaymentDeps,
    counterLifecycleRuntimeDepsHost,
    damageCoreHost,
    effectiveAgendaDifficultyDeps,
    finishRun,
    gameCardImplementationRuntimeDepsHost,
    hiddenZoneRuntimeDepsHost,
    installRezRuntimeDepsHost,
    recurringTraceCreditPoolSourceIds,
    recurringTraceCreditPoolTotal,
    legalActionHostComposition,
    mainActionHostComposition,
    pickRunnerAgendaForAgendaPointCost,
    privateLookCardIds,
    requireRunnerTagged,
    resolveRunnerLastTurnInstalledResourceTargetId,
    runAccessLegalActionHostComposition,
    runFlow,
    runnerInstalledHardwareTrashTarget,
    runnerInstalledResourceLastTurn,
    runnerLastTurnInstalledResourceIds,
    runnerRunAttemptsLastTurn,
    runnerRunAttemptsThisGame,
    runnerStoleAgendaLastTurn,
    runnerStolenAgendaAdvancementCountersLastTurn,
    runnerTracePaymentDeps,
    runnerTrashedNodeLastTurn,
    spendAgendaPointFromScoredCard,
    traceRuntimeDepsHost,
  };

  Object.assign(runtimeDomainTarget, runtimeDomainDeps);

  return runtimeDomainDeps;
}
