import { runtimeDelegate } from "./runtime-delegate-store";

export function corpRunnerActionPaidWindowActions(...args: any[]): any {
  return runtimeDelegate(
    "actionRuntimeHosts",
    "corpRunnerActionPaidWindowActions",
  )(...args);
}

export function specialZoneHarnessActions(...args: any[]): any {
  return runtimeDelegate(
    "actionRuntimeHosts",
    "specialZoneHarnessActions",
  )(...args);
}

export function turnBasicExecutionHost(...args: any[]): any {
  return runtimeDelegate(
    "actionRuntimeHosts",
    "turnBasicExecutionHost",
  )(...args);
}

export function creditEconomyExecutionHost(...args: any[]): any {
  return runtimeDelegate(
    "actionRuntimeHosts",
    "creditEconomyExecutionHost",
  )(...args);
}

export function resolveEndTurnTagIfRunnerReceivedTag(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "resolveEndTurnTagIfRunnerReceivedTag",
  )(...args);
}

export function resolveFieldReporterEndOfRunnerTurn(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "resolveFieldReporterEndOfRunnerTurn",
  )(...args);
}

export function resolveDelayedEndTurnDamageEffects(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "resolveDelayedEndTurnDamageEffects",
  )(...args);
}

export function endTurn(...args: any[]): any {
  return runtimeDelegate("turnRuntimeResolvers", "endTurn")(...args);
}

export function resolveTemporaryProgramInstallReturns(
  ...args: any[]
): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "resolveTemporaryProgramInstallReturns",
  )(...args);
}

export function resolveCorpObligationEndOfTurn(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "resolveCorpObligationEndOfTurn",
  )(...args);
}

export function startDiscardPhase(...args: any[]): any {
  return runtimeDelegate("turnRuntimeResolvers", "startDiscardPhase")(...args);
}

export function processDiscardStep(...args: any[]): any {
  return runtimeDelegate("turnRuntimeResolvers", "processDiscardStep")(...args);
}

export function completeDiscardPhase(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "completeDiscardPhase",
  )(...args);
}

export function appendResolvedEffectsToPayload(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "appendResolvedEffectsToPayload",
  )(...args);
}

export function automaticGainCreditsEffect(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "automaticGainCreditsEffect",
  )(...args);
}

export function automaticLoseCreditsEffect(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "automaticLoseCreditsEffect",
  )(...args);
}

export function automaticDrawCardsEffect(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "automaticDrawCardsEffect",
  )(...args);
}

export function automaticTagEffect(...args: any[]): any {
  return runtimeDelegate("turnRuntimeResolvers", "automaticTagEffect")(...args);
}

export function automaticTrashCardEffect(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "automaticTrashCardEffect",
  )(...args);
}

export function automaticCounterChangeEffect(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "automaticCounterChangeEffect",
  )(...args);
}

export function automaticStealAgendaEffect(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "automaticStealAgendaEffect",
  )(...args);
}

export function publicCardTitle(...args: any[]): any {
  return runtimeDelegate("turnRuntimeResolvers", "publicCardTitle")(...args);
}

export function applyRunnerForgoNextAction(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "applyRunnerForgoNextAction",
  )(...args);
}

export function addRunnerFutureActionDebt(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "addRunnerFutureActionDebt",
  )(...args);
}

export function consumeRunnerFutureActionDebt(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "consumeRunnerFutureActionDebt",
  )(...args);
}

export function filterActionsForRestrictedExtraActions(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "filterActionsForRestrictedExtraActions",
  )(...args);
}

export function consumeRestrictedExtraActionForAction(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "consumeRestrictedExtraActionForAction",
  )(...args);
}

export function acceptExtraActionOffer(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "acceptExtraActionOffer",
  )(...args);
}

export function declineExtraActionOffer(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "declineExtraActionOffer",
  )(...args);
}

export function resolvePdcaCounterAction(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "resolvePdcaCounterAction",
  )(...args);
}

export function resolveForcedActionNotPossible(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "resolveForcedActionNotPossible",
  )(...args);
}

export function startCorpTurn(...args: any[]): any {
  return runtimeDelegate("turnRuntimeResolvers", "startCorpTurn")(...args);
}

export function startRunnerTurn(...args: any[]): any {
  return runtimeDelegate("turnRuntimeResolvers", "startRunnerTurn")(...args);
}

export function untapRunnerCardsAtTurnStart(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "untapRunnerCardsAtTurnStart",
  )(...args);
}

export function resolveDelayedAccessEffects(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "resolveDelayedAccessEffects",
  )(...args);
}

export function applyCorpStartOfTurnEffects(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "applyCorpStartOfTurnEffects",
  )(...args);
}

export function applyPurgeableRunnerVirusCorpStartEffects(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "applyPurgeableRunnerVirusCorpStartEffects",
  )(...args);
}

export function virusCounterDrawsAtCorpStart(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "virusCounterDrawsAtCorpStart",
  )(...args);
}

export function skivvissCounterTotal(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "skivvissCounterTotal",
  )(...args);
}

export function virusCounterCascadeTrashAtCorpStart(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "virusCounterCascadeTrashAtCorpStart",
  )(...args);
}

export function trashFaceupRdCardsForCascade(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "trashFaceupRdCardsForCascade",
  )(...args);
}

export function applyRunnerStartOfTurnEffects(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "applyRunnerStartOfTurnEffects",
  )(...args);
}

export function applyStartTurnRandomEffectTables(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "applyStartTurnRandomEffectTables",
  )(...args);
}

export function virusCounterCreditsAtRunnerStart(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "virusCounterCreditsAtRunnerStart",
  )(...args);
}

export function startVirusCounterRunnerPrivateLookAtStart(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "startVirusCounterRunnerPrivateLookAtStart",
  )(...args);
}

export function randomCorpHqCardsWithoutReplacement(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "randomCorpHqCardsWithoutReplacement",
  )(...args);
}

export function startRunnerPrivateLookAtSpecificCorpCards(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "startRunnerPrivateLookAtSpecificCorpCards",
  )(...args);
}

export function queueIncubatorStartOfTurnTransforms(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "queueIncubatorStartOfTurnTransforms",
  )(...args);
}

export function startIncubatorTransformChoice(...args: any[]): any {
  return runtimeDelegate(
    "turnRuntimeResolvers",
    "startIncubatorTransformChoice",
  )(...args);
}

export function forfeitRunnerAgendaForPointCost(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "forfeitRunnerAgendaForPointCost",
  )(...args);
}

export function forfeitCorpAgendaForPointCost(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "forfeitCorpAgendaForPointCost",
  )(...args);
}

export function activeObligationCount(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "activeObligationCount",
  )(...args);
}

export function addActiveObligation(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "addActiveObligation",
  )(...args);
}

export function removeActiveObligation(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "removeActiveObligation",
  )(...args);
}

export function spendCorpAgendaPointCost(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "spendCorpAgendaPointCost",
  )(...args);
}

export function installedAgendaOperationTarget(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "installedAgendaOperationTarget",
  )(...args);
}

export function corpAgendaCounterOperationTarget(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "corpAgendaCounterOperationTarget",
  )(...args);
}

export function corpScoredAgendaForfeitTargets(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "corpScoredAgendaForfeitTargets",
  )(...args);
}

export function hardwareTrashByCounterEligibleHardwareIds(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "hardwareTrashByCounterEligibleHardwareIds",
  )(...args);
}

export function hardwareTrashByCounterLegalActions(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "hardwareTrashByCounterLegalActions",
  )(...args);
}

export function hardwareTrashByCounterTrashCountFromPayload(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "hardwareTrashByCounterTrashCountFromPayload",
  )(...args);
}

export function resolveHardwareTrashByCounterOperation(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "resolveHardwareTrashByCounterOperation",
  )(...args);
}

export function startHardwareTrashByCounterChoice(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "startHardwareTrashByCounterChoice",
  )(...args);
}

export function hardwareTrashByCounterTrashCountFromChoiceSource(
  ...args: any[]
): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "hardwareTrashByCounterTrashCountFromChoiceSource",
  )(...args);
}

export function resolveHardwareTrashByCounterChoice(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "resolveHardwareTrashByCounterChoice",
  )(...args);
}

export function trashHardwareByCounter(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "trashHardwareByCounter",
  )(...args);
}

export function advancementPlacementLegalActions(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "advancementPlacementLegalActions",
  )(...args);
}

export function resolveAgendaCounterOperation(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "resolveAgendaCounterOperation",
  )(...args);
}

export function resolveAdvancementPlacementOperation(
  ...args: any[]
): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "resolveAdvancementPlacementOperation",
  )(...args);
}

export function advancementPlacementOptions(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "advancementPlacementOptions",
  )(...args);
}

export function startAdvancementPlacementChoice(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "startAdvancementPlacementChoice",
  )(...args);
}

export function resolveAdvancementPlacementChoice(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "resolveAdvancementPlacementChoice",
  )(...args);
}

export function applyAdvancementCounterPlacement(
  ...args: any[]
): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "applyAdvancementCounterPlacement",
  )(...args);
}

export function advanceableInstalledCardTargets(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "advanceableInstalledCardTargets",
  )(...args);
}

export function isInstalledCorpCardAdvanceable(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "isInstalledCorpCardAdvanceable",
  )(...args);
}

export function advancementDistributionOptions(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "advancementDistributionOptions",
  )(...args);
}

export function startCardImplementationAdvancementDistributionChoice(
  ...args: any[]
): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "startCardImplementationAdvancementDistributionChoice",
  )(...args);
}

export function parseAdvancementDistributionValue(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "parseAdvancementDistributionValue",
  )(...args);
}

export function sourcePartsForP334Choice(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "sourcePartsForP334Choice",
  )(...args);
}

export function validateAdvancementDistribution(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "validateAdvancementDistribution",
  )(...args);
}

export function resolveCardImplementationAdvancementDistributionChoice(
  ...args: any[]
): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "resolveCardImplementationAdvancementDistributionChoice",
  )(...args);
}

export function movableAdvancementSourceIds(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "movableAdvancementSourceIds",
  )(...args);
}

export function moveAdvancementOptions(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "moveAdvancementOptions",
  )(...args);
}

export function startCardImplementationMoveAdvancementChoice(
  ...args: any[]
): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "startCardImplementationMoveAdvancementChoice",
  )(...args);
}

export function resolveCardImplementationMoveAdvancementChoice(
  ...args: any[]
): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "resolveCardImplementationMoveAdvancementChoice",
  )(...args);
}

export function resolveManagementShakeUpOperation(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "resolveManagementShakeUpOperation",
  )(...args);
}

export function awardRunnerEventAgendaPoint(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "awardRunnerEventAgendaPoint",
  )(...args);
}

export function choiceAction(...args: any[]): any {
  return runtimeDelegate("corpRuntimeResolvers", "choiceAction")(...args);
}

export function abilityMetadata(...args: any[]): any {
  return runtimeDelegate("corpRuntimeResolvers", "abilityMetadata")(...args);
}

export function resolveCorpInstalledEconomyAction(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "resolveCorpInstalledEconomyAction",
  )(...args);
}

export function validateCorpInstalledEconomyAction(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "validateCorpInstalledEconomyAction",
  )(...args);
}

export function rezzedCorpInstalledEconomyCreditSourceIds(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "rezzedCorpInstalledEconomyCreditSourceIds",
  )(...args);
}

export function shouldOpenCorpInstalledEconomyCreditChoice(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "shouldOpenCorpInstalledEconomyCreditChoice",
  )(...args);
}

export function startCorpInstalledEconomyCreditChoice(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "startCorpInstalledEconomyCreditChoice",
  )(...args);
}

export function resolveCorpInstalledEconomyCreditChoice(...args: any[]): any {
  return runtimeDelegate(
    "corpRuntimeResolvers",
    "resolveCorpInstalledEconomyCreditChoice",
  )(...args);
}

export function corpInstallRezSequenceHandlerHost(...args: any[]): any {
  return runtimeDelegate(
    "actionRuntimeHosts",
    "corpInstallRezSequenceHandlerHost",
  )(...args);
}

export function scoredAgendaFlowHost(...args: any[]): any {
  return runtimeDelegate("actionRuntimeHosts", "scoredAgendaFlowHost")(...args);
}

export function scoredAgendaAbilityHost(...args: any[]): any {
  return runtimeDelegate(
    "actionRuntimeHosts",
    "scoredAgendaAbilityHost",
  )(...args);
}

export function corpTraceDamageAbilityHost(...args: any[]): any {
  return runtimeDelegate(
    "actionRuntimeHosts",
    "corpTraceDamageAbilityHost",
  )(...args);
}

export function corpSpecialDamageAbilityHost(...args: any[]): any {
  return runtimeDelegate(
    "actionRuntimeHosts",
    "corpSpecialDamageAbilityHost",
  )(...args);
}

export function playCardExecutionHost(...args: any[]): any {
  return runtimeDelegate(
    "actionRuntimeHosts",
    "playCardExecutionHost",
  )(...args);
}

export function corpOperationResolutionHost(...args: any[]): any {
  return runtimeDelegate(
    "actionRuntimeHosts",
    "corpOperationResolutionHost",
  )(...args);
}

export function boardStateActionExecutionHost(...args: any[]): any {
  return runtimeDelegate(
    "actionRuntimeHosts",
    "boardStateActionExecutionHost",
  )(...args);
}

export function hasHiddenResourceAccessStartActions(...args: any[]): any {
  return runtimeDelegate(
    "actionRuntimeHosts",
    "hasHiddenResourceAccessStartActions",
  )(...args);
}

export function pushCorpTraceDamageOrCardImplementationActions(
  ...args: any[]
): any {
  return runtimeDelegate(
    "actionRuntimeHosts",
    "pushCorpTraceDamageOrCardImplementationActions",
  )(...args);
}
