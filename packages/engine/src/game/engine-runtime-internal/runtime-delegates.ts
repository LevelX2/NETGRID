import { createChoiceHiddenZoneRuntime } from "./choice-hidden-zone-runtime";
import { createLifecycleRuntime } from "./lifecycle-runtime";
import { createTurnCorpRuntime } from "./turn-corp-runtime";
import { createActionRuntimeHosts } from "./action-runtime-hosts";
import { createCardRuntimeHosts } from "./card-runtime-hosts";
import { createFlowRuntimeHosts } from "./flow-runtime-hosts";
import { createStateRuntimeServices } from "./state-runtime-services";
import { createCardRuntimeResolvers } from "./card-runtime-resolvers";
import { createChoiceHiddenZoneResolvers } from "./choice-hidden-zone-resolvers";
import { createCorpRuntimeResolvers } from "./corp-runtime-resolvers";
import { createStateRuntimeResolvers } from "./state-runtime-resolvers";
import { createTurnRuntimeResolvers } from "./turn-runtime-resolvers";
import { createStateCorpRuntimeResolvers } from "./state-corp-runtime-resolvers";
import type { RuntimeDeps } from "./runtime-shared";
let turnCorpRuntime: any;
let stateCorpRuntimeResolvers: any;
let cardRuntimeResolvers: any;
let choiceHiddenZoneResolvers: any;
let corpRuntimeResolvers: any;
let stateRuntimeResolvers: any;
let turnRuntimeResolvers: any;
let stateRuntimeServices: any;
let cardRuntimeHosts: any;
let flowRuntimeHosts: any;
let actionRuntimeHosts: any;
let lifecycleRuntime: any;
let choiceHiddenZoneRuntime: any;
export function initializeRuntimeDelegates(runtimeDomainDeps: RuntimeDeps): void {
  turnCorpRuntime = createTurnCorpRuntime(runtimeDomainDeps);
  (runtimeDomainDeps as Record<string, unknown>).turnCorpRuntime = turnCorpRuntime;
  stateCorpRuntimeResolvers = createStateCorpRuntimeResolvers(runtimeDomainDeps);
  cardRuntimeResolvers = createCardRuntimeResolvers(runtimeDomainDeps);
  choiceHiddenZoneResolvers = createChoiceHiddenZoneResolvers(runtimeDomainDeps);
  corpRuntimeResolvers = createCorpRuntimeResolvers(runtimeDomainDeps);
  stateRuntimeResolvers = createStateRuntimeResolvers(runtimeDomainDeps);
  turnRuntimeResolvers = createTurnRuntimeResolvers(runtimeDomainDeps);
  stateRuntimeServices = createStateRuntimeServices(runtimeDomainDeps);
  cardRuntimeHosts = createCardRuntimeHosts(runtimeDomainDeps);
  flowRuntimeHosts = createFlowRuntimeHosts(runtimeDomainDeps);
  actionRuntimeHosts = createActionRuntimeHosts(runtimeDomainDeps);
  lifecycleRuntime = createLifecycleRuntime(runtimeDomainDeps);
  choiceHiddenZoneRuntime = createChoiceHiddenZoneRuntime(runtimeDomainDeps);
}
export function openPostMeatDamageReactionWindow(...args: any[]): any {
  return (cardRuntimeResolvers.openPostMeatDamageReactionWindow as any)(...args);
}

export function postMeatDamageHiddenResourceCandidates(...args: any[]): any {
  return (cardRuntimeResolvers.postMeatDamageHiddenResourceCandidates as any)(...args);
}

export function resolvePostMeatDamageHiddenResourceChoice(...args: any[]): any {
  return (cardRuntimeResolvers.resolvePostMeatDamageHiddenResourceChoice as any)(...args);
}

export function randomCorpHqDiscard(...args: any[]): any {
  return (cardRuntimeResolvers.randomCorpHqDiscard as any)(...args);
}

export function installTargetBindingForDefinition(...args: any[]): any {
  return (cardRuntimeResolvers.installTargetBindingForDefinition as any)(...args);
}

export function requiresDataFortInstallTarget(...args: any[]): any {
  return (cardRuntimeResolvers.requiresDataFortInstallTarget as any)(...args);
}

export function runnerEventLongtailForDefinition(...args: any[]): any {
  return (cardRuntimeResolvers.runnerEventLongtailForDefinition as any)(...args);
}

export function variableRezForDefinition(...args: any[]): any {
  return (cardRuntimeResolvers.variableRezForDefinition as any)(...args);
}

export function runnerEventLongtailKindForDefinition(...args: any[]): any {
  return (cardRuntimeResolvers.runnerEventLongtailKindForDefinition as any)(...args);
}

export function hiddenReplacementLongtailForDefinition(...args: any[]): any {
  return (cardRuntimeResolvers.hiddenReplacementLongtailForDefinition as any)(...args);
}

export function cardImplementationRunnerEventResolver(...args: any[]): any {
  return (cardRuntimeResolvers.cardImplementationRunnerEventResolver as any)(...args);
}

export function printedCostCardImplementationMakeRunEffect(...args: any[]): any {
  return (cardRuntimeResolvers.printedCostCardImplementationMakeRunEffect as any)(...args);
}

export function scoredAgendaImplementationForDefinitionId(...args: any[]): any {
  return (cardRuntimeResolvers.scoredAgendaImplementationForDefinitionId as any)(...args);
}

export function scoredAgendaImplementationForDefinition(...args: any[]): any {
  return (cardRuntimeResolvers.scoredAgendaImplementationForDefinition as any)(...args);
}

export function scoredAgendaKindForDefinition(...args: any[]): any {
  return (cardRuntimeResolvers.scoredAgendaKindForDefinition as any)(...args);
}

export function emptyRunnerDrawSummary(...args: any[]): any {
  return (cardRuntimeResolvers.emptyRunnerDrawSummary as any)(...args);
}

export function mergeRunnerDrawSummary(...args: any[]): any {
  return (cardRuntimeResolvers.mergeRunnerDrawSummary as any)(...args);
}

export function applyRunnerDrawSummaryPayload(...args: any[]): any {
  return (cardRuntimeResolvers.applyRunnerDrawSummaryPayload as any)(...args);
}

export function runnerDrawSummaryPublicPayload(...args: any[]): any {
  return (cardRuntimeResolvers.runnerDrawSummaryPublicPayload as any)(...args);
}

export function corpRunnerActionPaidWindowActions(...args: any[]): any {
  return (actionRuntimeHosts.corpRunnerActionPaidWindowActions as any)(...args);
}

export function expireCorporateRetreatInstallCreditAbilities(...args: any[]): any {
  return (stateRuntimeServices.expireCorporateRetreatInstallCreditAbilities as any)(...args);
}

export function isCorpInstallableCardType(...args: any[]): any {
  return (stateRuntimeServices.isCorpInstallableCardType as any)(...args);
}

export function edgerunnerTempsInstallActionsRemaining(...args: any[]): any {
  return (stateRuntimeServices.edgerunnerTempsInstallActionsRemaining as any)(...args);
}

export function clearEdgerunnerTempsInstallFlags(...args: any[]): any {
  return (stateRuntimeServices.clearEdgerunnerTempsInstallFlags as any)(...args);
}

export function consumeEdgerunnerTempsInstallAction(...args: any[]): any {
  return (stateRuntimeServices.consumeEdgerunnerTempsInstallAction as any)(...args);
}

export function valuPakProgramInstallActionsRemaining(...args: any[]): any {
  return (stateRuntimeServices.valuPakProgramInstallActionsRemaining as any)(...args);
}

export function valuPakTemporaryProgramInstallCredits(...args: any[]): any {
  return (stateRuntimeServices.valuPakTemporaryProgramInstallCredits as any)(...args);
}

export function runnerInstallableProgramIdsForValuPak(...args: any[]): any {
  return (stateRuntimeServices.runnerInstallableProgramIdsForValuPak as any)(...args);
}

export function installedRunnerProgramTrashOptionsForInstall(...args: any[]): any {
  return (stateRuntimeServices.installedRunnerProgramTrashOptionsForInstall as any)(...args);
}

export function runnerProgramInstallMemoryReachableAfterTrash(...args: any[]): any {
  return (stateRuntimeServices.runnerProgramInstallMemoryReachableAfterTrash as any)(...args);
}

export function shouldOfferRunnerProgramTrashBeforeInstall(...args: any[]): any {
  return (stateRuntimeServices.shouldOfferRunnerProgramTrashBeforeInstall as any)(...args);
}

export function clearValuPakProgramInstallFlags(...args: any[]): any {
  return (stateRuntimeServices.clearValuPakProgramInstallFlags as any)(...args);
}

export function consumeValuPakProgramInstallAction(...args: any[]): any {
  return (stateRuntimeServices.consumeValuPakProgramInstallAction as any)(...args);
}

export function runnerDrawActionContext(...args: any[]): any {
  return (stateRuntimeServices.runnerDrawActionContext as any)(...args);
}

export function normalizeSubtypeLabel(...args: any[]): any {
  return (stateRuntimeServices.normalizeSubtypeLabel as any)(...args);
}

export function cardHasSubtype(...args: any[]): any {
  return (stateRuntimeServices.cardHasSubtype as any)(...args);
}

export function stableSubtypeList(...args: any[]): any {
  return (stateRuntimeServices.stableSubtypeList as any)(...args);
}

export function effectiveSubtypesForCard(...args: any[]): any {
  return (stateRuntimeServices.effectiveSubtypesForCard as any)(...args);
}

export function rezzedIceOutsideThisIceCount(...args: any[]): any {
  return (stateRuntimeServices.rezzedIceOutsideThisIceCount as any)(...args);
}

export function relativeIceStrengthBonusFor(...args: any[]): any {
  return (stateRuntimeServices.relativeIceStrengthBonusFor as any)(...args);
}

export function isRegionUpgrade(...args: any[]): any {
  return (stateRuntimeServices.isRegionUpgrade as any)(...args);
}

export function isUniqueCard(...args: any[]): any {
  return (stateRuntimeServices.isUniqueCard as any)(...args);
}

export function rezzedBlackIceIds(...args: any[]): any {
  return (stateRuntimeServices.rezzedBlackIceIds as any)(...args);
}

export function rezzedInstalledIceIds(...args: any[]): any {
  return (stateRuntimeServices.rezzedInstalledIceIds as any)(...args);
}

export function affordableRezzedInstalledIceIdsForRunner(...args: any[]): any {
  return (stateRuntimeServices.affordableRezzedInstalledIceIdsForRunner as any)(...args);
}

export function unrezzedInstalledIceIds(...args: any[]): any {
  return (stateRuntimeServices.unrezzedInstalledIceIds as any)(...args);
}

export function hasInstalledUniqueCardDefinition(...args: any[]): any {
  return (stateRuntimeServices.hasInstalledUniqueCardDefinition as any)(...args);
}

export function daemonHostingCapacity(...args: any[]): any {
  return (stateRuntimeServices.daemonHostingCapacity as any)(...args);
}

export function daemonHostedMemoryUsed(...args: any[]): any {
  return (stateRuntimeServices.daemonHostedMemoryUsed as any)(...args);
}

export function canHostProgramOnDaemon(...args: any[]): any {
  return (stateRuntimeServices.canHostProgramOnDaemon as any)(...args);
}

export function hostedProgramStrengthModifier(...args: any[]): any {
  return (stateRuntimeServices.hostedProgramStrengthModifier as any)(...args);
}

export function icebreakerEncounterStrengthBonus(...args: any[]): any {
  return (stateRuntimeServices.icebreakerEncounterStrengthBonus as any)(...args);
}

export function canOverlayProgramOnZetatechSoftwareInstaller(...args: any[]): any {
  return (stateRuntimeServices.canOverlayProgramOnZetatechSoftwareInstaller as any)(...args);
}

export function rezzedCorpRootCardIds(...args: any[]): any {
  return (stateRuntimeServices.rezzedCorpRootCardIds as any)(...args);
}

export function visibleVirusCounterTargetIds(...args: any[]): any {
  return (stateRuntimeServices.visibleVirusCounterTargetIds as any)(...args);
}

export function iceStrengthBonusFor(...args: any[]): any {
  return (stateRuntimeServices.iceStrengthBonusFor as any)(...args);
}

export function iceStrengthFor(...args: any[]): any {
  return (stateRuntimeServices.iceStrengthFor as any)(...args);
}

export function runRemainderStrengthBonusForBreaker(...args: any[]): any {
  return (stateRuntimeServices.runRemainderStrengthBonusForBreaker as any)(...args);
}

export function runBreakSubroutineAdditionalCost(...args: any[]): any {
  return (stateRuntimeServices.runBreakSubroutineAdditionalCost as any)(...args);
}

export function microtechTrodeSetBreakAdditionalCost(...args: any[]): any {
  return (stateRuntimeServices.microtechTrodeSetBreakAdditionalCost as any)(...args);
}

export function breakSubroutineCostBreakdown(...args: any[]): any {
  return (stateRuntimeServices.breakSubroutineCostBreakdown as any)(...args);
}

export function hasInstalledMicrotechTrodeSet(...args: any[]): any {
  return (stateRuntimeServices.hasInstalledMicrotechTrodeSet as any)(...args);
}

export function runnerHasInstalledCardDefinition(...args: any[]): any {
  return (stateRuntimeServices.runnerHasInstalledCardDefinition as any)(...args);
}

export function runnerInstalledCardCountByDefinition(...args: any[]): any {
  return (stateRuntimeServices.runnerInstalledCardCountByDefinition as any)(...args);
}

export function installedVirusCounterTotalForDefinition(...args: any[]): any {
  return (stateRuntimeServices.installedVirusCounterTotalForDefinition as any)(...args);
}

export function virusCounterImplementationForDefinition(...args: any[]): any {
  return (stateRuntimeServices.virusCounterImplementationForDefinition as any)(...args);
}

export function virusCounterImplementationForCard(...args: any[]): any {
  return (stateRuntimeServices.virusCounterImplementationForCard as any)(...args);
}

export function corpUtilityImplementationForCard(...args: any[]): any {
  return (stateRuntimeServices.corpUtilityImplementationForCard as any)(...args);
}

export function hasCorpUtilityKind(...args: any[]): any {
  return (stateRuntimeServices.hasCorpUtilityKind as any)(...args);
}

export function cardInstallCapabilitiesForDefinition(...args: any[]): any {
  return (stateRuntimeServices.cardInstallCapabilitiesForDefinition as any)(...args);
}

export function hasInstallCapabilityKindForDefinition(...args: any[]): any {
  return (stateRuntimeServices.hasInstallCapabilityKindForDefinition as any)(...args);
}

export function rootInstallRezzesOnInstall(...args: any[]): any {
  return (stateRuntimeServices.rootInstallRezzesOnInstall as any)(...args);
}

export function mustInstallInsideSubsidiaryDataFort(...args: any[]): any {
  return (stateRuntimeServices.mustInstallInsideSubsidiaryDataFort as any)(...args);
}

export function fortCapacityModifiersForCard(...args: any[]): any {
  return (stateRuntimeServices.fortCapacityModifiersForCard as any)(...args);
}

export function leavePlayCleanupImplementationsForCard(...args: any[]): any {
  return (stateRuntimeServices.leavePlayCleanupImplementationsForCard as any)(...args);
}

export function installedRunnerVirusSourceIds(...args: any[]): any {
  return (stateRuntimeServices.installedRunnerVirusSourceIds as any)(...args);
}

export function cockroachCounterTotal(...args: any[]): any {
  return (stateRuntimeServices.cockroachCounterTotal as any)(...args);
}

export function incubatorCounterTotal(...args: any[]): any {
  return (stateRuntimeServices.incubatorCounterTotal as any)(...args);
}

export function cockroachRandomHqDiscardActive(...args: any[]): any {
  return (stateRuntimeServices.cockroachRandomHqDiscardActive as any)(...args);
}

export function isVisibleVirusCounterCardForRunner(...args: any[]): any {
  return (stateRuntimeServices.isVisibleVirusCounterCardForRunner as any)(...args);
}

export function corpIceInstallBaseCost(...args: any[]): any {
  return (stateRuntimeServices.corpIceInstallBaseCost as any)(...args);
}

export function outermostIceIndex(...args: any[]): any {
  return (stateRuntimeServices.outermostIceIndex as any)(...args);
}

export function poxCountersForServer(...args: any[]): any {
  return (stateRuntimeServices.poxCountersForServer as any)(...args);
}

export function spyCountersForServer(...args: any[]): any {
  return (stateRuntimeServices.spyCountersForServer as any)(...args);
}

export function poxInstallTax(...args: any[]): any {
  return (stateRuntimeServices.poxInstallTax as any)(...args);
}

export function corpIceInstallAdditionalCost(...args: any[]): any {
  return (stateRuntimeServices.corpIceInstallAdditionalCost as any)(...args);
}

export function corpIceInstallTotalCost(...args: any[]): any {
  return (stateRuntimeServices.corpIceInstallTotalCost as any)(...args);
}

export function assertCorpIceInstallCostValid(...args: any[]): any {
  return (stateRuntimeServices.assertCorpIceInstallCostValid as any)(...args);
}

export function specialZoneHarnessActions(...args: any[]): any {
  return (actionRuntimeHosts.specialZoneHarnessActions as any)(...args);
}

export function dupreStrengthCounterBonus(...args: any[]): any {
  return (cardRuntimeHosts.dupreStrengthCounterBonus as any)(...args);
}

export function permanentIcebreakerStrengthCounterBonus(...args: any[]): any {
  return (cardRuntimeHosts.permanentIcebreakerStrengthCounterBonus as any)(...args);
}

export function pumpAmountForLegalAction(...args: any[]): any {
  return (cardRuntimeHosts.pumpAmountForLegalAction as any)(...args);
}

export function pumpAbilityForLegalAction(...args: any[]): any {
  return (cardRuntimeHosts.pumpAbilityForLegalAction as any)(...args);
}

export function breakAbilityForLegalAction(...args: any[]): any {
  return (cardRuntimeHosts.breakAbilityForLegalAction as any)(...args);
}

export function pumpDurationForLegalAction(...args: any[]): any {
  return (cardRuntimeHosts.pumpDurationForLegalAction as any)(...args);
}

export function assertCurrentSubroutineMatchesLegalAction(...args: any[]): any {
  return (cardRuntimeHosts.assertCurrentSubroutineMatchesLegalAction as any)(...args);
}

export function resolveMultiBreakSubroutinesAction(...args: any[]): any {
  return (cardRuntimeHosts.resolveMultiBreakSubroutinesAction as any)(...args);
}

export function assertBreakSubroutineCostQuoteValid(...args: any[]): any {
  return (cardRuntimeHosts.assertBreakSubroutineCostQuoteValid as any)(...args);
}

export function subroutinesForCurrentEncounter(...args: any[]): any {
  return (cardRuntimeHosts.subroutinesForCurrentEncounter as any)(...args);
}

export function variableTraceSubroutineForCurrentEncounter(...args: any[]): any {
  return (cardRuntimeHosts.variableTraceSubroutineForCurrentEncounter as any)(...args);
}

export function relativeDamageSubroutineForCurrentEncounter(...args: any[]): any {
  return (cardRuntimeHosts.relativeDamageSubroutineForCurrentEncounter as any)(...args);
}

export function relativeTraceSubroutinesForCurrentEncounter(...args: any[]): any {
  return (cardRuntimeHosts.relativeTraceSubroutinesForCurrentEncounter as any)(...args);
}

export function runCardImplementationActionHost(...args: any[]): any {
  return (cardRuntimeHosts.runCardImplementationActionHost as any)(...args);
}

export function runStartTaxForServerUpgrades(...args: any[]): any {
  return (cardRuntimeHosts.runStartTaxForServerUpgrades as any)(...args);
}

export function newsgroupTauntingRunStartTax(...args: any[]): any {
  return (cardRuntimeHosts.newsgroupTauntingRunStartTax as any)(...args);
}

export function spendRunnerAccessTrashCredits(...args: any[]): any {
  return (cardRuntimeHosts.spendRunnerAccessTrashCredits as any)(...args);
}

export function turnBasicExecutionHost(...args: any[]): any {
  return (actionRuntimeHosts.turnBasicExecutionHost as any)(...args);
}

export function creditEconomyExecutionHost(...args: any[]): any {
  return (actionRuntimeHosts.creditEconomyExecutionHost as any)(...args);
}

export function runnerSpecialTriggerExecutionHost(...args: any[]): any {
  return (cardRuntimeHosts.runnerSpecialTriggerExecutionHost as any)(...args);
}

export function runFortTriggerExecutionHost(...args: any[]): any {
  return (cardRuntimeHosts.runFortTriggerExecutionHost as any)(...args);
}

export function counterUtilityTriggerExecutionHost(...args: any[]): any {
  return (cardRuntimeHosts.counterUtilityTriggerExecutionHost as any)(...args);
}

export function triggerAbilityExecutionHost(...args: any[]): any {
  return (cardRuntimeHosts.triggerAbilityExecutionHost as any)(...args);
}

export function installCardHost(...args: any[]): any {
  return (cardRuntimeHosts.installCardHost as any)(...args);
}

export function rezCardHost(...args: any[]): any {
  return (cardRuntimeHosts.rezCardHost as any)(...args);
}

export function traceOrchestrationHost(...args: any[]): any {
  return (cardRuntimeHosts.traceOrchestrationHost as any)(...args);
}

export function activatedCardImplementationExecutionHost(...args: any[]): any {
  return (cardRuntimeHosts.activatedCardImplementationExecutionHost as any)(...args);
}

export function resolveRunnerTargetedEventImplementation(...args: any[]): any {
  return (cardRuntimeHosts.resolveRunnerTargetedEventImplementation as any)(...args);
}

export function resolvePostOnPlayGenericFollowups(...args: any[]): any {
  return (cardRuntimeHosts.resolvePostOnPlayGenericFollowups as any)(...args);
}

export function resolveMitWestTier(...args: any[]): any {
  return (cardRuntimeHosts.resolveMitWestTier as any)(...args);
}

export function shuffleGripTrashAndStackThenDrawForCardImplementation(...args: any[]): any {
  return (cardRuntimeHosts.shuffleGripTrashAndStackThenDrawForCardImplementation as any)(...args);
}

export function startRunnerProgramTrashBeforeInstallChoice(...args: any[]): any {
  return (cardRuntimeHosts.startRunnerProgramTrashBeforeInstallChoice as any)(...args);
}

export function resolveRunnerProgramTrashBeforeInstallChoice(...args: any[]): any {
  return (cardRuntimeHosts.resolveRunnerProgramTrashBeforeInstallChoice as any)(...args);
}

export function canInstallCorpRootCardInServer(...args: any[]): any {
  return (flowRuntimeHosts.canInstallCorpRootCardInServer as any)(...args);
}

export function corpRootAgendaOrNodeCapacityInServer(...args: any[]): any {
  return (flowRuntimeHosts.corpRootAgendaOrNodeCapacityInServer as any)(...args);
}

export function corpRegionUpgradeIdsInServer(...args: any[]): any {
  return (flowRuntimeHosts.corpRegionUpgradeIdsInServer as any)(...args);
}

export function startRun(...args: any[]): any {
  return (flowRuntimeHosts.startRun as any)(...args);
}

export function runnerTraceCounterEffectDefinitions(...args: any[]): any {
  return (flowRuntimeHosts.runnerTraceCounterEffectDefinitions as any)(...args);
}

export function runnerCounterDisplayName(...args: any[]): any {
  return (flowRuntimeHosts.runnerCounterDisplayName as any)(...args);
}

export function traceCounterEffectDefinitionFor(...args: any[]): any {
  return (flowRuntimeHosts.traceCounterEffectDefinitionFor as any)(...args);
}

export function runnerUtilityLongtailKindForDefinition(...args: any[]): any {
  return (flowRuntimeHosts.runnerUtilityLongtailKindForDefinition as any)(...args);
}

export function runnerUtilityLongtailKindForCard(...args: any[]): any {
  return (flowRuntimeHosts.runnerUtilityLongtailKindForCard as any)(...args);
}

export function runnerUtilityLongtailImplementationForCard(...args: any[]): any {
  return (flowRuntimeHosts.runnerUtilityLongtailImplementationForCard as any)(...args);
}

export function uniqueDirectLongtailImplementationForDefinition(...args: any[]): any {
  return (flowRuntimeHosts.uniqueDirectLongtailImplementationForDefinition as any)(...args);
}

export function uniqueDirectLongtailKindForDefinition(...args: any[]): any {
  return (flowRuntimeHosts.uniqueDirectLongtailKindForDefinition as any)(...args);
}

export function uniqueDirectLongtailImplementationForCard(...args: any[]): any {
  return (flowRuntimeHosts.uniqueDirectLongtailImplementationForCard as any)(...args);
}

export function uniqueDirectLongtailKindForCard(...args: any[]): any {
  return (flowRuntimeHosts.uniqueDirectLongtailKindForCard as any)(...args);
}

export function remainingReplacementLongtailImplementationForDefinition(...args: any[]): any {
  return (flowRuntimeHosts.remainingReplacementLongtailImplementationForDefinition as any)(...args);
}

export function remainingReplacementLongtailKindForDefinition(...args: any[]): any {
  return (flowRuntimeHosts.remainingReplacementLongtailKindForDefinition as any)(...args);
}

export function remainingReplacementLongtailImplementationForCard(...args: any[]): any {
  return (flowRuntimeHosts.remainingReplacementLongtailImplementationForCard as any)(...args);
}

export function remainingReplacementLongtailKindForCard(...args: any[]): any {
  return (flowRuntimeHosts.remainingReplacementLongtailKindForCard as any)(...args);
}

export function isAcmeSavingsAndLoanDefinition(...args: any[]): any {
  return (flowRuntimeHosts.isAcmeSavingsAndLoanDefinition as any)(...args);
}

export function isCitySurveillanceCard(...args: any[]): any {
  return (flowRuntimeHosts.isCitySurveillanceCard as any)(...args);
}

export function isInvestmentFirmCard(...args: any[]): any {
  return (flowRuntimeHosts.isInvestmentFirmCard as any)(...args);
}

export function isHackerTrackerCentralCard(...args: any[]): any {
  return (flowRuntimeHosts.isHackerTrackerCentralCard as any)(...args);
}

export function applyRunnerTraceCounterRunStartEffects(...args: any[]): any {
  return (flowRuntimeHosts.applyRunnerTraceCounterRunStartEffects as any)(...args);
}

export function applyAiBoonRunStart(...args: any[]): any {
  return (flowRuntimeHosts.applyAiBoonRunStart as any)(...args);
}

export function continueRun(...args: any[]): any {
  return (flowRuntimeHosts.continueRun as any)(...args);
}

export function addCurrentRunAccessCount(...args: any[]): any {
  return (flowRuntimeHosts.addCurrentRunAccessCount as any)(...args);
}

export function passCurrentEncounteredIce(...args: any[]): any {
  return (flowRuntimeHosts.passCurrentEncounteredIce as any)(...args);
}

export function resolveBlinkBreakSubroutineAction(...args: any[]): any {
  return (flowRuntimeHosts.resolveBlinkBreakSubroutineAction as any)(...args);
}

export function recordBartmossEncounterUsage(...args: any[]): any {
  return (flowRuntimeHosts.recordBartmossEncounterUsage as any)(...args);
}

export function recordSnowballBreakUsage(...args: any[]): any {
  return (flowRuntimeHosts.recordSnowballBreakUsage as any)(...args);
}

export function icebreakerHasSpecial(...args: any[]): any {
  return (flowRuntimeHosts.icebreakerHasSpecial as any)(...args);
}

export function hackerTrackerCardIds(...args: any[]): any {
  return (flowRuntimeHosts.hackerTrackerCardIds as any)(...args);
}

export function hackerTrackerCounterType(...args: any[]): any {
  return (flowRuntimeHosts.hackerTrackerCounterType as any)(...args);
}

export function hackerTrackerCounterTotal(...args: any[]): any {
  return (flowRuntimeHosts.hackerTrackerCounterTotal as any)(...args);
}

export function spendHackerTrackerCounters(...args: any[]): any {
  return (flowRuntimeHosts.spendHackerTrackerCounters as any)(...args);
}

export function addHackerTrackerTraceCounters(...args: any[]): any {
  return (flowRuntimeHosts.addHackerTrackerTraceCounters as any)(...args);
}

export function rabbitTraceLimitReductionForIceTrace(...args: any[]): any {
  return (flowRuntimeHosts.rabbitTraceLimitReductionForIceTrace as any)(...args);
}

export function archivesAccessRequiresDecisionOrEffect(...args: any[]): any {
  return (flowRuntimeHosts.archivesAccessRequiresDecisionOrEffect as any)(...args);
}

export function startRunnerPrivateLookChoice(...args: any[]): any {
  return (choiceHiddenZoneResolvers.startRunnerPrivateLookChoice as any)(...args);
}

export function resolveRunnerPrivateLookChoice(...args: any[]): any {
  return (choiceHiddenZoneResolvers.resolveRunnerPrivateLookChoice as any)(...args);
}

export function startExpertScheduleAnalyzerPostAccessChoice(...args: any[]): any {
  return (choiceHiddenZoneResolvers.startExpertScheduleAnalyzerPostAccessChoice as any)(...args);
}

export function v1915InstalledRevealHelperIds(...args: any[]): any {
  return (choiceHiddenZoneResolvers.v1915InstalledRevealHelperIds as any)(...args);
}

export function runnerHasInstalledDefinition(...args: any[]): any {
  return (choiceHiddenZoneResolvers.runnerHasInstalledDefinition as any)(...args);
}

export function trashOlderRegionUpgradesInServer(...args: any[]): any {
  return (choiceHiddenZoneResolvers.trashOlderRegionUpgradesInServer as any)(...args);
}

export function appendRegionReplacementTrashEffect(...args: any[]): any {
  return (choiceHiddenZoneResolvers.appendRegionReplacementTrashEffect as any)(...args);
}

export function resolveOmniscienceFoundationEndTurnTag(...args: any[]): any {
  return (turnRuntimeResolvers.resolveOmniscienceFoundationEndTurnTag as any)(...args);
}

export function resolveFieldReporterEndOfRunnerTurn(...args: any[]): any {
  return (turnRuntimeResolvers.resolveFieldReporterEndOfRunnerTurn as any)(...args);
}

export function resolvePreyingMantisEndOfRunnerTurnDamage(...args: any[]): any {
  return (turnRuntimeResolvers.resolvePreyingMantisEndOfRunnerTurnDamage as any)(...args);
}

export function endTurn(...args: any[]): any {
  return (turnRuntimeResolvers.endTurn as any)(...args);
}

export function resolveSneakPreviewTemporaryInstallReturns(...args: any[]): any {
  return (turnRuntimeResolvers.resolveSneakPreviewTemporaryInstallReturns as any)(...args);
}

export function resolveAcmeSavingsAndLoanEndOfCorpTurn(...args: any[]): any {
  return (turnRuntimeResolvers.resolveAcmeSavingsAndLoanEndOfCorpTurn as any)(...args);
}

export function startDiscardPhase(...args: any[]): any {
  return (turnRuntimeResolvers.startDiscardPhase as any)(...args);
}

export function processDiscardStep(...args: any[]): any {
  return (turnRuntimeResolvers.processDiscardStep as any)(...args);
}

export function completeDiscardPhase(...args: any[]): any {
  return (turnRuntimeResolvers.completeDiscardPhase as any)(...args);
}

export function appendResolvedEffectsToPayload(...args: any[]): any {
  return (turnRuntimeResolvers.appendResolvedEffectsToPayload as any)(...args);
}

export function automaticGainCreditsEffect(...args: any[]): any {
  return (turnRuntimeResolvers.automaticGainCreditsEffect as any)(...args);
}

export function automaticLoseCreditsEffect(...args: any[]): any {
  return (turnRuntimeResolvers.automaticLoseCreditsEffect as any)(...args);
}

export function automaticDrawCardsEffect(...args: any[]): any {
  return (turnRuntimeResolvers.automaticDrawCardsEffect as any)(...args);
}

export function automaticTagEffect(...args: any[]): any {
  return (turnRuntimeResolvers.automaticTagEffect as any)(...args);
}

export function automaticTrashCardEffect(...args: any[]): any {
  return (turnRuntimeResolvers.automaticTrashCardEffect as any)(...args);
}

export function automaticCounterChangeEffect(...args: any[]): any {
  return (turnRuntimeResolvers.automaticCounterChangeEffect as any)(...args);
}

export function automaticStealAgendaEffect(...args: any[]): any {
  return (turnRuntimeResolvers.automaticStealAgendaEffect as any)(...args);
}

export function publicCardTitle(...args: any[]): any {
  return (turnRuntimeResolvers.publicCardTitle as any)(...args);
}

export function applyRunnerForgoNextAction(...args: any[]): any {
  return (turnRuntimeResolvers.applyRunnerForgoNextAction as any)(...args);
}

export function addRunnerFutureActionDebt(...args: any[]): any {
  return (turnRuntimeResolvers.addRunnerFutureActionDebt as any)(...args);
}

export function consumeRunnerFutureActionDebt(...args: any[]): any {
  return (turnRuntimeResolvers.consumeRunnerFutureActionDebt as any)(...args);
}

export function startCorpTurn(...args: any[]): any {
  return (turnRuntimeResolvers.startCorpTurn as any)(...args);
}

export function startRunnerTurn(...args: any[]): any {
  return (turnRuntimeResolvers.startRunnerTurn as any)(...args);
}

export function untapRunnerCardsAtTurnStart(...args: any[]): any {
  return (turnRuntimeResolvers.untapRunnerCardsAtTurnStart as any)(...args);
}

export function resolveBizarreEncryptionDelayedAgendas(...args: any[]): any {
  return (turnRuntimeResolvers.resolveBizarreEncryptionDelayedAgendas as any)(...args);
}

export function applyCorpStartOfTurnEffects(...args: any[]): any {
  return (turnRuntimeResolvers.applyCorpStartOfTurnEffects as any)(...args);
}

export function applyProteusPurgeableRunnerVirusCorpStartEffects(...args: any[]): any {
  return (turnRuntimeResolvers.applyProteusPurgeableRunnerVirusCorpStartEffects as any)(...args);
}

export function virusCounterDrawsAtCorpStart(...args: any[]): any {
  return (turnRuntimeResolvers.virusCounterDrawsAtCorpStart as any)(...args);
}

export function skivvissCounterTotal(...args: any[]): any {
  return (turnRuntimeResolvers.skivvissCounterTotal as any)(...args);
}

export function virusCounterCascadeTrashAtCorpStart(...args: any[]): any {
  return (turnRuntimeResolvers.virusCounterCascadeTrashAtCorpStart as any)(...args);
}

export function trashFaceupRdCardsForCascade(...args: any[]): any {
  return (turnRuntimeResolvers.trashFaceupRdCardsForCascade as any)(...args);
}

export function applyRunnerStartOfTurnEffects(...args: any[]): any {
  return (turnRuntimeResolvers.applyRunnerStartOfTurnEffects as any)(...args);
}

export function applyQuestForCattekinStartOfTurn(...args: any[]): any {
  return (turnRuntimeResolvers.applyQuestForCattekinStartOfTurn as any)(...args);
}

export function virusCounterCreditsAtRunnerStart(...args: any[]): any {
  return (turnRuntimeResolvers.virusCounterCreditsAtRunnerStart as any)(...args);
}

export function startVirusCounterRunnerPrivateLookAtStart(...args: any[]): any {
  return (turnRuntimeResolvers.startVirusCounterRunnerPrivateLookAtStart as any)(...args);
}

export function randomCorpHqCardsWithoutReplacement(...args: any[]): any {
  return (turnRuntimeResolvers.randomCorpHqCardsWithoutReplacement as any)(...args);
}

export function startRunnerPrivateLookAtSpecificCorpCards(...args: any[]): any {
  return (turnRuntimeResolvers.startRunnerPrivateLookAtSpecificCorpCards as any)(...args);
}

export function queueIncubatorStartOfTurnTransforms(...args: any[]): any {
  return (turnRuntimeResolvers.queueIncubatorStartOfTurnTransforms as any)(...args);
}

export function startIncubatorTransformChoice(...args: any[]): any {
  return (turnRuntimeResolvers.startIncubatorTransformChoice as any)(...args);
}

export function serverDifficultyIncreaseFromFaitAccompli(...args: any[]): any {
  return (stateCorpRuntimeResolvers.serverDifficultyIncreaseFromFaitAccompli as any)(...args);
}

export function serverDifficultyReductionFromUpgrades(...args: any[]): any {
  return (stateCorpRuntimeResolvers.serverDifficultyReductionFromUpgrades as any)(...args);
}

export function forfeitRunnerAgendaForPointCost(...args: any[]): any {
  return (corpRuntimeResolvers.forfeitRunnerAgendaForPointCost as any)(...args);
}

export function forfeitCorpAgendaForPointCost(...args: any[]): any {
  return (corpRuntimeResolvers.forfeitCorpAgendaForPointCost as any)(...args);
}

export function acmeSavingsAndLoanObligationCount(...args: any[]): any {
  return (corpRuntimeResolvers.acmeSavingsAndLoanObligationCount as any)(...args);
}

export function addAcmeSavingsAndLoanObligation(...args: any[]): any {
  return (corpRuntimeResolvers.addAcmeSavingsAndLoanObligation as any)(...args);
}

export function removeAcmeSavingsAndLoanObligation(...args: any[]): any {
  return (corpRuntimeResolvers.removeAcmeSavingsAndLoanObligation as any)(...args);
}

export function spendCorpAgendaPointCost(...args: any[]): any {
  return (corpRuntimeResolvers.spendCorpAgendaPointCost as any)(...args);
}

export function installedAgendaOperationTarget(...args: any[]): any {
  return (corpRuntimeResolvers.installedAgendaOperationTarget as any)(...args);
}

export function corpAgendaCounterOperationTarget(...args: any[]): any {
  return (corpRuntimeResolvers.corpAgendaCounterOperationTarget as any)(...args);
}

export function corpScoredAgendaForfeitTargets(...args: any[]): any {
  return (corpRuntimeResolvers.corpScoredAgendaForfeitTargets as any)(...args);
}

export function powerGridOverloadEligibleHardwareIds(...args: any[]): any {
  return (corpRuntimeResolvers.powerGridOverloadEligibleHardwareIds as any)(...args);
}

export function powerGridOverloadLegalActions(...args: any[]): any {
  return (corpRuntimeResolvers.powerGridOverloadLegalActions as any)(...args);
}

export function powerGridOverloadTrashCountFromPayload(...args: any[]): any {
  return (corpRuntimeResolvers.powerGridOverloadTrashCountFromPayload as any)(...args);
}

export function resolvePowerGridOverloadOperation(...args: any[]): any {
  return (corpRuntimeResolvers.resolvePowerGridOverloadOperation as any)(...args);
}

export function startPowerGridOverloadChoice(...args: any[]): any {
  return (corpRuntimeResolvers.startPowerGridOverloadChoice as any)(...args);
}

export function powerGridOverloadTrashCountFromChoiceSource(...args: any[]): any {
  return (corpRuntimeResolvers.powerGridOverloadTrashCountFromChoiceSource as any)(...args);
}

export function resolvePowerGridOverloadChoice(...args: any[]): any {
  return (corpRuntimeResolvers.resolvePowerGridOverloadChoice as any)(...args);
}

export function trashPowerGridOverloadHardware(...args: any[]): any {
  return (corpRuntimeResolvers.trashPowerGridOverloadHardware as any)(...args);
}

export function systematicLayoffsLegalActions(...args: any[]): any {
  return (corpRuntimeResolvers.systematicLayoffsLegalActions as any)(...args);
}

export function resolveAgendaCounterOperation(...args: any[]): any {
  return (corpRuntimeResolvers.resolveAgendaCounterOperation as any)(...args);
}

export function resolveSystematicLayoffsAdvancementOperation(...args: any[]): any {
  return (corpRuntimeResolvers.resolveSystematicLayoffsAdvancementOperation as any)(...args);
}

export function systematicLayoffsPlacementOptions(...args: any[]): any {
  return (corpRuntimeResolvers.systematicLayoffsPlacementOptions as any)(...args);
}

export function startSystematicLayoffsAdvancementChoice(...args: any[]): any {
  return (corpRuntimeResolvers.startSystematicLayoffsAdvancementChoice as any)(...args);
}

export function resolveSystematicLayoffsAdvancementChoice(...args: any[]): any {
  return (corpRuntimeResolvers.resolveSystematicLayoffsAdvancementChoice as any)(...args);
}

export function applySystematicLayoffsAdvancementPlacement(...args: any[]): any {
  return (corpRuntimeResolvers.applySystematicLayoffsAdvancementPlacement as any)(...args);
}

export function advanceableInstalledCardTargets(...args: any[]): any {
  return (corpRuntimeResolvers.advanceableInstalledCardTargets as any)(...args);
}

export function isInstalledCorpCardAdvanceable(...args: any[]): any {
  return (corpRuntimeResolvers.isInstalledCorpCardAdvanceable as any)(...args);
}

export function advancementDistributionOptions(...args: any[]): any {
  return (corpRuntimeResolvers.advancementDistributionOptions as any)(...args);
}

export function startCardImplementationAdvancementDistributionChoice(...args: any[]): any {
  return (corpRuntimeResolvers.startCardImplementationAdvancementDistributionChoice as any)(...args);
}

export function parseAdvancementDistributionValue(...args: any[]): any {
  return (corpRuntimeResolvers.parseAdvancementDistributionValue as any)(...args);
}

export function sourcePartsForP334Choice(...args: any[]): any {
  return (corpRuntimeResolvers.sourcePartsForP334Choice as any)(...args);
}

export function validateAdvancementDistribution(...args: any[]): any {
  return (corpRuntimeResolvers.validateAdvancementDistribution as any)(...args);
}

export function resolveCardImplementationAdvancementDistributionChoice(...args: any[]): any {
  return (corpRuntimeResolvers.resolveCardImplementationAdvancementDistributionChoice as any)(...args);
}

export function movableAdvancementSourceIds(...args: any[]): any {
  return (corpRuntimeResolvers.movableAdvancementSourceIds as any)(...args);
}

export function moveAdvancementOptions(...args: any[]): any {
  return (corpRuntimeResolvers.moveAdvancementOptions as any)(...args);
}

export function startCardImplementationMoveAdvancementChoice(...args: any[]): any {
  return (corpRuntimeResolvers.startCardImplementationMoveAdvancementChoice as any)(...args);
}

export function resolveCardImplementationMoveAdvancementChoice(...args: any[]): any {
  return (corpRuntimeResolvers.resolveCardImplementationMoveAdvancementChoice as any)(...args);
}

export function resolveManagementShakeUpOperation(...args: any[]): any {
  return (corpRuntimeResolvers.resolveManagementShakeUpOperation as any)(...args);
}

export function awardRunnerEventAgendaPoint(...args: any[]): any {
  return (corpRuntimeResolvers.awardRunnerEventAgendaPoint as any)(...args);
}

export function choiceAction(...args: any[]): any {
  return (corpRuntimeResolvers.choiceAction as any)(...args);
}

export function abilityMetadata(...args: any[]): any {
  return (corpRuntimeResolvers.abilityMetadata as any)(...args);
}

export function resolveCorpInstalledEconomyAction(...args: any[]): any {
  return (corpRuntimeResolvers.resolveCorpInstalledEconomyAction as any)(...args);
}

export function validateCorpInstalledEconomyAction(...args: any[]): any {
  return (corpRuntimeResolvers.validateCorpInstalledEconomyAction as any)(...args);
}

export function rezzedInvestmentFirmIds(...args: any[]): any {
  return (corpRuntimeResolvers.rezzedInvestmentFirmIds as any)(...args);
}

export function shouldOpenInvestmentFirmCreditChoice(...args: any[]): any {
  return (corpRuntimeResolvers.shouldOpenInvestmentFirmCreditChoice as any)(...args);
}

export function startInvestmentFirmCreditChoice(...args: any[]): any {
  return (corpRuntimeResolvers.startInvestmentFirmCreditChoice as any)(...args);
}

export function resolveInvestmentFirmCreditChoice(...args: any[]): any {
  return (corpRuntimeResolvers.resolveInvestmentFirmCreditChoice as any)(...args);
}

export function discardRandomCorpHqCards(...args: any[]): any {
  return (lifecycleRuntime.discardRandomCorpHqCards as any)(...args);
}

export function trashRunnerInstalledProgram(...args: any[]): any {
  return (lifecycleRuntime.trashRunnerInstalledProgram as any)(...args);
}

export function backupProgramsOnMicrotechBeforeTrash(...args: any[]): any {
  return (lifecycleRuntime.backupProgramsOnMicrotechBeforeTrash as any)(...args);
}

export function runnerProgramUsesMemory(...args: any[]): any {
  return (lifecycleRuntime.runnerProgramUsesMemory as any)(...args);
}

export function trashRunnerInstalledCardToHeap(...args: any[]): any {
  return (lifecycleRuntime.trashRunnerInstalledCardToHeap as any)(...args);
}

export function returnRunnerInstalledCardToGrip(...args: any[]): any {
  return (lifecycleRuntime.returnRunnerInstalledCardToGrip as any)(...args);
}

export function returnRunnerInstalledProgramsToGripForAccess(...args: any[]): any {
  return (lifecycleRuntime.returnRunnerInstalledProgramsToGripForAccess as any)(...args);
}

export function trashCorpInstalledCardToArchives(...args: any[]): any {
  return (lifecycleRuntime.trashCorpInstalledCardToArchives as any)(...args);
}

export function cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay(...args: any[]): any {
  return (lifecycleRuntime.cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay as any)(...args);
}

export function drawRunnerCard(...args: any[]): any {
  return (lifecycleRuntime.drawRunnerCard as any)(...args);
}

export function activeCrashEverettSourceId(...args: any[]): any {
  return (lifecycleRuntime.activeCrashEverettSourceId as any)(...args);
}

export function startCrashEverettDrawChoice(...args: any[]): any {
  return (lifecycleRuntime.startCrashEverettDrawChoice as any)(...args);
}

export function drawRunnerCards(...args: any[]): any {
  return (lifecycleRuntime.drawRunnerCards as any)(...args);
}

export function resolveCrashEverettDrawChoice(...args: any[]): any {
  return (lifecycleRuntime.resolveCrashEverettDrawChoice as any)(...args);
}

export function corpInstallRezSequenceHandlerHost(...args: any[]): any {
  return (actionRuntimeHosts.corpInstallRezSequenceHandlerHost as any)(...args);
}

export function scoredAgendaFlowHost(...args: any[]): any {
  return (actionRuntimeHosts.scoredAgendaFlowHost as any)(...args);
}

export function scoredAgendaAbilityHost(...args: any[]): any {
  return (actionRuntimeHosts.scoredAgendaAbilityHost as any)(...args);
}

export function corpTraceDamageAbilityHost(...args: any[]): any {
  return (actionRuntimeHosts.corpTraceDamageAbilityHost as any)(...args);
}

export function corpSpecialDamageAbilityHost(...args: any[]): any {
  return (actionRuntimeHosts.corpSpecialDamageAbilityHost as any)(...args);
}

export function runnerAccessActionHost(...args: any[]): any {
  return (flowRuntimeHosts.runnerAccessActionHost as any)(...args);
}

export function runnerEncounterActionHostForState(...args: any[]): any {
  return (flowRuntimeHosts.runnerEncounterActionHostForState as any)(...args);
}

export function runMovementHostForState(...args: any[]): any {
  return (flowRuntimeHosts.runMovementHostForState as any)(...args);
}

export function runRezWindowHostForState(...args: any[]): any {
  return (flowRuntimeHosts.runRezWindowHostForState as any)(...args);
}

export function fortPassWindowHostForState(...args: any[]): any {
  return (flowRuntimeHosts.fortPassWindowHostForState as any)(...args);
}

export function fortRunSideFamiliesHostForState(...args: any[]): any {
  return (flowRuntimeHosts.fortRunSideFamiliesHostForState as any)(...args);
}

export function encounterEntryHostForState(...args: any[]): any {
  return (flowRuntimeHosts.encounterEntryHostForState as any)(...args);
}

export function successfulRunInterventionHost(...args: any[]): any {
  return (flowRuntimeHosts.successfulRunInterventionHost as any)(...args);
}

export function encounterResolutionHostForState(...args: any[]): any {
  return (flowRuntimeHosts.encounterResolutionHostForState as any)(...args);
}

export function encounterSpecialWindowHostForState(...args: any[]): any {
  return (flowRuntimeHosts.encounterSpecialWindowHostForState as any)(...args);
}

export function encounterPrintedEffectHostForState(...args: any[]): any {
  return (flowRuntimeHosts.encounterPrintedEffectHostForState as any)(...args);
}

export function encounterPrintedNonTraceHostForState(...args: any[]): any {
  return (flowRuntimeHosts.encounterPrintedNonTraceHostForState as any)(...args);
}

export function runEndCleanupHost(...args: any[]): any {
  return (flowRuntimeHosts.runEndCleanupHost as any)(...args);
}

export function runnerBreakerActionExecutionHost(...args: any[]): any {
  return (flowRuntimeHosts.runnerBreakerActionExecutionHost as any)(...args);
}

export function startRunActionExecutionHost(...args: any[]): any {
  return (flowRuntimeHosts.startRunActionExecutionHost as any)(...args);
}

export function rezActionExecutionHost(...args: any[]): any {
  return (flowRuntimeHosts.rezActionExecutionHost as any)(...args);
}

export function playCardExecutionHost(...args: any[]): any {
  return (actionRuntimeHosts.playCardExecutionHost as any)(...args);
}

export function corpOperationResolutionHost(...args: any[]): any {
  return (actionRuntimeHosts.corpOperationResolutionHost as any)(...args);
}

export function boardStateActionExecutionHost(...args: any[]): any {
  return (actionRuntimeHosts.boardStateActionExecutionHost as any)(...args);
}

export function breachStateHost(...args: any[]): any {
  return (flowRuntimeHosts.breachStateHost as any)(...args);
}

export function accessFlowHost(...args: any[]): any {
  return (flowRuntimeHosts.accessFlowHost as any)(...args);
}

export function runAccessTransitionHost(...args: any[]): any {
  return (flowRuntimeHosts.runAccessTransitionHost as any)(...args);
}

export function hasHiddenResourceAccessStartActions(...args: any[]): any {
  return (actionRuntimeHosts.hasHiddenResourceAccessStartActions as any)(...args);
}

export function accessEffectHandlerHost(...args: any[]): any {
  return (flowRuntimeHosts.accessEffectHandlerHost as any)(...args);
}

export function pushCorpTraceDamageOrCardImplementationActions(...args: any[]): any {
  return (actionRuntimeHosts.pushCorpTraceDamageOrCardImplementationActions as any)(...args);
}

export function hiddenZoneSearchHandlerHostBase(...args: any[]): any {
  return (choiceHiddenZoneRuntime.hiddenZoneSearchHandlerHostBase as any)(...args);
}

export function hiddenZoneSearchActivationTargetHost(...args: any[]): any {
  return (choiceHiddenZoneRuntime.hiddenZoneSearchActivationTargetHost as any)(...args);
}

export function hiddenZoneSearchChoiceHandlerHost(...args: any[]): any {
  return (choiceHiddenZoneRuntime.hiddenZoneSearchChoiceHandlerHost as any)(...args);
}

export function hiddenZoneSearchActivationHandlerHost(...args: any[]): any {
  return (choiceHiddenZoneRuntime.hiddenZoneSearchActivationHandlerHost as any)(...args);
}

export function hiddenZoneArrangeChoiceHandlerHost(...args: any[]): any {
  return (choiceHiddenZoneRuntime.hiddenZoneArrangeChoiceHandlerHost as any)(...args);
}

export function hiddenZoneNonSearchChoiceHandlerHost(...args: any[]): any {
  return (choiceHiddenZoneRuntime.hiddenZoneNonSearchChoiceHandlerHost as any)(...args);
}

export function corpZoneChoiceHandlerHost(...args: any[]): any {
  return (choiceHiddenZoneRuntime.corpZoneChoiceHandlerHost as any)(...args);
}

export function pendingChoiceResolutionHost(...args: any[]): any {
  return (choiceHiddenZoneRuntime.pendingChoiceResolutionHost as any)(...args);
}

export function setupMulliganChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.setupMulliganChoice as any)(...args);
}

export function discardChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.discardChoice as any)(...args);
}

export function resolveDiscardChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveDiscardChoice as any)(...args);
}

export function resolveSetupMulliganChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveSetupMulliganChoice as any)(...args);
}

export function takeSetupMulligan(...args: any[]): any {
  return (choiceHiddenZoneRuntime.takeSetupMulligan as any)(...args);
}

export function installRunnerProgramFromStackWithoutClick(...args: any[]): any {
  return (choiceHiddenZoneRuntime.installRunnerProgramFromStackWithoutClick as any)(...args);
}

export function canInstallRunnerProgramFromZone(...args: any[]): any {
  return (choiceHiddenZoneRuntime.canInstallRunnerProgramFromZone as any)(...args);
}

export function installRunnerProgramFromZoneWithoutClick(...args: any[]): any {
  return (choiceHiddenZoneRuntime.installRunnerProgramFromZoneWithoutClick as any)(...args);
}

export function startSelfModifyingCodeFreeMuChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startSelfModifyingCodeFreeMuChoice as any)(...args);
}

export function installRunnerProgramForFree(...args: any[]): any {
  return (choiceHiddenZoneRuntime.installRunnerProgramForFree as any)(...args);
}

export function startAnonymousTipDerezBlackIceChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startAnonymousTipDerezBlackIceChoice as any)(...args);
}

export function resolveAnonymousTipDerezBlackIceChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveAnonymousTipDerezBlackIceChoice as any)(...args);
}

export function startCoreCommandJettisonIceChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startCoreCommandJettisonIceChoice as any)(...args);
}

export function resolveCoreCommandJettisonIceChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveCoreCommandJettisonIceChoice as any)(...args);
}

export function publicIcePositionLabelForCard(...args: any[]): any {
  return (choiceHiddenZoneRuntime.publicIcePositionLabelForCard as any)(...args);
}

export function publicIceSelectionLabelForCard(...args: any[]): any {
  return (choiceHiddenZoneRuntime.publicIceSelectionLabelForCard as any)(...args);
}

export function startForgedActivationOrdersTargetChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startForgedActivationOrdersTargetChoice as any)(...args);
}

export function resolveForgedActivationOrdersTargetChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveForgedActivationOrdersTargetChoice as any)(...args);
}

export function resolveForgedActivationOrdersCorpChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveForgedActivationOrdersCorpChoice as any)(...args);
}

export function startSecurityCodeWormChipTrashIceChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startSecurityCodeWormChipTrashIceChoice as any)(...args);
}

export function resolveSecurityCodeWormChipTrashIceChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveSecurityCodeWormChipTrashIceChoice as any)(...args);
}

export function startOpenEndedMileageProgramReturnChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startOpenEndedMileageProgramReturnChoice as any)(...args);
}

export function resolveOpenEndedMileageProgramReturnChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveOpenEndedMileageProgramReturnChoice as any)(...args);
}

export function corpAgendaPointTotal(...args: any[]): any {
  return (choiceHiddenZoneRuntime.corpAgendaPointTotal as any)(...args);
}

export function chooseCorpAgendasForPointCost(...args: any[]): any {
  return (choiceHiddenZoneRuntime.chooseCorpAgendasForPointCost as any)(...args);
}

export function startRunnerHostingChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startRunnerHostingChoice as any)(...args);
}

export function resolveRunnerHostingChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveRunnerHostingChoice as any)(...args);
}

export function resolveIncubatorTransformChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveIncubatorTransformChoice as any)(...args);
}

export function resolveChimeraDaemonTrashChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveChimeraDaemonTrashChoice as any)(...args);
}

export function resolveCardImplementationAccessPaymentChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveCardImplementationAccessPaymentChoice as any)(...args);
}

export function resolveProteusRunnerProgramReturnChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveProteusRunnerProgramReturnChoice as any)(...args);
}

export function selectedChoiceCardIds(...args: any[]): any {
  return (choiceHiddenZoneRuntime.selectedChoiceCardIds as any)(...args);
}

export function iceChoiceLabelForSide(...args: any[]): any {
  return (choiceHiddenZoneRuntime.iceChoiceLabelForSide as any)(...args);
}

export function resolveP358HiddenReplacementChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveP358HiddenReplacementChoice as any)(...args);
}

export function installedRunnerConnectionIds(...args: any[]): any {
  return (choiceHiddenZoneRuntime.installedRunnerConnectionIds as any)(...args);
}

export function canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity(...args: any[]): any {
  return (choiceHiddenZoneRuntime.canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity as any)(...args);
}

export function resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent as any)(...args);
}

export function parseRunnerInstalledConnectionTrashBadPublicityChoiceSource(...args: any[]): any {
  return (choiceHiddenZoneRuntime.parseRunnerInstalledConnectionTrashBadPublicityChoiceSource as any)(...args);
}

export function selectedChoiceCardIdsForChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.selectedChoiceCardIdsForChoice as any)(...args);
}

export function resolveRunnerInstalledConnectionTrashBadPublicityChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveRunnerInstalledConnectionTrashBadPublicityChoice as any)(...args);
}

export function resolvePlayfulAiDiceLoopEvent(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolvePlayfulAiDiceLoopEvent as any)(...args);
}

export function startV1921PlayfulAiChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startV1921PlayfulAiChoice as any)(...args);
}

export function creditTextForPrompt(...args: any[]): any {
  return (choiceHiddenZoneRuntime.creditTextForPrompt as any)(...args);
}

export function diePromptText(...args: any[]): any {
  return (choiceHiddenZoneRuntime.diePromptText as any)(...args);
}

export function playfulAiSplitOptions(...args: any[]): any {
  return (choiceHiddenZoneRuntime.playfulAiSplitOptions as any)(...args);
}

export function parsePlayfulAiChoiceSource(...args: any[]): any {
  return (choiceHiddenZoneRuntime.parsePlayfulAiChoiceSource as any)(...args);
}

export function parsePlayfulAiSplit(...args: any[]): any {
  return (choiceHiddenZoneRuntime.parsePlayfulAiSplit as any)(...args);
}

export function continueV1921PlayfulAiLoop(...args: any[]): any {
  return (choiceHiddenZoneRuntime.continueV1921PlayfulAiLoop as any)(...args);
}

export function resolveV1921PlayfulAiChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveV1921PlayfulAiChoice as any)(...args);
}

export function shuffleRunnerStack(...args: any[]): any {
  return (choiceHiddenZoneRuntime.shuffleRunnerStack as any)(...args);
}

export function revealRunnerStackTop(...args: any[]): any {
  return (choiceHiddenZoneRuntime.revealRunnerStackTop as any)(...args);
}

export function revealCorpRdTop(...args: any[]): any {
  return (choiceHiddenZoneRuntime.revealCorpRdTop as any)(...args);
}

export function resolveV1911RunnerHiddenZoneAbility(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveV1911RunnerHiddenZoneAbility as any)(...args);
}

export function resolveV1911CorporateDownsizing(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveV1911CorporateDownsizing as any)(...args);
}

export function exposedCorpCardInServer(...args: any[]): any {
  return (choiceHiddenZoneRuntime.exposedCorpCardInServer as any)(...args);
}

export function exposeCorpCardInServer(...args: any[]): any {
  return (choiceHiddenZoneRuntime.exposeCorpCardInServer as any)(...args);
}

export function installedCorpCardServerContext(...args: any[]): any {
  return (choiceHiddenZoneRuntime.installedCorpCardServerContext as any)(...args);
}

export function exposeInstalledCorpCardTargets(...args: any[]): any {
  return (choiceHiddenZoneRuntime.exposeInstalledCorpCardTargets as any)(...args);
}

export function exposeInstalledCorpCardLabel(...args: any[]): any {
  return (choiceHiddenZoneRuntime.exposeInstalledCorpCardLabel as any)(...args);
}

export function exposeInstalledCorpCardForImplementation(...args: any[]): any {
  return (choiceHiddenZoneRuntime.exposeInstalledCorpCardForImplementation as any)(...args);
}

export function installedRunnerIcebreakerIds(...args: any[]): any {
  return (choiceHiddenZoneRuntime.installedRunnerIcebreakerIds as any)(...args);
}

export function addCounterToAllInstalledRunnerIcebreakers(...args: any[]): any {
  return (choiceHiddenZoneRuntime.addCounterToAllInstalledRunnerIcebreakers as any)(...args);
}

export function shuffleCorpCardIntoRd(...args: any[]): any {
  return (choiceHiddenZoneRuntime.shuffleCorpCardIntoRd as any)(...args);
}

export function trashCorpInstalledCardsInScoredSourceServer(...args: any[]): any {
  return (choiceHiddenZoneRuntime.trashCorpInstalledCardsInScoredSourceServer as any)(...args);
}

export function resolveDealWithMilitech(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveDealWithMilitech as any)(...args);
}

export function huntClubBbsExposeTargets(...args: any[]): any {
  return (choiceHiddenZoneRuntime.huntClubBbsExposeTargets as any)(...args);
}

export function huntClubBbsExposeOptionLabel(...args: any[]): any {
  return (choiceHiddenZoneRuntime.huntClubBbsExposeOptionLabel as any)(...args);
}

export function exposeInstalledCorpCardsChoiceOptions(...args: any[]): any {
  return (choiceHiddenZoneRuntime.exposeInstalledCorpCardsChoiceOptions as any)(...args);
}

export function startHuntClubBbsExposeChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startHuntClubBbsExposeChoice as any)(...args);
}

export function startExposeInstalledCorpCardsChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startExposeInstalledCorpCardsChoice as any)(...args);
}

export function resolveHuntClubBbsExposeChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveHuntClubBbsExposeChoice as any)(...args);
}

export function resolveExposeInstalledCorpCardsChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveExposeInstalledCorpCardsChoice as any)(...args);
}

export function outermostIceExposures(...args: any[]): any {
  return (choiceHiddenZoneRuntime.outermostIceExposures as any)(...args);
}

export function exposeOutermostIceOfEachDataFort(...args: any[]): any {
  return (choiceHiddenZoneRuntime.exposeOutermostIceOfEachDataFort as any)(...args);
}

export function swapCorpHqAndRdTop(...args: any[]): any {
  return (stateCorpRuntimeResolvers.swapCorpHqAndRdTop as any)(...args);
}

export function spendKrumzTraceBits(...args: any[]): any {
  return (stateCorpRuntimeResolvers.spendKrumzTraceBits as any)(...args);
}

export function resolveTraceHardwareWreckerSuccess(...args: any[]): any {
  return (stateRuntimeResolvers.resolveTraceHardwareWreckerSuccess as any)(...args);
}

export function resolveTraceTrashRunnerResourceSuccess(...args: any[]): any {
  return (stateRuntimeResolvers.resolveTraceTrashRunnerResourceSuccess as any)(...args);
}

export function encounterTemporaryTraceCreditsAvailable(...args: any[]): any {
  return (stateRuntimeResolvers.encounterTemporaryTraceCreditsAvailable as any)(...args);
}

export function spendEncounterTemporaryTraceCredits(...args: any[]): any {
  return (stateRuntimeResolvers.spendEncounterTemporaryTraceCredits as any)(...args);
}

export function identityModifierAmount(...args: any[]): any {
  return (stateRuntimeResolvers.identityModifierAmount as any)(...args);
}

export function identityDefinition(...args: any[]): any {
  return (stateRuntimeResolvers.identityDefinition as any)(...args);
}

export function executeEffectCommands(...args: any[]): any {
  return (stateRuntimeResolvers.executeEffectCommands as any)(...args);
}

export function assertNonNegativeAmount(...args: any[]): any {
  return (stateRuntimeResolvers.assertNonNegativeAmount as any)(...args);
}

export function assertPositiveIntegerAmount(...args: any[]): any {
  return (stateRuntimeResolvers.assertPositiveIntegerAmount as any)(...args);
}

export function withoutVariableIceState(...args: any[]): any {
  return (stateRuntimeResolvers.withoutVariableIceState as any)(...args);
}

export function clickCostForAction(...args: any[]): any {
  return (stateRuntimeResolvers.clickCostForAction as any)(...args);
}

export function creditCostForAction(...args: any[]): any {
  return (stateRuntimeResolvers.creditCostForAction as any)(...args);
}

export function runnerActionsPerTurn(...args: any[]): any {
  return (stateRuntimeResolvers.runnerActionsPerTurn as any)(...args);
}

export function agendaPoints(...args: any[]): any {
  return (stateRuntimeResolvers.agendaPoints as any)(...args);
}

export function addVirusCounterWithDisinfectantPrevention(...args: any[]): any {
  return (stateRuntimeResolvers.addVirusCounterWithDisinfectantPrevention as any)(...args);
}

export function preventOneVirusCounterWithDisinfectant(...args: any[]): any {
  return (stateRuntimeResolvers.preventOneVirusCounterWithDisinfectant as any)(...args);
}

export function addVisibleCardCounter(...args: any[]): any {
  return (stateRuntimeResolvers.addVisibleCardCounter as any)(...args);
}

export function spendVisibleCardCounter(...args: any[]): any {
  return (stateRuntimeResolvers.spendVisibleCardCounter as any)(...args);
}

export function totalCounters(...args: any[]): any {
  return (stateRuntimeResolvers.totalCounters as any)(...args);
}

export function installedCodeViralCacheIds(...args: any[]): any {
  return (stateRuntimeResolvers.installedCodeViralCacheIds as any)(...args);
}

export function codeViralCachePurgePreserveTargets(...args: any[]): any {
  return (stateRuntimeResolvers.codeViralCachePurgePreserveTargets as any)(...args);
}

export function startCodeViralCachePurgeChoice(...args: any[]): any {
  return (stateRuntimeResolvers.startCodeViralCachePurgeChoice as any)(...args);
}

export function parseCodeViralCachePreserveOption(...args: any[]): any {
  return (stateRuntimeResolvers.parseCodeViralCachePreserveOption as any)(...args);
}

export function restoreCodeViralCachePreservedCounters(...args: any[]): any {
  return (stateRuntimeResolvers.restoreCodeViralCachePreservedCounters as any)(...args);
}

export function resolveCodeViralCachePurgeChoice(...args: any[]): any {
  return (stateRuntimeResolvers.resolveCodeViralCachePurgeChoice as any)(...args);
}

export function microtechBackupDriveIds(...args: any[]): any {
  return (stateRuntimeResolvers.microtechBackupDriveIds as any)(...args);
}

export function availableRunnerProgramInstallCredits(...args: any[]): any {
  return (stateRuntimeResolvers.availableRunnerProgramInstallCredits as any)(...args);
}

export function runnerCanPayInstallCost(...args: any[]): any {
  return (stateRuntimeResolvers.runnerCanPayInstallCost as any)(...args);
}

export function runnerCostPenaltySupportCreditCapacity(...args: any[]): any {
  return (stateRuntimeResolvers.runnerCostPenaltySupportCreditCapacity as any)(...args);
}

export function openRunnerCostPenaltySupportWindow(...args: any[]): any {
  return (stateRuntimeResolvers.openRunnerCostPenaltySupportWindow as any)(...args);
}

export function closeRunnerCostPenaltySupportWindowForPayment(...args: any[]): any {
  return (stateRuntimeResolvers.closeRunnerCostPenaltySupportWindowForPayment as any)(...args);
}

export function runnerRecurringCredits(...args: any[]): any {
  return (stateRuntimeResolvers.runnerRecurringCredits as any)(...args);
}

export function runnerProgramInstallRecurringCreditSourceIds(...args: any[]): any {
  return (stateRuntimeResolvers.runnerProgramInstallRecurringCreditSourceIds as any)(...args);
}

export function spendRunnerInstallCredits(...args: any[]): any {
  return (stateRuntimeResolvers.spendRunnerInstallCredits as any)(...args);
}

export function runnerTagRemovalRecurringCreditSourceIds(...args: any[]): any {
  return (stateRuntimeResolvers.runnerTagRemovalRecurringCreditSourceIds as any)(...args);
}

export function runnerTagRemovalRecurringCredits(...args: any[]): any {
  return (stateRuntimeResolvers.runnerTagRemovalRecurringCredits as any)(...args);
}

export function availableRunnerTagRemovalCredits(...args: any[]): any {
  return (stateRuntimeResolvers.availableRunnerTagRemovalCredits as any)(...args);
}

export function spendRunnerTagRemovalCredits(...args: any[]): any {
  return (stateRuntimeResolvers.spendRunnerTagRemovalCredits as any)(...args);
}

export function refreshRecurringCredits(...args: any[]): any {
  return (stateRuntimeResolvers.refreshRecurringCredits as any)(...args);
}
