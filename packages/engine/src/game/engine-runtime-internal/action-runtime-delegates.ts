import { runtimeDelegates } from "./runtime-delegate-store";
import type {
  ActionRuntimePortFunction,
  ActionRuntimePortGroups,
} from "./runtime-port-contracts";

const typedRuntimePorts =
  runtimeDelegates as unknown as ActionRuntimePortGroups;

export const corpRunnerActionPaidWindowActions: ActionRuntimePortFunction<
  "actionRuntimeHosts",
  "corpRunnerActionPaidWindowActions"
> = (...args) =>
  typedRuntimePorts.actionRuntimeHosts.corpRunnerActionPaidWindowActions(
    ...args,
  );

export const specialZoneHarnessActions: ActionRuntimePortFunction<
  "actionRuntimeHosts",
  "specialZoneHarnessActions"
> = (...args) =>
  typedRuntimePorts.actionRuntimeHosts.specialZoneHarnessActions(...args);

export const turnBasicExecutionHost: ActionRuntimePortFunction<
  "actionRuntimeHosts",
  "turnBasicExecutionHost"
> = (...args) =>
  typedRuntimePorts.actionRuntimeHosts.turnBasicExecutionHost(...args);

export const creditEconomyExecutionHost: ActionRuntimePortFunction<
  "actionRuntimeHosts",
  "creditEconomyExecutionHost"
> = (...args) =>
  typedRuntimePorts.actionRuntimeHosts.creditEconomyExecutionHost(...args);

export const resolveEndTurnTagIfRunnerReceivedTag: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "resolveEndTurnTagIfRunnerReceivedTag"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.resolveEndTurnTagIfRunnerReceivedTag(
    ...args,
  );

export const resumeEndTurnAfterTagPrevention: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "resumeEndTurnAfterTagPrevention"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.resumeEndTurnAfterTagPrevention(
    ...args,
  );

export const resolveFieldReporterEndOfRunnerTurn: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "resolveFieldReporterEndOfRunnerTurn"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.resolveFieldReporterEndOfRunnerTurn(
    ...args,
  );

export const resolveDelayedEndTurnDamageEffects: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "resolveDelayedEndTurnDamageEffects"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.resolveDelayedEndTurnDamageEffects(
    ...args,
  );

export const endTurn: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "endTurn"
> = (...args) => typedRuntimePorts.turnRuntimeResolvers.endTurn(...args);

export const resolveTemporaryProgramInstallReturns: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "resolveTemporaryProgramInstallReturns"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.resolveTemporaryProgramInstallReturns(
    ...args,
  );

export const resolveCorpObligationEndOfTurn: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "resolveCorpObligationEndOfTurn"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.resolveCorpObligationEndOfTurn(
    ...args,
  );

export const startDiscardPhase: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "startDiscardPhase"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.startDiscardPhase(...args);

export const processDiscardStep: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "processDiscardStep"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.processDiscardStep(...args);

export const completeDiscardPhase: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "completeDiscardPhase"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.completeDiscardPhase(...args);

export const appendResolvedEffectsToPayload: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "appendResolvedEffectsToPayload"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.appendResolvedEffectsToPayload(
    ...args,
  );

export const automaticGainCreditsEffect: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "automaticGainCreditsEffect"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.automaticGainCreditsEffect(...args);

export const automaticLoseCreditsEffect: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "automaticLoseCreditsEffect"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.automaticLoseCreditsEffect(...args);

export const automaticDrawCardsEffect: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "automaticDrawCardsEffect"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.automaticDrawCardsEffect(...args);

export const automaticTagEffect: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "automaticTagEffect"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.automaticTagEffect(...args);

export const automaticTrashCardEffect: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "automaticTrashCardEffect"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.automaticTrashCardEffect(...args);

export const automaticCounterChangeEffect: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "automaticCounterChangeEffect"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.automaticCounterChangeEffect(...args);

export const automaticStealAgendaEffect: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "automaticStealAgendaEffect"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.automaticStealAgendaEffect(...args);

export const publicCardTitle: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "publicCardTitle"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.publicCardTitle(...args);

export const applyRunnerForgoNextAction: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "applyRunnerForgoNextAction"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.applyRunnerForgoNextAction(...args);

export const addRunnerFutureActionDebt: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "addRunnerFutureActionDebt"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.addRunnerFutureActionDebt(...args);

export const consumeRunnerFutureActionDebt: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "consumeRunnerFutureActionDebt"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.consumeRunnerFutureActionDebt(...args);

export const filterActionsForRestrictedExtraActions: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "filterActionsForRestrictedExtraActions"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.filterActionsForRestrictedExtraActions(
    ...args,
  );

export const consumeRestrictedExtraActionForAction: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "consumeRestrictedExtraActionForAction"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.consumeRestrictedExtraActionForAction(
    ...args,
  );

export const acceptExtraActionOffer: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "acceptExtraActionOffer"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.acceptExtraActionOffer(...args);

export const declineExtraActionOffer: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "declineExtraActionOffer"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.declineExtraActionOffer(...args);

export const resolvePdcaCounterAction: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "resolvePdcaCounterAction"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.resolvePdcaCounterAction(...args);

export const resolveForcedActionNotPossible: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "resolveForcedActionNotPossible"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.resolveForcedActionNotPossible(
    ...args,
  );

export const startCorpTurn: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "startCorpTurn"
> = (...args) => typedRuntimePorts.turnRuntimeResolvers.startCorpTurn(...args);

export const startRunnerTurn: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "startRunnerTurn"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.startRunnerTurn(...args);

export const resumeStartOfTurnAfterTagPrevention: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "resumeStartOfTurnAfterTagPrevention"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.resumeStartOfTurnAfterTagPrevention(
    ...args,
  );

export const untapRunnerCardsAtTurnStart: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "untapRunnerCardsAtTurnStart"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.untapRunnerCardsAtTurnStart(...args);

export const resolveDelayedAccessEffects: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "resolveDelayedAccessEffects"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.resolveDelayedAccessEffects(...args);

export const applyCorpStartOfTurnEffects: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "applyCorpStartOfTurnEffects"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.applyCorpStartOfTurnEffects(...args);

export const applyPurgeableRunnerVirusCorpStartEffects: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "applyPurgeableRunnerVirusCorpStartEffects"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.applyPurgeableRunnerVirusCorpStartEffects(
    ...args,
  );

export const virusCounterDrawsAtCorpStart: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "virusCounterDrawsAtCorpStart"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.virusCounterDrawsAtCorpStart(...args);

export const skivvissCounterTotal: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "skivvissCounterTotal"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.skivvissCounterTotal(...args);

export const virusCounterCascadeTrashAtCorpStart: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "virusCounterCascadeTrashAtCorpStart"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.virusCounterCascadeTrashAtCorpStart(
    ...args,
  );

export const trashFaceupRdCardsForCascade: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "trashFaceupRdCardsForCascade"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.trashFaceupRdCardsForCascade(...args);

export const applyRunnerStartOfTurnEffects: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "applyRunnerStartOfTurnEffects"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.applyRunnerStartOfTurnEffects(...args);

export const applyStartTurnRandomEffectTables: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "applyStartTurnRandomEffectTables"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.applyStartTurnRandomEffectTables(
    ...args,
  );

export const virusCounterCreditsAtRunnerStart: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "virusCounterCreditsAtRunnerStart"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.virusCounterCreditsAtRunnerStart(
    ...args,
  );

export const startVirusCounterRunnerPrivateLookAtStart: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "startVirusCounterRunnerPrivateLookAtStart"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.startVirusCounterRunnerPrivateLookAtStart(
    ...args,
  );

export const randomCorpHqCardsWithoutReplacement: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "randomCorpHqCardsWithoutReplacement"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.randomCorpHqCardsWithoutReplacement(
    ...args,
  );

export const startRunnerPrivateLookAtSpecificCorpCards: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "startRunnerPrivateLookAtSpecificCorpCards"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.startRunnerPrivateLookAtSpecificCorpCards(
    ...args,
  );

export const queueIncubatorStartOfTurnTransforms: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "queueIncubatorStartOfTurnTransforms"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.queueIncubatorStartOfTurnTransforms(
    ...args,
  );

export const startIncubatorTransformChoice: ActionRuntimePortFunction<
  "turnRuntimeResolvers",
  "startIncubatorTransformChoice"
> = (...args) =>
  typedRuntimePorts.turnRuntimeResolvers.startIncubatorTransformChoice(...args);

export const forfeitRunnerAgendaForPointCost: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "forfeitRunnerAgendaForPointCost"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.forfeitRunnerAgendaForPointCost(
    ...args,
  );

export const forfeitCorpAgendaForPointCost: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "forfeitCorpAgendaForPointCost"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.forfeitCorpAgendaForPointCost(...args);

export const activeObligationCount: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "activeObligationCount"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.activeObligationCount(...args);

export const addActiveObligation: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "addActiveObligation"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.addActiveObligation(...args);

export const removeActiveObligation: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "removeActiveObligation"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.removeActiveObligation(...args);

export const spendCorpAgendaPointCost: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "spendCorpAgendaPointCost"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.spendCorpAgendaPointCost(...args);

export const installedAgendaOperationTarget: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "installedAgendaOperationTarget"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.installedAgendaOperationTarget(
    ...args,
  );

export const corpAgendaCounterOperationTarget: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "corpAgendaCounterOperationTarget"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.corpAgendaCounterOperationTarget(
    ...args,
  );

export const corpScoredAgendaForfeitTargets: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "corpScoredAgendaForfeitTargets"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.corpScoredAgendaForfeitTargets(
    ...args,
  );

export const hardwareTrashByCounterEligibleHardwareIds: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "hardwareTrashByCounterEligibleHardwareIds"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.hardwareTrashByCounterEligibleHardwareIds(
    ...args,
  );

export const hardwareTrashByCounterLegalActions: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "hardwareTrashByCounterLegalActions"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.hardwareTrashByCounterLegalActions(
    ...args,
  );

export const hardwareTrashByCounterTrashCountFromPayload: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "hardwareTrashByCounterTrashCountFromPayload"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.hardwareTrashByCounterTrashCountFromPayload(
    ...args,
  );

export const resolveHardwareTrashByCounterOperation: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "resolveHardwareTrashByCounterOperation"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.resolveHardwareTrashByCounterOperation(
    ...args,
  );

export const startHardwareTrashByCounterChoice: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "startHardwareTrashByCounterChoice"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.startHardwareTrashByCounterChoice(
    ...args,
  );

export const hardwareTrashByCounterTrashCountFromChoiceSource: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "hardwareTrashByCounterTrashCountFromChoiceSource"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.hardwareTrashByCounterTrashCountFromChoiceSource(
    ...args,
  );

export const resolveHardwareTrashByCounterChoice: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "resolveHardwareTrashByCounterChoice"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.resolveHardwareTrashByCounterChoice(
    ...args,
  );

export const trashHardwareByCounter: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "trashHardwareByCounter"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.trashHardwareByCounter(...args);

export const advancementPlacementLegalActions: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "advancementPlacementLegalActions"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.advancementPlacementLegalActions(
    ...args,
  );

export const resolveAgendaCounterOperation: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "resolveAgendaCounterOperation"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.resolveAgendaCounterOperation(...args);

export const resolveAdvancementPlacementOperation: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "resolveAdvancementPlacementOperation"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.resolveAdvancementPlacementOperation(
    ...args,
  );

export const advancementPlacementOptions: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "advancementPlacementOptions"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.advancementPlacementOptions(...args);

export const startAdvancementPlacementChoice: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "startAdvancementPlacementChoice"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.startAdvancementPlacementChoice(
    ...args,
  );

export const resolveAdvancementPlacementChoice: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "resolveAdvancementPlacementChoice"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.resolveAdvancementPlacementChoice(
    ...args,
  );

export const applyAdvancementCounterPlacement: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "applyAdvancementCounterPlacement"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.applyAdvancementCounterPlacement(
    ...args,
  );

export const advanceableInstalledCardTargets: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "advanceableInstalledCardTargets"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.advanceableInstalledCardTargets(
    ...args,
  );

export const isInstalledCorpCardAdvanceable: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "isInstalledCorpCardAdvanceable"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.isInstalledCorpCardAdvanceable(
    ...args,
  );

export const advancementDistributionOptions: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "advancementDistributionOptions"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.advancementDistributionOptions(
    ...args,
  );

export const startCardImplementationAdvancementDistributionChoice: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "startCardImplementationAdvancementDistributionChoice"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.startCardImplementationAdvancementDistributionChoice(
    ...args,
  );

export const parseAdvancementDistributionValue: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "parseAdvancementDistributionValue"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.parseAdvancementDistributionValue(
    ...args,
  );

export const sourcePartsForP334Choice: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "sourcePartsForP334Choice"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.sourcePartsForP334Choice(...args);

export const validateAdvancementDistribution: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "validateAdvancementDistribution"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.validateAdvancementDistribution(
    ...args,
  );

export const resolveCardImplementationAdvancementDistributionChoice: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "resolveCardImplementationAdvancementDistributionChoice"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.resolveCardImplementationAdvancementDistributionChoice(
    ...args,
  );

export const movableAdvancementSourceIds: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "movableAdvancementSourceIds"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.movableAdvancementSourceIds(...args);

export const moveAdvancementOptions: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "moveAdvancementOptions"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.moveAdvancementOptions(...args);

export const startCardImplementationMoveAdvancementChoice: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "startCardImplementationMoveAdvancementChoice"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.startCardImplementationMoveAdvancementChoice(
    ...args,
  );

export const resolveCardImplementationMoveAdvancementChoice: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "resolveCardImplementationMoveAdvancementChoice"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.resolveCardImplementationMoveAdvancementChoice(
    ...args,
  );

export const resolveCorpOperationAddAdvancementCounters: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "resolveCorpOperationAddAdvancementCounters"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.resolveCorpOperationAddAdvancementCounters(
    ...args,
  );

export const awardRunnerEventAgendaPoint: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "awardRunnerEventAgendaPoint"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.awardRunnerEventAgendaPoint(...args);

export const choiceAction: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "choiceAction"
> = (...args) => typedRuntimePorts.corpRuntimeResolvers.choiceAction(...args);

export const abilityMetadata: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "abilityMetadata"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.abilityMetadata(...args);

export const resolveCorpInstalledEconomyAction: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "resolveCorpInstalledEconomyAction"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.resolveCorpInstalledEconomyAction(
    ...args,
  );

export const validateCorpInstalledEconomyAction: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "validateCorpInstalledEconomyAction"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.validateCorpInstalledEconomyAction(
    ...args,
  );

export const rezzedCorpInstalledEconomyCreditSourceIds: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "rezzedCorpInstalledEconomyCreditSourceIds"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.rezzedCorpInstalledEconomyCreditSourceIds(
    ...args,
  );

export const shouldOpenCorpInstalledEconomyCreditChoice: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "shouldOpenCorpInstalledEconomyCreditChoice"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.shouldOpenCorpInstalledEconomyCreditChoice(
    ...args,
  );

export const startCorpInstalledEconomyCreditChoice: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "startCorpInstalledEconomyCreditChoice"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.startCorpInstalledEconomyCreditChoice(
    ...args,
  );

export const resolveCorpInstalledEconomyCreditChoice: ActionRuntimePortFunction<
  "corpRuntimeResolvers",
  "resolveCorpInstalledEconomyCreditChoice"
> = (...args) =>
  typedRuntimePorts.corpRuntimeResolvers.resolveCorpInstalledEconomyCreditChoice(
    ...args,
  );

export const corpInstallRezSequenceHandlerHost: ActionRuntimePortFunction<
  "actionRuntimeHosts",
  "corpInstallRezSequenceHandlerHost"
> = (...args) =>
  typedRuntimePorts.actionRuntimeHosts.corpInstallRezSequenceHandlerHost(
    ...args,
  );

export const scoredAgendaFlowHost: ActionRuntimePortFunction<
  "actionRuntimeHosts",
  "scoredAgendaFlowHost"
> = (...args) =>
  typedRuntimePorts.actionRuntimeHosts.scoredAgendaFlowHost(...args);

export const scoredAgendaAbilityHost: ActionRuntimePortFunction<
  "actionRuntimeHosts",
  "scoredAgendaAbilityHost"
> = (...args) =>
  typedRuntimePorts.actionRuntimeHosts.scoredAgendaAbilityHost(...args);

export const corpTraceDamageAbilityHost: ActionRuntimePortFunction<
  "actionRuntimeHosts",
  "corpTraceDamageAbilityHost"
> = (...args) =>
  typedRuntimePorts.actionRuntimeHosts.corpTraceDamageAbilityHost(...args);

export const corpSpecialDamageAbilityHost: ActionRuntimePortFunction<
  "actionRuntimeHosts",
  "corpSpecialDamageAbilityHost"
> = (...args) =>
  typedRuntimePorts.actionRuntimeHosts.corpSpecialDamageAbilityHost(...args);

export const playCardExecutionHost: ActionRuntimePortFunction<
  "actionRuntimeHosts",
  "playCardExecutionHost"
> = (...args) =>
  typedRuntimePorts.actionRuntimeHosts.playCardExecutionHost(...args);

export const corpOperationResolutionHost: ActionRuntimePortFunction<
  "actionRuntimeHosts",
  "corpOperationResolutionHost"
> = (...args) =>
  typedRuntimePorts.actionRuntimeHosts.corpOperationResolutionHost(...args);

export const boardStateActionExecutionHost: ActionRuntimePortFunction<
  "actionRuntimeHosts",
  "boardStateActionExecutionHost"
> = (...args) =>
  typedRuntimePorts.actionRuntimeHosts.boardStateActionExecutionHost(...args);

export const hasHiddenResourceAccessStartActions: ActionRuntimePortFunction<
  "actionRuntimeHosts",
  "hasHiddenResourceAccessStartActions"
> = (...args) =>
  typedRuntimePorts.actionRuntimeHosts.hasHiddenResourceAccessStartActions(
    ...args,
  );

export const pushCorpTraceDamageOrCardImplementationActions: ActionRuntimePortFunction<
  "actionRuntimeHosts",
  "pushCorpTraceDamageOrCardImplementationActions"
> = (...args) =>
  typedRuntimePorts.actionRuntimeHosts.pushCorpTraceDamageOrCardImplementationActions(
    ...args,
  );
