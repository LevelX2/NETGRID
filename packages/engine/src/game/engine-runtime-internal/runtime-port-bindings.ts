/**
 * Live, statically typed bindings used by the bootstrap modules.
 * Composition installs every binding before the public engine API is used.
 */
import type { RuntimePortGroups } from "./runtime-port-contracts";

export let corpRunnerActionPaidWindowActions: RuntimePortGroups["actionRuntimeHosts"]["corpRunnerActionPaidWindowActions"];
export let runnerRunSpecialEffectActions: RuntimePortGroups["actionRuntimeHosts"]["runnerRunSpecialEffectActions"];
export let specialZoneHarnessActions: RuntimePortGroups["actionRuntimeHosts"]["specialZoneHarnessActions"];
export let turnBasicExecutionHost: RuntimePortGroups["actionRuntimeHosts"]["turnBasicExecutionHost"];
export let creditEconomyExecutionHost: RuntimePortGroups["actionRuntimeHosts"]["creditEconomyExecutionHost"];
export let resolveEndTurnTagIfRunnerReceivedTag: RuntimePortGroups["turnRuntimeResolvers"]["resolveEndTurnTagIfRunnerReceivedTag"];
export let resumeEndTurnAfterTagPrevention: RuntimePortGroups["turnRuntimeResolvers"]["resumeEndTurnAfterTagPrevention"];
export let resolveFieldReporterEndOfRunnerTurn: RuntimePortGroups["turnRuntimeResolvers"]["resolveFieldReporterEndOfRunnerTurn"];
export let resolveDelayedEndTurnDamageEffects: RuntimePortGroups["turnRuntimeResolvers"]["resolveDelayedEndTurnDamageEffects"];
export let endTurn: RuntimePortGroups["turnRuntimeResolvers"]["endTurn"];
export let resolveTemporaryProgramInstallReturns: RuntimePortGroups["turnRuntimeResolvers"]["resolveTemporaryProgramInstallReturns"];
export let resolveCorpObligationEndOfTurn: RuntimePortGroups["turnRuntimeResolvers"]["resolveCorpObligationEndOfTurn"];
export let startDiscardPhase: RuntimePortGroups["turnRuntimeResolvers"]["startDiscardPhase"];
export let processDiscardStep: RuntimePortGroups["turnRuntimeResolvers"]["processDiscardStep"];
export let completeDiscardPhase: RuntimePortGroups["turnRuntimeResolvers"]["completeDiscardPhase"];
export let appendResolvedEffectsToPayload: RuntimePortGroups["turnRuntimeResolvers"]["appendResolvedEffectsToPayload"];
export let automaticGainCreditsEffect: RuntimePortGroups["turnRuntimeResolvers"]["automaticGainCreditsEffect"];
export let automaticLoseCreditsEffect: RuntimePortGroups["turnRuntimeResolvers"]["automaticLoseCreditsEffect"];
export let automaticDrawCardsEffect: RuntimePortGroups["turnRuntimeResolvers"]["automaticDrawCardsEffect"];
export let automaticTagEffect: RuntimePortGroups["turnRuntimeResolvers"]["automaticTagEffect"];
export let automaticTrashCardEffect: RuntimePortGroups["turnRuntimeResolvers"]["automaticTrashCardEffect"];
export let automaticCounterChangeEffect: RuntimePortGroups["turnRuntimeResolvers"]["automaticCounterChangeEffect"];
export let automaticStealAgendaEffect: RuntimePortGroups["turnRuntimeResolvers"]["automaticStealAgendaEffect"];
export let publicCardTitle: RuntimePortGroups["turnRuntimeResolvers"]["publicCardTitle"];
export let applyRunnerForgoNextAction: RuntimePortGroups["turnRuntimeResolvers"]["applyRunnerForgoNextAction"];
export let addRunnerFutureActionDebt: RuntimePortGroups["turnRuntimeResolvers"]["addRunnerFutureActionDebt"];
export let consumeRunnerFutureActionDebt: RuntimePortGroups["turnRuntimeResolvers"]["consumeRunnerFutureActionDebt"];
export let filterActionsForRestrictedExtraActions: RuntimePortGroups["turnRuntimeResolvers"]["filterActionsForRestrictedExtraActions"];
export let consumeRestrictedExtraActionForAction: RuntimePortGroups["turnRuntimeResolvers"]["consumeRestrictedExtraActionForAction"];
export let acceptExtraActionOffer: RuntimePortGroups["turnRuntimeResolvers"]["acceptExtraActionOffer"];
export let declineExtraActionOffer: RuntimePortGroups["turnRuntimeResolvers"]["declineExtraActionOffer"];
export let resolvePdcaCounterAction: RuntimePortGroups["turnRuntimeResolvers"]["resolvePdcaCounterAction"];
export let resolveForcedActionNotPossible: RuntimePortGroups["turnRuntimeResolvers"]["resolveForcedActionNotPossible"];
export let startCorpTurn: RuntimePortGroups["turnRuntimeResolvers"]["startCorpTurn"];
export let startRunnerTurn: RuntimePortGroups["turnRuntimeResolvers"]["startRunnerTurn"];
export let resumeStartOfTurnAfterTagPrevention: RuntimePortGroups["turnRuntimeResolvers"]["resumeStartOfTurnAfterTagPrevention"];
export let untapRunnerCardsAtTurnStart: RuntimePortGroups["turnRuntimeResolvers"]["untapRunnerCardsAtTurnStart"];
export let resolveDelayedAccessEffects: RuntimePortGroups["turnRuntimeResolvers"]["resolveDelayedAccessEffects"];
export let applyCorpStartOfTurnEffects: RuntimePortGroups["turnRuntimeResolvers"]["applyCorpStartOfTurnEffects"];
export let openCorpStartTurnRestrictedActionOffers: RuntimePortGroups["turnRuntimeResolvers"]["openCorpStartTurnRestrictedActionOffers"];
export let applyPurgeableRunnerVirusCorpStartEffects: RuntimePortGroups["turnRuntimeResolvers"]["applyPurgeableRunnerVirusCorpStartEffects"];
export let virusCounterDrawsAtCorpStart: RuntimePortGroups["turnRuntimeResolvers"]["virusCounterDrawsAtCorpStart"];
export let skivvissCounterTotal: RuntimePortGroups["turnRuntimeResolvers"]["skivvissCounterTotal"];
export let virusCounterCascadeTrashAtCorpStart: RuntimePortGroups["turnRuntimeResolvers"]["virusCounterCascadeTrashAtCorpStart"];
export let trashTopRdCardsFaceupForCascade: RuntimePortGroups["turnRuntimeResolvers"]["trashTopRdCardsFaceupForCascade"];
export let applyRunnerStartOfTurnEffects: RuntimePortGroups["turnRuntimeResolvers"]["applyRunnerStartOfTurnEffects"];
export let applyStartTurnRandomEffectTables: RuntimePortGroups["turnRuntimeResolvers"]["applyStartTurnRandomEffectTables"];
export let virusCounterCreditsAtRunnerStart: RuntimePortGroups["turnRuntimeResolvers"]["virusCounterCreditsAtRunnerStart"];
export let startVirusCounterRunnerPrivateLookAtStart: RuntimePortGroups["turnRuntimeResolvers"]["startVirusCounterRunnerPrivateLookAtStart"];
export let randomCorpHqCardsWithoutReplacement: RuntimePortGroups["turnRuntimeResolvers"]["randomCorpHqCardsWithoutReplacement"];
export let startRunnerPrivateLookAtSpecificCorpCards: RuntimePortGroups["turnRuntimeResolvers"]["startRunnerPrivateLookAtSpecificCorpCards"];
export let queueIncubatorStartOfTurnTransforms: RuntimePortGroups["turnRuntimeResolvers"]["queueIncubatorStartOfTurnTransforms"];
export let startIncubatorTransformChoice: RuntimePortGroups["turnRuntimeResolvers"]["startIncubatorTransformChoice"];
export let forfeitRunnerAgendaForPointCost: RuntimePortGroups["corpRuntimeResolvers"]["forfeitRunnerAgendaForPointCost"];
export let forfeitCorpAgendaForPointCost: RuntimePortGroups["corpRuntimeResolvers"]["forfeitCorpAgendaForPointCost"];
export let activeObligationCount: RuntimePortGroups["corpRuntimeResolvers"]["activeObligationCount"];
export let addActiveObligation: RuntimePortGroups["corpRuntimeResolvers"]["addActiveObligation"];
export let removeActiveObligation: RuntimePortGroups["corpRuntimeResolvers"]["removeActiveObligation"];
export let spendCorpAgendaPointCost: RuntimePortGroups["corpRuntimeResolvers"]["spendCorpAgendaPointCost"];
export let installedAgendaOperationTarget: RuntimePortGroups["corpRuntimeResolvers"]["installedAgendaOperationTarget"];
export let corpAgendaCounterOperationTarget: RuntimePortGroups["corpRuntimeResolvers"]["corpAgendaCounterOperationTarget"];
export let corpScoredAgendaForfeitTargets: RuntimePortGroups["corpRuntimeResolvers"]["corpScoredAgendaForfeitTargets"];
export let hardwareTrashByCounterEligibleHardwareIds: RuntimePortGroups["corpRuntimeResolvers"]["hardwareTrashByCounterEligibleHardwareIds"];
export let hardwareTrashByCounterLegalActions: RuntimePortGroups["corpRuntimeResolvers"]["hardwareTrashByCounterLegalActions"];
export let hardwareTrashByCounterTrashCountFromPayload: RuntimePortGroups["corpRuntimeResolvers"]["hardwareTrashByCounterTrashCountFromPayload"];
export let resolveHardwareTrashByCounterOperation: RuntimePortGroups["corpRuntimeResolvers"]["resolveHardwareTrashByCounterOperation"];
export let startHardwareTrashByCounterChoice: RuntimePortGroups["corpRuntimeResolvers"]["startHardwareTrashByCounterChoice"];
export let hardwareTrashByCounterTrashCountFromChoiceSource: RuntimePortGroups["corpRuntimeResolvers"]["hardwareTrashByCounterTrashCountFromChoiceSource"];
export let resolveHardwareTrashByCounterChoice: RuntimePortGroups["corpRuntimeResolvers"]["resolveHardwareTrashByCounterChoice"];
export let trashHardwareByCounter: RuntimePortGroups["corpRuntimeResolvers"]["trashHardwareByCounter"];
export let advancementPlacementLegalActions: RuntimePortGroups["corpRuntimeResolvers"]["advancementPlacementLegalActions"];
export let resolveAgendaCounterOperation: RuntimePortGroups["corpRuntimeResolvers"]["resolveAgendaCounterOperation"];
export let resolveAdvancementPlacementOperation: RuntimePortGroups["corpRuntimeResolvers"]["resolveAdvancementPlacementOperation"];
export let advancementPlacementOptions: RuntimePortGroups["corpRuntimeResolvers"]["advancementPlacementOptions"];
export let startAdvancementPlacementChoice: RuntimePortGroups["corpRuntimeResolvers"]["startAdvancementPlacementChoice"];
export let resolveAdvancementPlacementChoice: RuntimePortGroups["corpRuntimeResolvers"]["resolveAdvancementPlacementChoice"];
export let applyAdvancementCounterPlacement: RuntimePortGroups["corpRuntimeResolvers"]["applyAdvancementCounterPlacement"];
export let advanceableInstalledCardTargets: RuntimePortGroups["corpRuntimeResolvers"]["advanceableInstalledCardTargets"];
export let isInstalledCorpCardAdvanceable: RuntimePortGroups["corpRuntimeResolvers"]["isInstalledCorpCardAdvanceable"];
export let advancementDistributionOptions: RuntimePortGroups["corpRuntimeResolvers"]["advancementDistributionOptions"];
export let startCardImplementationAdvancementDistributionChoice: RuntimePortGroups["corpRuntimeResolvers"]["startCardImplementationAdvancementDistributionChoice"];
export let parseAdvancementDistributionValue: RuntimePortGroups["corpRuntimeResolvers"]["parseAdvancementDistributionValue"];
export let sourcePartsForP334Choice: RuntimePortGroups["corpRuntimeResolvers"]["sourcePartsForP334Choice"];
export let validateAdvancementDistribution: RuntimePortGroups["corpRuntimeResolvers"]["validateAdvancementDistribution"];
export let resolveCardImplementationAdvancementDistributionChoice: RuntimePortGroups["corpRuntimeResolvers"]["resolveCardImplementationAdvancementDistributionChoice"];
export let movableAdvancementSourceIds: RuntimePortGroups["corpRuntimeResolvers"]["movableAdvancementSourceIds"];
export let moveAdvancementOptions: RuntimePortGroups["corpRuntimeResolvers"]["moveAdvancementOptions"];
export let startCardImplementationMoveAdvancementChoice: RuntimePortGroups["corpRuntimeResolvers"]["startCardImplementationMoveAdvancementChoice"];
export let resolveCardImplementationMoveAdvancementChoice: RuntimePortGroups["corpRuntimeResolvers"]["resolveCardImplementationMoveAdvancementChoice"];
export let resolveCorpOperationAddAdvancementCounters: RuntimePortGroups["corpRuntimeResolvers"]["resolveCorpOperationAddAdvancementCounters"];
export let awardRunnerEventAgendaPoint: RuntimePortGroups["corpRuntimeResolvers"]["awardRunnerEventAgendaPoint"];
export let choiceAction: RuntimePortGroups["corpRuntimeResolvers"]["choiceAction"];
export let abilityMetadata: RuntimePortGroups["corpRuntimeResolvers"]["abilityMetadata"];
export let resolveCorpInstalledEconomyAction: RuntimePortGroups["corpRuntimeResolvers"]["resolveCorpInstalledEconomyAction"];
export let validateCorpInstalledEconomyAction: RuntimePortGroups["corpRuntimeResolvers"]["validateCorpInstalledEconomyAction"];
export let rezzedCorpInstalledEconomyCreditSourceIds: RuntimePortGroups["corpRuntimeResolvers"]["rezzedCorpInstalledEconomyCreditSourceIds"];
export let shouldOpenCorpInstalledEconomyCreditChoice: RuntimePortGroups["corpRuntimeResolvers"]["shouldOpenCorpInstalledEconomyCreditChoice"];
export let startCorpInstalledEconomyCreditChoice: RuntimePortGroups["corpRuntimeResolvers"]["startCorpInstalledEconomyCreditChoice"];
export let resolveCorpInstalledEconomyCreditChoice: RuntimePortGroups["corpRuntimeResolvers"]["resolveCorpInstalledEconomyCreditChoice"];
export let corpInstallRezSequenceHandlerHost: RuntimePortGroups["actionRuntimeHosts"]["corpInstallRezSequenceHandlerHost"];
export let scoredAgendaFlowHost: RuntimePortGroups["actionRuntimeHosts"]["scoredAgendaFlowHost"];
export let scoredAgendaAbilityHost: RuntimePortGroups["actionRuntimeHosts"]["scoredAgendaAbilityHost"];
export let corpTraceDamageAbilityHost: RuntimePortGroups["actionRuntimeHosts"]["corpTraceDamageAbilityHost"];
export let corpSpecialDamageAbilityHost: RuntimePortGroups["actionRuntimeHosts"]["corpSpecialDamageAbilityHost"];
export let playCardExecutionHost: RuntimePortGroups["actionRuntimeHosts"]["playCardExecutionHost"];
export let corpOperationResolutionHost: RuntimePortGroups["actionRuntimeHosts"]["corpOperationResolutionHost"];
export let boardStateActionExecutionHost: RuntimePortGroups["actionRuntimeHosts"]["boardStateActionExecutionHost"];
export let hasHiddenResourceAccessStartActions: RuntimePortGroups["actionRuntimeHosts"]["hasHiddenResourceAccessStartActions"];
export let pushCorpTraceDamageOrCardImplementationActions: RuntimePortGroups["actionRuntimeHosts"]["pushCorpTraceDamageOrCardImplementationActions"];
export let openPostMeatDamageReactionWindow: RuntimePortGroups["cardRuntimeResolvers"]["openPostMeatDamageReactionWindow"];
export let postMeatDamageHiddenResourceCandidates: RuntimePortGroups["cardRuntimeResolvers"]["postMeatDamageHiddenResourceCandidates"];
export let resolvePostMeatDamageHiddenResourceChoice: RuntimePortGroups["cardRuntimeResolvers"]["resolvePostMeatDamageHiddenResourceChoice"];
export let randomCorpHqDiscard: RuntimePortGroups["cardRuntimeResolvers"]["randomCorpHqDiscard"];
export let installTargetBindingForDefinition: RuntimePortGroups["cardRuntimeResolvers"]["installTargetBindingForDefinition"];
export let requiresDataFortInstallTarget: RuntimePortGroups["cardRuntimeResolvers"]["requiresDataFortInstallTarget"];
export let runnerEventLongtailForDefinition: RuntimePortGroups["cardRuntimeResolvers"]["runnerEventLongtailForDefinition"];
export let variableRezForDefinition: RuntimePortGroups["cardRuntimeResolvers"]["variableRezForDefinition"];
export let runnerEventLongtailKindForDefinition: RuntimePortGroups["cardRuntimeResolvers"]["runnerEventLongtailKindForDefinition"];
export let runnerEventInstallChoiceActionPayload: RuntimePortGroups["cardRuntimeResolvers"]["runnerEventInstallChoiceActionPayload"];
export let hiddenReplacementLongtailForDefinition: RuntimePortGroups["cardRuntimeResolvers"]["hiddenReplacementLongtailForDefinition"];
export let cardImplementationRunnerEventResolver: RuntimePortGroups["cardRuntimeResolvers"]["cardImplementationRunnerEventResolver"];
export let printedCostCardImplementationMakeRunEffect: RuntimePortGroups["cardRuntimeResolvers"]["printedCostCardImplementationMakeRunEffect"];
export let scoredAgendaImplementationForDefinitionId: RuntimePortGroups["cardRuntimeResolvers"]["scoredAgendaImplementationForDefinitionId"];
export let scoredAgendaImplementationForDefinition: RuntimePortGroups["cardRuntimeResolvers"]["scoredAgendaImplementationForDefinition"];
export let scoredAgendaKindForDefinition: RuntimePortGroups["cardRuntimeResolvers"]["scoredAgendaKindForDefinition"];
export let emptyRunnerDrawSummary: RuntimePortGroups["cardRuntimeResolvers"]["emptyRunnerDrawSummary"];
export let mergeRunnerDrawSummary: RuntimePortGroups["cardRuntimeResolvers"]["mergeRunnerDrawSummary"];
export let applyRunnerDrawSummaryPayload: RuntimePortGroups["cardRuntimeResolvers"]["applyRunnerDrawSummaryPayload"];
export let runnerDrawSummaryPublicPayload: RuntimePortGroups["cardRuntimeResolvers"]["runnerDrawSummaryPublicPayload"];
export let selectedServerIcebreakerStrengthCounterBonus: RuntimePortGroups["cardRuntimeHosts"]["selectedServerIcebreakerStrengthCounterBonus"];
export let permanentIcebreakerStrengthCounterBonus: RuntimePortGroups["cardRuntimeHosts"]["permanentIcebreakerStrengthCounterBonus"];
export let pumpAmountForLegalAction: RuntimePortGroups["cardRuntimeHosts"]["pumpAmountForLegalAction"];
export let pumpAbilityForLegalAction: RuntimePortGroups["cardRuntimeHosts"]["pumpAbilityForLegalAction"];
export let breakAbilityForLegalAction: RuntimePortGroups["cardRuntimeHosts"]["breakAbilityForLegalAction"];
export let pumpDurationForLegalAction: RuntimePortGroups["cardRuntimeHosts"]["pumpDurationForLegalAction"];
export let assertCurrentSubroutineMatchesLegalAction: RuntimePortGroups["cardRuntimeHosts"]["assertCurrentSubroutineMatchesLegalAction"];
export let resolveMultiBreakSubroutinesAction: RuntimePortGroups["cardRuntimeHosts"]["resolveMultiBreakSubroutinesAction"];
export let assertBreakSubroutineCostQuoteValid: RuntimePortGroups["cardRuntimeHosts"]["assertBreakSubroutineCostQuoteValid"];
export let subroutinesForCurrentEncounter: RuntimePortGroups["cardRuntimeHosts"]["subroutinesForCurrentEncounter"];
export let variableTraceSubroutineForCurrentEncounter: RuntimePortGroups["cardRuntimeHosts"]["variableTraceSubroutineForCurrentEncounter"];
export let relativeDamageSubroutineForCurrentEncounter: RuntimePortGroups["cardRuntimeHosts"]["relativeDamageSubroutineForCurrentEncounter"];
export let relativeTraceSubroutinesForCurrentEncounter: RuntimePortGroups["cardRuntimeHosts"]["relativeTraceSubroutinesForCurrentEncounter"];
export let runCardImplementationActionHost: RuntimePortGroups["cardRuntimeHosts"]["runCardImplementationActionHost"];
export let runStartTaxForServerUpgrades: RuntimePortGroups["cardRuntimeHosts"]["runStartTaxForServerUpgrades"];
export let runStartTaxForCorpRootAssets: RuntimePortGroups["cardRuntimeHosts"]["runStartTaxForCorpRootAssets"];
export let spendRunnerAccessTrashCredits: RuntimePortGroups["cardRuntimeHosts"]["spendRunnerAccessTrashCredits"];
export let runnerSpecialTriggerExecutionHost: RuntimePortGroups["cardRuntimeHosts"]["runnerSpecialTriggerExecutionHost"];
export let runFortTriggerExecutionHost: RuntimePortGroups["cardRuntimeHosts"]["runFortTriggerExecutionHost"];
export let counterUtilityTriggerExecutionHost: RuntimePortGroups["cardRuntimeHosts"]["counterUtilityTriggerExecutionHost"];
export let triggerAbilityExecutionHost: RuntimePortGroups["cardRuntimeHosts"]["triggerAbilityExecutionHost"];
export let installCardHost: RuntimePortGroups["cardRuntimeHosts"]["installCardHost"];
export let rezCardHost: RuntimePortGroups["cardRuntimeHosts"]["rezCardHost"];
export let traceOrchestrationHost: RuntimePortGroups["cardRuntimeHosts"]["traceOrchestrationHost"];
export let activatedCardImplementationExecutionHost: RuntimePortGroups["cardRuntimeHosts"]["activatedCardImplementationExecutionHost"];
export let resolveRunnerTargetedEventImplementation: RuntimePortGroups["cardRuntimeHosts"]["resolveRunnerTargetedEventImplementation"];
export let resolvePostOnPlayGenericFollowups: RuntimePortGroups["cardRuntimeHosts"]["resolvePostOnPlayGenericFollowups"];
export let resolveRunnerGripHeapStackShuffleDrawEvent: RuntimePortGroups["cardRuntimeHosts"]["resolveRunnerGripHeapStackShuffleDrawEvent"];
export let shuffleGripTrashAndStackThenDrawForCardImplementation: RuntimePortGroups["cardRuntimeHosts"]["shuffleGripTrashAndStackThenDrawForCardImplementation"];
export let startRunnerProgramTrashBeforeInstallChoice: RuntimePortGroups["cardRuntimeHosts"]["startRunnerProgramTrashBeforeInstallChoice"];
export let resolveRunnerProgramTrashBeforeInstallChoice: RuntimePortGroups["cardRuntimeHosts"]["resolveRunnerProgramTrashBeforeInstallChoice"];
export let startRunnerPrivateLookChoice: RuntimePortGroups["choiceHiddenZoneResolvers"]["startRunnerPrivateLookChoice"];
export let resolveRunnerPrivateLookChoice: RuntimePortGroups["choiceHiddenZoneResolvers"]["resolveRunnerPrivateLookChoice"];
export let startPostAccessInstalledProgramChoice: RuntimePortGroups["choiceHiddenZoneResolvers"]["startPostAccessInstalledProgramChoice"];
export let v1915InstalledRevealHelperIds: RuntimePortGroups["choiceHiddenZoneResolvers"]["v1915InstalledRevealHelperIds"];
export let runnerHasInstalledDefinition: RuntimePortGroups["choiceHiddenZoneResolvers"]["runnerHasInstalledDefinition"];
export let trashOlderRegionUpgradesInServer: RuntimePortGroups["choiceHiddenZoneResolvers"]["trashOlderRegionUpgradesInServer"];
export let appendRegionReplacementTrashEffect: RuntimePortGroups["choiceHiddenZoneResolvers"]["appendRegionReplacementTrashEffect"];
export let hiddenZoneSearchHandlerHostBase: RuntimePortGroups["choiceHiddenZoneRuntime"]["hiddenZoneSearchHandlerHostBase"];
export let hiddenZoneSearchActivationTargetHost: RuntimePortGroups["choiceHiddenZoneRuntime"]["hiddenZoneSearchActivationTargetHost"];
export let hiddenZoneSearchChoiceHandlerHost: RuntimePortGroups["choiceHiddenZoneRuntime"]["hiddenZoneSearchChoiceHandlerHost"];
export let hiddenZoneSearchActivationHandlerHost: RuntimePortGroups["choiceHiddenZoneRuntime"]["hiddenZoneSearchActivationHandlerHost"];
export let hiddenZoneArrangeChoiceHandlerHost: RuntimePortGroups["choiceHiddenZoneRuntime"]["hiddenZoneArrangeChoiceHandlerHost"];
export let hiddenZoneNonSearchChoiceHandlerHost: RuntimePortGroups["choiceHiddenZoneRuntime"]["hiddenZoneNonSearchChoiceHandlerHost"];
export let corpZoneChoiceHandlerHost: RuntimePortGroups["choiceHiddenZoneRuntime"]["corpZoneChoiceHandlerHost"];
export let pendingChoiceResolutionHost: RuntimePortGroups["choiceHiddenZoneRuntime"]["pendingChoiceResolutionHost"];
export let setupMulliganChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["setupMulliganChoice"];
export let discardChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["discardChoice"];
export let resolveDiscardChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveDiscardChoice"];
export let resolveSetupMulliganChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveSetupMulliganChoice"];
export let takeSetupMulligan: RuntimePortGroups["choiceHiddenZoneRuntime"]["takeSetupMulligan"];
export let installRunnerProgramFromStackWithoutClick: RuntimePortGroups["choiceHiddenZoneRuntime"]["installRunnerProgramFromStackWithoutClick"];
export let canInstallRunnerProgramFromZone: RuntimePortGroups["choiceHiddenZoneRuntime"]["canInstallRunnerProgramFromZone"];
export let installRunnerProgramFromZoneWithoutClick: RuntimePortGroups["choiceHiddenZoneRuntime"]["installRunnerProgramFromZoneWithoutClick"];
export let startRunnerProgramFreeMemoryChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["startRunnerProgramFreeMemoryChoice"];
export let installRunnerProgramForFree: RuntimePortGroups["choiceHiddenZoneRuntime"]["installRunnerProgramForFree"];
export let startDerezRezzedBlackIceChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["startDerezRezzedBlackIceChoice"];
export let resolveDerezRezzedBlackIceChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveDerezRezzedBlackIceChoice"];
export let startPayRezCostToTrashRezzedIceChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["startPayRezCostToTrashRezzedIceChoice"];
export let resolvePayRezCostToTrashRezzedIceChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolvePayRezCostToTrashRezzedIceChoice"];
export let publicIcePositionLabelForCard: RuntimePortGroups["choiceHiddenZoneRuntime"]["publicIcePositionLabelForCard"];
export let publicIceSelectionLabelForCard: RuntimePortGroups["choiceHiddenZoneRuntime"]["publicIceSelectionLabelForCard"];
export let startCorpChoiceRezOrTrashIceChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["startCorpChoiceRezOrTrashIceChoice"];
export let resolveCorpChoiceRezOrTrashIceTargetChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveCorpChoiceRezOrTrashIceTargetChoice"];
export let resolveCorpChoiceRezOrTrashIceDecisionChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveCorpChoiceRezOrTrashIceDecisionChoice"];
export let startTrashUnrezzedIceChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["startTrashUnrezzedIceChoice"];
export let resolveTrashUnrezzedIceChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveTrashUnrezzedIceChoice"];
export let startPaidSourceReturnToGripChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["startPaidSourceReturnToGripChoice"];
export let resolvePaidSourceReturnToGripChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolvePaidSourceReturnToGripChoice"];
export let corpAgendaPointTotal: RuntimePortGroups["choiceHiddenZoneRuntime"]["corpAgendaPointTotal"];
export let chooseCorpAgendasForPointCost: RuntimePortGroups["choiceHiddenZoneRuntime"]["chooseCorpAgendasForPointCost"];
export let resolveIncubatorTransformChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveIncubatorTransformChoice"];
export let resolveCardImplementationAccessPaymentChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveCardImplementationAccessPaymentChoice"];
export let resolveRunnerProgramReturnChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveRunnerProgramReturnChoice"];
export let selectedChoiceCardIds: RuntimePortGroups["choiceHiddenZoneRuntime"]["selectedChoiceCardIds"];
export let iceChoiceLabelForSide: RuntimePortGroups["choiceHiddenZoneRuntime"]["iceChoiceLabelForSide"];
export let resolveP358HiddenReplacementChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveP358HiddenReplacementChoice"];
export let installedRunnerConnectionIds: RuntimePortGroups["choiceHiddenZoneRuntime"]["installedRunnerConnectionIds"];
export let canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity: RuntimePortGroups["choiceHiddenZoneRuntime"]["canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity"];
export let resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent"];
export let parseRunnerInstalledConnectionTrashBadPublicityChoiceSource: RuntimePortGroups["choiceHiddenZoneRuntime"]["parseRunnerInstalledConnectionTrashBadPublicityChoiceSource"];
export let selectedChoiceCardIdsForChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["selectedChoiceCardIdsForChoice"];
export let resolveRunnerInstalledConnectionTrashBadPublicityChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveRunnerInstalledConnectionTrashBadPublicityChoice"];
export let resolveRandomDiceLoopEvent: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveRandomDiceLoopEvent"];
export let startRandomDiceSplitChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["startRandomDiceSplitChoice"];
export let creditTextForPrompt: RuntimePortGroups["choiceHiddenZoneRuntime"]["creditTextForPrompt"];
export let diePromptText: RuntimePortGroups["choiceHiddenZoneRuntime"]["diePromptText"];
export let randomDiceSplitOptions: RuntimePortGroups["choiceHiddenZoneRuntime"]["randomDiceSplitOptions"];
export let parseRandomDiceSplitChoiceSource: RuntimePortGroups["choiceHiddenZoneRuntime"]["parseRandomDiceSplitChoiceSource"];
export let parseRandomDiceSplit: RuntimePortGroups["choiceHiddenZoneRuntime"]["parseRandomDiceSplit"];
export let continueRandomDiceLoop: RuntimePortGroups["choiceHiddenZoneRuntime"]["continueRandomDiceLoop"];
export let resolveRandomDiceSplitChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveRandomDiceSplitChoice"];
export let shuffleRunnerStack: RuntimePortGroups["choiceHiddenZoneRuntime"]["shuffleRunnerStack"];
export let revealRunnerStackTop: RuntimePortGroups["choiceHiddenZoneRuntime"]["revealRunnerStackTop"];
export let revealCorpRdTop: RuntimePortGroups["choiceHiddenZoneRuntime"]["revealCorpRdTop"];
export let resolveV1911RunnerHiddenZoneAbility: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveV1911RunnerHiddenZoneAbility"];
export let resolveScoredAgendaCorpRdTopReveal: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveScoredAgendaCorpRdTopReveal"];
export let exposedCorpCardInServer: RuntimePortGroups["choiceHiddenZoneRuntime"]["exposedCorpCardInServer"];
export let exposeCorpCardInServer: RuntimePortGroups["choiceHiddenZoneRuntime"]["exposeCorpCardInServer"];
export let installedCorpCardServerContext: RuntimePortGroups["choiceHiddenZoneRuntime"]["installedCorpCardServerContext"];
export let exposeInstalledCorpCardTargets: RuntimePortGroups["choiceHiddenZoneRuntime"]["exposeInstalledCorpCardTargets"];
export let exposeInstalledCorpCardLabel: RuntimePortGroups["choiceHiddenZoneRuntime"]["exposeInstalledCorpCardLabel"];
export let exposeInstalledCorpCardForImplementation: RuntimePortGroups["choiceHiddenZoneRuntime"]["exposeInstalledCorpCardForImplementation"];
export let installedRunnerIcebreakerIds: RuntimePortGroups["choiceHiddenZoneRuntime"]["installedRunnerIcebreakerIds"];
export let addCounterToAllInstalledRunnerIcebreakers: RuntimePortGroups["choiceHiddenZoneRuntime"]["addCounterToAllInstalledRunnerIcebreakers"];
export let shuffleCorpCardIntoRd: RuntimePortGroups["choiceHiddenZoneRuntime"]["shuffleCorpCardIntoRd"];
export let trashCorpInstalledCardsInScoredSourceServer: RuntimePortGroups["choiceHiddenZoneRuntime"]["trashCorpInstalledCardsInScoredSourceServer"];
export let resolveRunnerIcebreakerCounterEvent: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveRunnerIcebreakerCounterEvent"];
export let multiExposeInstalledCorpCardTargets: RuntimePortGroups["choiceHiddenZoneRuntime"]["multiExposeInstalledCorpCardTargets"];
export let multiExposeInstalledCorpCardOptionLabel: RuntimePortGroups["choiceHiddenZoneRuntime"]["multiExposeInstalledCorpCardOptionLabel"];
export let exposeInstalledCorpCardsChoiceOptions: RuntimePortGroups["choiceHiddenZoneRuntime"]["exposeInstalledCorpCardsChoiceOptions"];
export let startMultiExposeInstalledCorpCardsChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["startMultiExposeInstalledCorpCardsChoice"];
export let startExposeInstalledCorpCardsChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["startExposeInstalledCorpCardsChoice"];
export let resolveMultiExposeInstalledCorpCardsChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveMultiExposeInstalledCorpCardsChoice"];
export let resolveExposeInstalledCorpCardsChoice: RuntimePortGroups["choiceHiddenZoneRuntime"]["resolveExposeInstalledCorpCardsChoice"];
export let outermostIceExposures: RuntimePortGroups["choiceHiddenZoneRuntime"]["outermostIceExposures"];
export let exposeOutermostIceOfEachDataFort: RuntimePortGroups["choiceHiddenZoneRuntime"]["exposeOutermostIceOfEachDataFort"];
export let canInstallCorpRootCardInServer: RuntimePortGroups["flowRuntimeHosts"]["canInstallCorpRootCardInServer"];
export let corpRootAgendaOrNodeCapacityInServer: RuntimePortGroups["flowRuntimeHosts"]["corpRootAgendaOrNodeCapacityInServer"];
export let corpRegionUpgradeIdsInServer: RuntimePortGroups["flowRuntimeHosts"]["corpRegionUpgradeIdsInServer"];
export let startRun: RuntimePortGroups["flowRuntimeHosts"]["startRun"];
export let runnerTraceCounterEffectDefinitions: RuntimePortGroups["flowRuntimeHosts"]["runnerTraceCounterEffectDefinitions"];
export let runnerCounterDisplayName: RuntimePortGroups["flowRuntimeHosts"]["runnerCounterDisplayName"];
export let traceCounterEffectDefinitionFor: RuntimePortGroups["flowRuntimeHosts"]["traceCounterEffectDefinitionFor"];
export let runnerUtilityLongtailKindForDefinition: RuntimePortGroups["flowRuntimeHosts"]["runnerUtilityLongtailKindForDefinition"];
export let runnerUtilityLongtailKindForCard: RuntimePortGroups["flowRuntimeHosts"]["runnerUtilityLongtailKindForCard"];
export let runnerUtilityLongtailImplementationForCard: RuntimePortGroups["flowRuntimeHosts"]["runnerUtilityLongtailImplementationForCard"];
export let uniqueDirectLongtailImplementationForDefinition: RuntimePortGroups["flowRuntimeHosts"]["uniqueDirectLongtailImplementationForDefinition"];
export let uniqueDirectLongtailKindForDefinition: RuntimePortGroups["flowRuntimeHosts"]["uniqueDirectLongtailKindForDefinition"];
export let uniqueDirectLongtailImplementationForCard: RuntimePortGroups["flowRuntimeHosts"]["uniqueDirectLongtailImplementationForCard"];
export let uniqueDirectLongtailKindForCard: RuntimePortGroups["flowRuntimeHosts"]["uniqueDirectLongtailKindForCard"];
export let remainingReplacementLongtailImplementationForDefinition: RuntimePortGroups["flowRuntimeHosts"]["remainingReplacementLongtailImplementationForDefinition"];
export let remainingReplacementLongtailKindForDefinition: RuntimePortGroups["flowRuntimeHosts"]["remainingReplacementLongtailKindForDefinition"];
export let remainingReplacementLongtailImplementationForCard: RuntimePortGroups["flowRuntimeHosts"]["remainingReplacementLongtailImplementationForCard"];
export let remainingReplacementLongtailKindForCard: RuntimePortGroups["flowRuntimeHosts"]["remainingReplacementLongtailKindForCard"];
export let isObligationDebtDefinition: RuntimePortGroups["flowRuntimeHosts"]["isObligationDebtDefinition"];
export let isDrawTaxSourceDefinition: RuntimePortGroups["flowRuntimeHosts"]["isDrawTaxSourceDefinition"];
export let isCorpInstalledEconomyCreditSource: RuntimePortGroups["flowRuntimeHosts"]["isCorpInstalledEconomyCreditSource"];
export let isCorpTraceCounterPoolSource: RuntimePortGroups["flowRuntimeHosts"]["isCorpTraceCounterPoolSource"];
export let applyRunnerTraceCounterRunStartEffects: RuntimePortGroups["flowRuntimeHosts"]["applyRunnerTraceCounterRunStartEffects"];
export let applyRunStartRandomStrengthBonus: RuntimePortGroups["flowRuntimeHosts"]["applyRunStartRandomStrengthBonus"];
export let continueRun: RuntimePortGroups["flowRuntimeHosts"]["continueRun"];
export let addCurrentRunAccessCount: RuntimePortGroups["flowRuntimeHosts"]["addCurrentRunAccessCount"];
export let passCurrentEncounteredIce: RuntimePortGroups["flowRuntimeHosts"]["passCurrentEncounteredIce"];
export let resolveBlinkBreakSubroutineAction: RuntimePortGroups["flowRuntimeHosts"]["resolveBlinkBreakSubroutineAction"];
export let recordBartmossEncounterUsage: RuntimePortGroups["flowRuntimeHosts"]["recordBartmossEncounterUsage"];
export let recordSnowballBreakUsage: RuntimePortGroups["flowRuntimeHosts"]["recordSnowballBreakUsage"];
export let icebreakerHasSpecial: RuntimePortGroups["flowRuntimeHosts"]["icebreakerHasSpecial"];
export let corpTraceCounterPoolSourceIds: RuntimePortGroups["flowRuntimeHosts"]["corpTraceCounterPoolSourceIds"];
export let corpTraceCounterPoolCounterType: RuntimePortGroups["flowRuntimeHosts"]["corpTraceCounterPoolCounterType"];
export let corpTraceCounterPoolTotal: RuntimePortGroups["flowRuntimeHosts"]["corpTraceCounterPoolTotal"];
export let spendCorpTraceCounterPoolCounters: RuntimePortGroups["flowRuntimeHosts"]["spendCorpTraceCounterPoolCounters"];
export let addCorpTraceCounterPoolCounters: RuntimePortGroups["flowRuntimeHosts"]["addCorpTraceCounterPoolCounters"];
export let rabbitTraceLimitReductionForIceTrace: RuntimePortGroups["flowRuntimeHosts"]["rabbitTraceLimitReductionForIceTrace"];
export let archivesAccessRequiresDecisionOrEffect: RuntimePortGroups["flowRuntimeHosts"]["archivesAccessRequiresDecisionOrEffect"];
export let runnerAccessActionHost: RuntimePortGroups["flowRuntimeHosts"]["runnerAccessActionHost"];
export let runnerEncounterActionHostForState: RuntimePortGroups["flowRuntimeHosts"]["runnerEncounterActionHostForState"];
export let runMovementHostForState: RuntimePortGroups["flowRuntimeHosts"]["runMovementHostForState"];
export let runRezWindowHostForState: RuntimePortGroups["flowRuntimeHosts"]["runRezWindowHostForState"];
export let fortPassWindowHostForState: RuntimePortGroups["flowRuntimeHosts"]["fortPassWindowHostForState"];
export let fortRunSideFamiliesHostForState: RuntimePortGroups["flowRuntimeHosts"]["fortRunSideFamiliesHostForState"];
export let encounterEntryHostForState: RuntimePortGroups["flowRuntimeHosts"]["encounterEntryHostForState"];
export let successfulRunInterventionHost: RuntimePortGroups["flowRuntimeHosts"]["successfulRunInterventionHost"];
export let encounterResolutionHostForState: RuntimePortGroups["flowRuntimeHosts"]["encounterResolutionHostForState"];
export let encounterSpecialWindowHostForState: RuntimePortGroups["flowRuntimeHosts"]["encounterSpecialWindowHostForState"];
export let encounterPrintedEffectHostForState: RuntimePortGroups["flowRuntimeHosts"]["encounterPrintedEffectHostForState"];
export let encounterPrintedNonTraceHostForState: RuntimePortGroups["flowRuntimeHosts"]["encounterPrintedNonTraceHostForState"];
export let runEndCleanupHost: RuntimePortGroups["flowRuntimeHosts"]["runEndCleanupHost"];
export let runnerBreakerActionExecutionHost: RuntimePortGroups["flowRuntimeHosts"]["runnerBreakerActionExecutionHost"];
export let startRunActionExecutionHost: RuntimePortGroups["flowRuntimeHosts"]["startRunActionExecutionHost"];
export let rezActionExecutionHost: RuntimePortGroups["flowRuntimeHosts"]["rezActionExecutionHost"];
export let breachStateHost: RuntimePortGroups["flowRuntimeHosts"]["breachStateHost"];
export let accessFlowHost: RuntimePortGroups["flowRuntimeHosts"]["accessFlowHost"];
export let runAccessTransitionHost: RuntimePortGroups["flowRuntimeHosts"]["runAccessTransitionHost"];
export let accessEffectHandlerHost: RuntimePortGroups["flowRuntimeHosts"]["accessEffectHandlerHost"];
export let expireScoredAgendaInstallRezCreditAbilities: RuntimePortGroups["stateRuntimeServices"]["expireScoredAgendaInstallRezCreditAbilities"];
export let isCorpInstallableCardType: RuntimePortGroups["stateRuntimeServices"]["isCorpInstallableCardType"];
export let edgerunnerTempsInstallActionsRemaining: RuntimePortGroups["stateRuntimeServices"]["edgerunnerTempsInstallActionsRemaining"];
export let clearEdgerunnerTempsInstallFlags: RuntimePortGroups["stateRuntimeServices"]["clearEdgerunnerTempsInstallFlags"];
export let consumeEdgerunnerTempsInstallAction: RuntimePortGroups["stateRuntimeServices"]["consumeEdgerunnerTempsInstallAction"];
export let valuPakProgramInstallActionsRemaining: RuntimePortGroups["stateRuntimeServices"]["valuPakProgramInstallActionsRemaining"];
export let valuPakTemporaryProgramInstallCredits: RuntimePortGroups["stateRuntimeServices"]["valuPakTemporaryProgramInstallCredits"];
export let runnerInstallableProgramIdsForValuPak: RuntimePortGroups["stateRuntimeServices"]["runnerInstallableProgramIdsForValuPak"];
export let installedRunnerProgramTrashOptionsForInstall: RuntimePortGroups["stateRuntimeServices"]["installedRunnerProgramTrashOptionsForInstall"];
export let runnerProgramInstallMemoryReachableAfterTrash: RuntimePortGroups["stateRuntimeServices"]["runnerProgramInstallMemoryReachableAfterTrash"];
export let shouldOfferRunnerProgramTrashBeforeInstall: RuntimePortGroups["stateRuntimeServices"]["shouldOfferRunnerProgramTrashBeforeInstall"];
export let clearValuPakProgramInstallFlags: RuntimePortGroups["stateRuntimeServices"]["clearValuPakProgramInstallFlags"];
export let consumeValuPakProgramInstallAction: RuntimePortGroups["stateRuntimeServices"]["consumeValuPakProgramInstallAction"];
export let runnerDrawActionContext: RuntimePortGroups["stateRuntimeServices"]["runnerDrawActionContext"];
export let normalizeSubtypeLabel: RuntimePortGroups["stateRuntimeServices"]["normalizeSubtypeLabel"];
export let cardHasSubtype: RuntimePortGroups["stateRuntimeServices"]["cardHasSubtype"];
export let stableSubtypeList: RuntimePortGroups["stateRuntimeServices"]["stableSubtypeList"];
export let effectiveSubtypesForCard: RuntimePortGroups["stateRuntimeServices"]["effectiveSubtypesForCard"];
export let rezzedIceOutsideThisIceCount: RuntimePortGroups["stateRuntimeServices"]["rezzedIceOutsideThisIceCount"];
export let relativeIceStrengthBonusFor: RuntimePortGroups["stateRuntimeServices"]["relativeIceStrengthBonusFor"];
export let isRegionUpgrade: RuntimePortGroups["stateRuntimeServices"]["isRegionUpgrade"];
export let isUniqueCard: RuntimePortGroups["stateRuntimeServices"]["isUniqueCard"];
export let rezzedBlackIceIds: RuntimePortGroups["stateRuntimeServices"]["rezzedBlackIceIds"];
export let rezzedInstalledIceIds: RuntimePortGroups["stateRuntimeServices"]["rezzedInstalledIceIds"];
export let affordableRezzedInstalledIceIdsForRunner: RuntimePortGroups["stateRuntimeServices"]["affordableRezzedInstalledIceIdsForRunner"];
export let unrezzedInstalledIceIds: RuntimePortGroups["stateRuntimeServices"]["unrezzedInstalledIceIds"];
export let hasInstalledUniqueCardDefinition: RuntimePortGroups["stateRuntimeServices"]["hasInstalledUniqueCardDefinition"];
export let daemonHostingCapacity: RuntimePortGroups["stateRuntimeServices"]["daemonHostingCapacity"];
export let daemonHostedMemoryUsed: RuntimePortGroups["stateRuntimeServices"]["daemonHostedMemoryUsed"];
export let canHostProgramOnDaemon: RuntimePortGroups["stateRuntimeServices"]["canHostProgramOnDaemon"];
export let hostedProgramStrengthModifier: RuntimePortGroups["stateRuntimeServices"]["hostedProgramStrengthModifier"];
export let icebreakerEncounterStrengthBonus: RuntimePortGroups["stateRuntimeServices"]["icebreakerEncounterStrengthBonus"];
export let rezzedCorpRootCardIds: RuntimePortGroups["stateRuntimeServices"]["rezzedCorpRootCardIds"];
export let visibleVirusCounterTargetIds: RuntimePortGroups["stateRuntimeServices"]["visibleVirusCounterTargetIds"];
export let iceStrengthBonusFor: RuntimePortGroups["stateRuntimeServices"]["iceStrengthBonusFor"];
export let iceStrengthFor: RuntimePortGroups["stateRuntimeServices"]["iceStrengthFor"];
export let runRemainderStrengthBonusForBreaker: RuntimePortGroups["stateRuntimeServices"]["runRemainderStrengthBonusForBreaker"];
export let runBreakSubroutineAdditionalCost: RuntimePortGroups["stateRuntimeServices"]["runBreakSubroutineAdditionalCost"];
export let runnerHardwareBreakSubroutineAdditionalCost: RuntimePortGroups["stateRuntimeServices"]["runnerHardwareBreakSubroutineAdditionalCost"];
export let breakSubroutineCostBreakdown: RuntimePortGroups["stateRuntimeServices"]["breakSubroutineCostBreakdown"];
export let hasInstalledRunnerApDamageReducerHardware: RuntimePortGroups["stateRuntimeServices"]["hasInstalledRunnerApDamageReducerHardware"];
export let runnerHasInstalledCardDefinition: RuntimePortGroups["stateRuntimeServices"]["runnerHasInstalledCardDefinition"];
export let runnerInstalledCardCountByDefinition: RuntimePortGroups["stateRuntimeServices"]["runnerInstalledCardCountByDefinition"];
export let installedVirusCounterTotalForDefinition: RuntimePortGroups["stateRuntimeServices"]["installedVirusCounterTotalForDefinition"];
export let virusCounterImplementationForDefinition: RuntimePortGroups["stateRuntimeServices"]["virusCounterImplementationForDefinition"];
export let virusCounterImplementationForCard: RuntimePortGroups["stateRuntimeServices"]["virusCounterImplementationForCard"];
export let corpUtilityImplementationForCard: RuntimePortGroups["stateRuntimeServices"]["corpUtilityImplementationForCard"];
export let hasCorpUtilityKind: RuntimePortGroups["stateRuntimeServices"]["hasCorpUtilityKind"];
export let cardInstallCapabilitiesForDefinition: RuntimePortGroups["stateRuntimeServices"]["cardInstallCapabilitiesForDefinition"];
export let hasInstallCapabilityKindForDefinition: RuntimePortGroups["stateRuntimeServices"]["hasInstallCapabilityKindForDefinition"];
export let rootInstallRezzesOnInstall: RuntimePortGroups["stateRuntimeServices"]["rootInstallRezzesOnInstall"];
export let mustInstallInsideSubsidiaryDataFort: RuntimePortGroups["stateRuntimeServices"]["mustInstallInsideSubsidiaryDataFort"];
export let fortCapacityModifiersForCard: RuntimePortGroups["stateRuntimeServices"]["fortCapacityModifiersForCard"];
export let leavePlayCleanupImplementationsForCard: RuntimePortGroups["stateRuntimeServices"]["leavePlayCleanupImplementationsForCard"];
export let installedRunnerVirusSourceIds: RuntimePortGroups["stateRuntimeServices"]["installedRunnerVirusSourceIds"];
export let cockroachCounterTotal: RuntimePortGroups["stateRuntimeServices"]["cockroachCounterTotal"];
export let incubatorCounterTotal: RuntimePortGroups["stateRuntimeServices"]["incubatorCounterTotal"];
export let cockroachRandomHqDiscardActive: RuntimePortGroups["stateRuntimeServices"]["cockroachRandomHqDiscardActive"];
export let isVisibleVirusCounterCardForRunner: RuntimePortGroups["stateRuntimeServices"]["isVisibleVirusCounterCardForRunner"];
export let corpIceInstallBaseCost: RuntimePortGroups["stateRuntimeServices"]["corpIceInstallBaseCost"];
export let outermostIceIndex: RuntimePortGroups["stateRuntimeServices"]["outermostIceIndex"];
export let poxCountersForServer: RuntimePortGroups["stateRuntimeServices"]["poxCountersForServer"];
export let spyCountersForServer: RuntimePortGroups["stateRuntimeServices"]["spyCountersForServer"];
export let poxInstallTax: RuntimePortGroups["stateRuntimeServices"]["poxInstallTax"];
export let corpIceInstallAdditionalCost: RuntimePortGroups["stateRuntimeServices"]["corpIceInstallAdditionalCost"];
export let corpIceInstallTotalCost: RuntimePortGroups["stateRuntimeServices"]["corpIceInstallTotalCost"];
export let assertCorpIceInstallCostValid: RuntimePortGroups["stateRuntimeServices"]["assertCorpIceInstallCostValid"];
export let serverDifficultyIncreaseFromRunCounters: RuntimePortGroups["stateCorpRuntimeResolvers"]["serverDifficultyIncreaseFromRunCounters"];
export let serverDifficultyReductionFromUpgrades: RuntimePortGroups["stateCorpRuntimeResolvers"]["serverDifficultyReductionFromUpgrades"];
export let discardRandomCorpHqCards: RuntimePortGroups["lifecycleRuntime"]["discardRandomCorpHqCards"];
export let trashRunnerInstalledProgram: RuntimePortGroups["lifecycleRuntime"]["trashRunnerInstalledProgram"];
export let runnerProgramUsesMemory: RuntimePortGroups["lifecycleRuntime"]["runnerProgramUsesMemory"];
export let trashRunnerInstalledCardToHeap: RuntimePortGroups["lifecycleRuntime"]["trashRunnerInstalledCardToHeap"];
export let returnRunnerInstalledCardToGrip: RuntimePortGroups["lifecycleRuntime"]["returnRunnerInstalledCardToGrip"];
export let returnRunnerInstalledProgramsToGripForAccess: RuntimePortGroups["lifecycleRuntime"]["returnRunnerInstalledProgramsToGripForAccess"];
export let trashCorpInstalledCardToArchives: RuntimePortGroups["lifecycleRuntime"]["trashCorpInstalledCardToArchives"];
export let cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay: RuntimePortGroups["lifecycleRuntime"]["cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay"];
export let drawRunnerCard: RuntimePortGroups["lifecycleRuntime"]["drawRunnerCard"];
export let activeCrashEverettSourceId: RuntimePortGroups["lifecycleRuntime"]["activeCrashEverettSourceId"];
export let startCrashEverettDrawChoice: RuntimePortGroups["lifecycleRuntime"]["startCrashEverettDrawChoice"];
export let drawRunnerCards: RuntimePortGroups["lifecycleRuntime"]["drawRunnerCards"];
export let resolveCrashEverettDrawChoice: RuntimePortGroups["lifecycleRuntime"]["resolveCrashEverettDrawChoice"];
export let resolveRunnerDrawSequenceChoice: RuntimePortGroups["lifecycleRuntime"]["resolveRunnerDrawSequenceChoice"];
export let resumeRunnerDrawSequenceAfterTagPrevention: RuntimePortGroups["lifecycleRuntime"]["resumeRunnerDrawSequenceAfterTagPrevention"];
export let swapCorpHqAndRdTop: RuntimePortGroups["stateCorpRuntimeResolvers"]["swapCorpHqAndRdTop"];
export let spendRecurringTraceCreditPool: RuntimePortGroups["stateCorpRuntimeResolvers"]["spendRecurringTraceCreditPool"];
export let resolveTraceHardwareWreckerSuccess: RuntimePortGroups["stateRuntimeResolvers"]["resolveTraceHardwareWreckerSuccess"];
export let resolveTraceTrashRunnerResourceSuccess: RuntimePortGroups["stateRuntimeResolvers"]["resolveTraceTrashRunnerResourceSuccess"];
export let encounterTemporaryTraceCreditsAvailable: RuntimePortGroups["stateRuntimeResolvers"]["encounterTemporaryTraceCreditsAvailable"];
export let spendEncounterTemporaryTraceCredits: RuntimePortGroups["stateRuntimeResolvers"]["spendEncounterTemporaryTraceCredits"];
export let identityModifierAmount: RuntimePortGroups["stateRuntimeResolvers"]["identityModifierAmount"];
export let identityDefinition: RuntimePortGroups["stateRuntimeResolvers"]["identityDefinition"];
export let executeEffectCommands: RuntimePortGroups["stateRuntimeResolvers"]["executeEffectCommands"];
export let assertNonNegativeAmount: RuntimePortGroups["stateRuntimeResolvers"]["assertNonNegativeAmount"];
export let assertPositiveIntegerAmount: RuntimePortGroups["stateRuntimeResolvers"]["assertPositiveIntegerAmount"];
export let withoutVariableIceState: RuntimePortGroups["stateRuntimeResolvers"]["withoutVariableIceState"];
export let clickCostForAction: RuntimePortGroups["stateRuntimeResolvers"]["clickCostForAction"];
export let creditCostForAction: RuntimePortGroups["stateRuntimeResolvers"]["creditCostForAction"];
export let runnerActionsPerTurn: RuntimePortGroups["stateRuntimeResolvers"]["runnerActionsPerTurn"];
export let agendaPoints: RuntimePortGroups["stateRuntimeResolvers"]["agendaPoints"];
export let addVirusCounterWithCounterPrevention: RuntimePortGroups["stateRuntimeResolvers"]["addVirusCounterWithCounterPrevention"];
export let preventOneVirusCounterWithCounterPrevention: RuntimePortGroups["stateRuntimeResolvers"]["preventOneVirusCounterWithCounterPrevention"];
export let addVisibleCardCounter: RuntimePortGroups["stateRuntimeResolvers"]["addVisibleCardCounter"];
export let spendVisibleCardCounter: RuntimePortGroups["stateRuntimeResolvers"]["spendVisibleCardCounter"];
export let totalCounters: RuntimePortGroups["stateRuntimeResolvers"]["totalCounters"];
export let installedVirusCounterPurgePreserveSourceIds: RuntimePortGroups["stateRuntimeResolvers"]["installedVirusCounterPurgePreserveSourceIds"];
export let virusCounterPurgePreserveTargets: RuntimePortGroups["stateRuntimeResolvers"]["virusCounterPurgePreserveTargets"];
export let startVirusCounterPurgePreserveChoice: RuntimePortGroups["stateRuntimeResolvers"]["startVirusCounterPurgePreserveChoice"];
export let parseVirusCounterPurgePreserveOption: RuntimePortGroups["stateRuntimeResolvers"]["parseVirusCounterPurgePreserveOption"];
export let restorePurgePreservedVirusCounters: RuntimePortGroups["stateRuntimeResolvers"]["restorePurgePreservedVirusCounters"];
export let resolveVirusCounterPurgePreserveChoice: RuntimePortGroups["stateRuntimeResolvers"]["resolveVirusCounterPurgePreserveChoice"];
export let availableRunnerProgramInstallCredits: RuntimePortGroups["stateRuntimeResolvers"]["availableRunnerProgramInstallCredits"];
export let runnerCanPayInstallCost: RuntimePortGroups["stateRuntimeResolvers"]["runnerCanPayInstallCost"];
export let runnerCostPenaltySupportCreditCapacity: RuntimePortGroups["stateRuntimeResolvers"]["runnerCostPenaltySupportCreditCapacity"];
export let openRunnerCostPenaltySupportWindow: RuntimePortGroups["stateRuntimeResolvers"]["openRunnerCostPenaltySupportWindow"];
export let closeRunnerCostPenaltySupportWindowForPayment: RuntimePortGroups["stateRuntimeResolvers"]["closeRunnerCostPenaltySupportWindowForPayment"];
export let spendRunnerInstallCredits: RuntimePortGroups["stateRuntimeResolvers"]["spendRunnerInstallCredits"];
export let runnerTagRemovalRecurringCreditSourceIds: RuntimePortGroups["stateRuntimeResolvers"]["runnerTagRemovalRecurringCreditSourceIds"];
export let runnerTagRemovalRecurringCredits: RuntimePortGroups["stateRuntimeResolvers"]["runnerTagRemovalRecurringCredits"];
export let availableRunnerTagRemovalCredits: RuntimePortGroups["stateRuntimeResolvers"]["availableRunnerTagRemovalCredits"];
export let spendRunnerTagRemovalCredits: RuntimePortGroups["stateRuntimeResolvers"]["spendRunnerTagRemovalCredits"];
export let refreshRecurringCredits: RuntimePortGroups["stateRuntimeResolvers"]["refreshRecurringCredits"];

export function installRuntimePortBindings(ports: RuntimePortGroups): void {
  corpRunnerActionPaidWindowActions =
    ports.actionRuntimeHosts.corpRunnerActionPaidWindowActions;
  runnerRunSpecialEffectActions =
    ports.actionRuntimeHosts.runnerRunSpecialEffectActions;
  specialZoneHarnessActions =
    ports.actionRuntimeHosts.specialZoneHarnessActions;
  turnBasicExecutionHost = ports.actionRuntimeHosts.turnBasicExecutionHost;
  creditEconomyExecutionHost =
    ports.actionRuntimeHosts.creditEconomyExecutionHost;
  resolveEndTurnTagIfRunnerReceivedTag =
    ports.turnRuntimeResolvers.resolveEndTurnTagIfRunnerReceivedTag;
  resumeEndTurnAfterTagPrevention =
    ports.turnRuntimeResolvers.resumeEndTurnAfterTagPrevention;
  resolveFieldReporterEndOfRunnerTurn =
    ports.turnRuntimeResolvers.resolveFieldReporterEndOfRunnerTurn;
  resolveDelayedEndTurnDamageEffects =
    ports.turnRuntimeResolvers.resolveDelayedEndTurnDamageEffects;
  endTurn = ports.turnRuntimeResolvers.endTurn;
  resolveTemporaryProgramInstallReturns =
    ports.turnRuntimeResolvers.resolveTemporaryProgramInstallReturns;
  resolveCorpObligationEndOfTurn =
    ports.turnRuntimeResolvers.resolveCorpObligationEndOfTurn;
  startDiscardPhase = ports.turnRuntimeResolvers.startDiscardPhase;
  processDiscardStep = ports.turnRuntimeResolvers.processDiscardStep;
  completeDiscardPhase = ports.turnRuntimeResolvers.completeDiscardPhase;
  appendResolvedEffectsToPayload =
    ports.turnRuntimeResolvers.appendResolvedEffectsToPayload;
  automaticGainCreditsEffect =
    ports.turnRuntimeResolvers.automaticGainCreditsEffect;
  automaticLoseCreditsEffect =
    ports.turnRuntimeResolvers.automaticLoseCreditsEffect;
  automaticDrawCardsEffect =
    ports.turnRuntimeResolvers.automaticDrawCardsEffect;
  automaticTagEffect = ports.turnRuntimeResolvers.automaticTagEffect;
  automaticTrashCardEffect =
    ports.turnRuntimeResolvers.automaticTrashCardEffect;
  automaticCounterChangeEffect =
    ports.turnRuntimeResolvers.automaticCounterChangeEffect;
  automaticStealAgendaEffect =
    ports.turnRuntimeResolvers.automaticStealAgendaEffect;
  publicCardTitle = ports.turnRuntimeResolvers.publicCardTitle;
  applyRunnerForgoNextAction =
    ports.turnRuntimeResolvers.applyRunnerForgoNextAction;
  addRunnerFutureActionDebt =
    ports.turnRuntimeResolvers.addRunnerFutureActionDebt;
  consumeRunnerFutureActionDebt =
    ports.turnRuntimeResolvers.consumeRunnerFutureActionDebt;
  filterActionsForRestrictedExtraActions =
    ports.turnRuntimeResolvers.filterActionsForRestrictedExtraActions;
  consumeRestrictedExtraActionForAction =
    ports.turnRuntimeResolvers.consumeRestrictedExtraActionForAction;
  acceptExtraActionOffer = ports.turnRuntimeResolvers.acceptExtraActionOffer;
  declineExtraActionOffer = ports.turnRuntimeResolvers.declineExtraActionOffer;
  resolvePdcaCounterAction =
    ports.turnRuntimeResolvers.resolvePdcaCounterAction;
  resolveForcedActionNotPossible =
    ports.turnRuntimeResolvers.resolveForcedActionNotPossible;
  startCorpTurn = ports.turnRuntimeResolvers.startCorpTurn;
  startRunnerTurn = ports.turnRuntimeResolvers.startRunnerTurn;
  resumeStartOfTurnAfterTagPrevention =
    ports.turnRuntimeResolvers.resumeStartOfTurnAfterTagPrevention;
  untapRunnerCardsAtTurnStart =
    ports.turnRuntimeResolvers.untapRunnerCardsAtTurnStart;
  resolveDelayedAccessEffects =
    ports.turnRuntimeResolvers.resolveDelayedAccessEffects;
  applyCorpStartOfTurnEffects =
    ports.turnRuntimeResolvers.applyCorpStartOfTurnEffects;
  openCorpStartTurnRestrictedActionOffers =
    ports.turnRuntimeResolvers.openCorpStartTurnRestrictedActionOffers;
  applyPurgeableRunnerVirusCorpStartEffects =
    ports.turnRuntimeResolvers.applyPurgeableRunnerVirusCorpStartEffects;
  virusCounterDrawsAtCorpStart =
    ports.turnRuntimeResolvers.virusCounterDrawsAtCorpStart;
  skivvissCounterTotal = ports.turnRuntimeResolvers.skivvissCounterTotal;
  virusCounterCascadeTrashAtCorpStart =
    ports.turnRuntimeResolvers.virusCounterCascadeTrashAtCorpStart;
  trashTopRdCardsFaceupForCascade =
    ports.turnRuntimeResolvers.trashTopRdCardsFaceupForCascade;
  applyRunnerStartOfTurnEffects =
    ports.turnRuntimeResolvers.applyRunnerStartOfTurnEffects;
  applyStartTurnRandomEffectTables =
    ports.turnRuntimeResolvers.applyStartTurnRandomEffectTables;
  virusCounterCreditsAtRunnerStart =
    ports.turnRuntimeResolvers.virusCounterCreditsAtRunnerStart;
  startVirusCounterRunnerPrivateLookAtStart =
    ports.turnRuntimeResolvers.startVirusCounterRunnerPrivateLookAtStart;
  randomCorpHqCardsWithoutReplacement =
    ports.turnRuntimeResolvers.randomCorpHqCardsWithoutReplacement;
  startRunnerPrivateLookAtSpecificCorpCards =
    ports.turnRuntimeResolvers.startRunnerPrivateLookAtSpecificCorpCards;
  queueIncubatorStartOfTurnTransforms =
    ports.turnRuntimeResolvers.queueIncubatorStartOfTurnTransforms;
  startIncubatorTransformChoice =
    ports.turnRuntimeResolvers.startIncubatorTransformChoice;
  forfeitRunnerAgendaForPointCost =
    ports.corpRuntimeResolvers.forfeitRunnerAgendaForPointCost;
  forfeitCorpAgendaForPointCost =
    ports.corpRuntimeResolvers.forfeitCorpAgendaForPointCost;
  activeObligationCount = ports.corpRuntimeResolvers.activeObligationCount;
  addActiveObligation = ports.corpRuntimeResolvers.addActiveObligation;
  removeActiveObligation = ports.corpRuntimeResolvers.removeActiveObligation;
  spendCorpAgendaPointCost =
    ports.corpRuntimeResolvers.spendCorpAgendaPointCost;
  installedAgendaOperationTarget =
    ports.corpRuntimeResolvers.installedAgendaOperationTarget;
  corpAgendaCounterOperationTarget =
    ports.corpRuntimeResolvers.corpAgendaCounterOperationTarget;
  corpScoredAgendaForfeitTargets =
    ports.corpRuntimeResolvers.corpScoredAgendaForfeitTargets;
  hardwareTrashByCounterEligibleHardwareIds =
    ports.corpRuntimeResolvers.hardwareTrashByCounterEligibleHardwareIds;
  hardwareTrashByCounterLegalActions =
    ports.corpRuntimeResolvers.hardwareTrashByCounterLegalActions;
  hardwareTrashByCounterTrashCountFromPayload =
    ports.corpRuntimeResolvers.hardwareTrashByCounterTrashCountFromPayload;
  resolveHardwareTrashByCounterOperation =
    ports.corpRuntimeResolvers.resolveHardwareTrashByCounterOperation;
  startHardwareTrashByCounterChoice =
    ports.corpRuntimeResolvers.startHardwareTrashByCounterChoice;
  hardwareTrashByCounterTrashCountFromChoiceSource =
    ports.corpRuntimeResolvers.hardwareTrashByCounterTrashCountFromChoiceSource;
  resolveHardwareTrashByCounterChoice =
    ports.corpRuntimeResolvers.resolveHardwareTrashByCounterChoice;
  trashHardwareByCounter = ports.corpRuntimeResolvers.trashHardwareByCounter;
  advancementPlacementLegalActions =
    ports.corpRuntimeResolvers.advancementPlacementLegalActions;
  resolveAgendaCounterOperation =
    ports.corpRuntimeResolvers.resolveAgendaCounterOperation;
  resolveAdvancementPlacementOperation =
    ports.corpRuntimeResolvers.resolveAdvancementPlacementOperation;
  advancementPlacementOptions =
    ports.corpRuntimeResolvers.advancementPlacementOptions;
  startAdvancementPlacementChoice =
    ports.corpRuntimeResolvers.startAdvancementPlacementChoice;
  resolveAdvancementPlacementChoice =
    ports.corpRuntimeResolvers.resolveAdvancementPlacementChoice;
  applyAdvancementCounterPlacement =
    ports.corpRuntimeResolvers.applyAdvancementCounterPlacement;
  advanceableInstalledCardTargets =
    ports.corpRuntimeResolvers.advanceableInstalledCardTargets;
  isInstalledCorpCardAdvanceable =
    ports.corpRuntimeResolvers.isInstalledCorpCardAdvanceable;
  advancementDistributionOptions =
    ports.corpRuntimeResolvers.advancementDistributionOptions;
  startCardImplementationAdvancementDistributionChoice =
    ports.corpRuntimeResolvers
      .startCardImplementationAdvancementDistributionChoice;
  parseAdvancementDistributionValue =
    ports.corpRuntimeResolvers.parseAdvancementDistributionValue;
  sourcePartsForP334Choice =
    ports.corpRuntimeResolvers.sourcePartsForP334Choice;
  validateAdvancementDistribution =
    ports.corpRuntimeResolvers.validateAdvancementDistribution;
  resolveCardImplementationAdvancementDistributionChoice =
    ports.corpRuntimeResolvers
      .resolveCardImplementationAdvancementDistributionChoice;
  movableAdvancementSourceIds =
    ports.corpRuntimeResolvers.movableAdvancementSourceIds;
  moveAdvancementOptions = ports.corpRuntimeResolvers.moveAdvancementOptions;
  startCardImplementationMoveAdvancementChoice =
    ports.corpRuntimeResolvers.startCardImplementationMoveAdvancementChoice;
  resolveCardImplementationMoveAdvancementChoice =
    ports.corpRuntimeResolvers.resolveCardImplementationMoveAdvancementChoice;
  resolveCorpOperationAddAdvancementCounters =
    ports.corpRuntimeResolvers.resolveCorpOperationAddAdvancementCounters;
  awardRunnerEventAgendaPoint =
    ports.corpRuntimeResolvers.awardRunnerEventAgendaPoint;
  choiceAction = ports.corpRuntimeResolvers.choiceAction;
  abilityMetadata = ports.corpRuntimeResolvers.abilityMetadata;
  resolveCorpInstalledEconomyAction =
    ports.corpRuntimeResolvers.resolveCorpInstalledEconomyAction;
  validateCorpInstalledEconomyAction =
    ports.corpRuntimeResolvers.validateCorpInstalledEconomyAction;
  rezzedCorpInstalledEconomyCreditSourceIds =
    ports.corpRuntimeResolvers.rezzedCorpInstalledEconomyCreditSourceIds;
  shouldOpenCorpInstalledEconomyCreditChoice =
    ports.corpRuntimeResolvers.shouldOpenCorpInstalledEconomyCreditChoice;
  startCorpInstalledEconomyCreditChoice =
    ports.corpRuntimeResolvers.startCorpInstalledEconomyCreditChoice;
  resolveCorpInstalledEconomyCreditChoice =
    ports.corpRuntimeResolvers.resolveCorpInstalledEconomyCreditChoice;
  corpInstallRezSequenceHandlerHost =
    ports.actionRuntimeHosts.corpInstallRezSequenceHandlerHost;
  scoredAgendaFlowHost = ports.actionRuntimeHosts.scoredAgendaFlowHost;
  scoredAgendaAbilityHost = ports.actionRuntimeHosts.scoredAgendaAbilityHost;
  corpTraceDamageAbilityHost =
    ports.actionRuntimeHosts.corpTraceDamageAbilityHost;
  corpSpecialDamageAbilityHost =
    ports.actionRuntimeHosts.corpSpecialDamageAbilityHost;
  playCardExecutionHost = ports.actionRuntimeHosts.playCardExecutionHost;
  corpOperationResolutionHost =
    ports.actionRuntimeHosts.corpOperationResolutionHost;
  boardStateActionExecutionHost =
    ports.actionRuntimeHosts.boardStateActionExecutionHost;
  hasHiddenResourceAccessStartActions =
    ports.actionRuntimeHosts.hasHiddenResourceAccessStartActions;
  pushCorpTraceDamageOrCardImplementationActions =
    ports.actionRuntimeHosts.pushCorpTraceDamageOrCardImplementationActions;
  openPostMeatDamageReactionWindow =
    ports.cardRuntimeResolvers.openPostMeatDamageReactionWindow;
  postMeatDamageHiddenResourceCandidates =
    ports.cardRuntimeResolvers.postMeatDamageHiddenResourceCandidates;
  resolvePostMeatDamageHiddenResourceChoice =
    ports.cardRuntimeResolvers.resolvePostMeatDamageHiddenResourceChoice;
  randomCorpHqDiscard = ports.cardRuntimeResolvers.randomCorpHqDiscard;
  installTargetBindingForDefinition =
    ports.cardRuntimeResolvers.installTargetBindingForDefinition;
  requiresDataFortInstallTarget =
    ports.cardRuntimeResolvers.requiresDataFortInstallTarget;
  runnerEventLongtailForDefinition =
    ports.cardRuntimeResolvers.runnerEventLongtailForDefinition;
  variableRezForDefinition =
    ports.cardRuntimeResolvers.variableRezForDefinition;
  runnerEventLongtailKindForDefinition =
    ports.cardRuntimeResolvers.runnerEventLongtailKindForDefinition;
  runnerEventInstallChoiceActionPayload =
    ports.cardRuntimeResolvers.runnerEventInstallChoiceActionPayload;
  hiddenReplacementLongtailForDefinition =
    ports.cardRuntimeResolvers.hiddenReplacementLongtailForDefinition;
  cardImplementationRunnerEventResolver =
    ports.cardRuntimeResolvers.cardImplementationRunnerEventResolver;
  printedCostCardImplementationMakeRunEffect =
    ports.cardRuntimeResolvers.printedCostCardImplementationMakeRunEffect;
  scoredAgendaImplementationForDefinitionId =
    ports.cardRuntimeResolvers.scoredAgendaImplementationForDefinitionId;
  scoredAgendaImplementationForDefinition =
    ports.cardRuntimeResolvers.scoredAgendaImplementationForDefinition;
  scoredAgendaKindForDefinition =
    ports.cardRuntimeResolvers.scoredAgendaKindForDefinition;
  emptyRunnerDrawSummary = ports.cardRuntimeResolvers.emptyRunnerDrawSummary;
  mergeRunnerDrawSummary = ports.cardRuntimeResolvers.mergeRunnerDrawSummary;
  applyRunnerDrawSummaryPayload =
    ports.cardRuntimeResolvers.applyRunnerDrawSummaryPayload;
  runnerDrawSummaryPublicPayload =
    ports.cardRuntimeResolvers.runnerDrawSummaryPublicPayload;
  selectedServerIcebreakerStrengthCounterBonus =
    ports.cardRuntimeHosts.selectedServerIcebreakerStrengthCounterBonus;
  permanentIcebreakerStrengthCounterBonus =
    ports.cardRuntimeHosts.permanentIcebreakerStrengthCounterBonus;
  pumpAmountForLegalAction = ports.cardRuntimeHosts.pumpAmountForLegalAction;
  pumpAbilityForLegalAction = ports.cardRuntimeHosts.pumpAbilityForLegalAction;
  breakAbilityForLegalAction =
    ports.cardRuntimeHosts.breakAbilityForLegalAction;
  pumpDurationForLegalAction =
    ports.cardRuntimeHosts.pumpDurationForLegalAction;
  assertCurrentSubroutineMatchesLegalAction =
    ports.cardRuntimeHosts.assertCurrentSubroutineMatchesLegalAction;
  resolveMultiBreakSubroutinesAction =
    ports.cardRuntimeHosts.resolveMultiBreakSubroutinesAction;
  assertBreakSubroutineCostQuoteValid =
    ports.cardRuntimeHosts.assertBreakSubroutineCostQuoteValid;
  subroutinesForCurrentEncounter =
    ports.cardRuntimeHosts.subroutinesForCurrentEncounter;
  variableTraceSubroutineForCurrentEncounter =
    ports.cardRuntimeHosts.variableTraceSubroutineForCurrentEncounter;
  relativeDamageSubroutineForCurrentEncounter =
    ports.cardRuntimeHosts.relativeDamageSubroutineForCurrentEncounter;
  relativeTraceSubroutinesForCurrentEncounter =
    ports.cardRuntimeHosts.relativeTraceSubroutinesForCurrentEncounter;
  runCardImplementationActionHost =
    ports.cardRuntimeHosts.runCardImplementationActionHost;
  runStartTaxForServerUpgrades =
    ports.cardRuntimeHosts.runStartTaxForServerUpgrades;
  runStartTaxForCorpRootAssets =
    ports.cardRuntimeHosts.runStartTaxForCorpRootAssets;
  spendRunnerAccessTrashCredits =
    ports.cardRuntimeHosts.spendRunnerAccessTrashCredits;
  runnerSpecialTriggerExecutionHost =
    ports.cardRuntimeHosts.runnerSpecialTriggerExecutionHost;
  runFortTriggerExecutionHost =
    ports.cardRuntimeHosts.runFortTriggerExecutionHost;
  counterUtilityTriggerExecutionHost =
    ports.cardRuntimeHosts.counterUtilityTriggerExecutionHost;
  triggerAbilityExecutionHost =
    ports.cardRuntimeHosts.triggerAbilityExecutionHost;
  installCardHost = ports.cardRuntimeHosts.installCardHost;
  rezCardHost = ports.cardRuntimeHosts.rezCardHost;
  traceOrchestrationHost = ports.cardRuntimeHosts.traceOrchestrationHost;
  activatedCardImplementationExecutionHost =
    ports.cardRuntimeHosts.activatedCardImplementationExecutionHost;
  resolveRunnerTargetedEventImplementation =
    ports.cardRuntimeHosts.resolveRunnerTargetedEventImplementation;
  resolvePostOnPlayGenericFollowups =
    ports.cardRuntimeHosts.resolvePostOnPlayGenericFollowups;
  resolveRunnerGripHeapStackShuffleDrawEvent =
    ports.cardRuntimeHosts.resolveRunnerGripHeapStackShuffleDrawEvent;
  shuffleGripTrashAndStackThenDrawForCardImplementation =
    ports.cardRuntimeHosts
      .shuffleGripTrashAndStackThenDrawForCardImplementation;
  startRunnerProgramTrashBeforeInstallChoice =
    ports.cardRuntimeHosts.startRunnerProgramTrashBeforeInstallChoice;
  resolveRunnerProgramTrashBeforeInstallChoice =
    ports.cardRuntimeHosts.resolveRunnerProgramTrashBeforeInstallChoice;
  startRunnerPrivateLookChoice =
    ports.choiceHiddenZoneResolvers.startRunnerPrivateLookChoice;
  resolveRunnerPrivateLookChoice =
    ports.choiceHiddenZoneResolvers.resolveRunnerPrivateLookChoice;
  startPostAccessInstalledProgramChoice =
    ports.choiceHiddenZoneResolvers.startPostAccessInstalledProgramChoice;
  v1915InstalledRevealHelperIds =
    ports.choiceHiddenZoneResolvers.v1915InstalledRevealHelperIds;
  runnerHasInstalledDefinition =
    ports.choiceHiddenZoneResolvers.runnerHasInstalledDefinition;
  trashOlderRegionUpgradesInServer =
    ports.choiceHiddenZoneResolvers.trashOlderRegionUpgradesInServer;
  appendRegionReplacementTrashEffect =
    ports.choiceHiddenZoneResolvers.appendRegionReplacementTrashEffect;
  hiddenZoneSearchHandlerHostBase =
    ports.choiceHiddenZoneRuntime.hiddenZoneSearchHandlerHostBase;
  hiddenZoneSearchActivationTargetHost =
    ports.choiceHiddenZoneRuntime.hiddenZoneSearchActivationTargetHost;
  hiddenZoneSearchChoiceHandlerHost =
    ports.choiceHiddenZoneRuntime.hiddenZoneSearchChoiceHandlerHost;
  hiddenZoneSearchActivationHandlerHost =
    ports.choiceHiddenZoneRuntime.hiddenZoneSearchActivationHandlerHost;
  hiddenZoneArrangeChoiceHandlerHost =
    ports.choiceHiddenZoneRuntime.hiddenZoneArrangeChoiceHandlerHost;
  hiddenZoneNonSearchChoiceHandlerHost =
    ports.choiceHiddenZoneRuntime.hiddenZoneNonSearchChoiceHandlerHost;
  corpZoneChoiceHandlerHost =
    ports.choiceHiddenZoneRuntime.corpZoneChoiceHandlerHost;
  pendingChoiceResolutionHost =
    ports.choiceHiddenZoneRuntime.pendingChoiceResolutionHost;
  setupMulliganChoice = ports.choiceHiddenZoneRuntime.setupMulliganChoice;
  discardChoice = ports.choiceHiddenZoneRuntime.discardChoice;
  resolveDiscardChoice = ports.choiceHiddenZoneRuntime.resolveDiscardChoice;
  resolveSetupMulliganChoice =
    ports.choiceHiddenZoneRuntime.resolveSetupMulliganChoice;
  takeSetupMulligan = ports.choiceHiddenZoneRuntime.takeSetupMulligan;
  installRunnerProgramFromStackWithoutClick =
    ports.choiceHiddenZoneRuntime.installRunnerProgramFromStackWithoutClick;
  canInstallRunnerProgramFromZone =
    ports.choiceHiddenZoneRuntime.canInstallRunnerProgramFromZone;
  installRunnerProgramFromZoneWithoutClick =
    ports.choiceHiddenZoneRuntime.installRunnerProgramFromZoneWithoutClick;
  startRunnerProgramFreeMemoryChoice =
    ports.choiceHiddenZoneRuntime.startRunnerProgramFreeMemoryChoice;
  installRunnerProgramForFree =
    ports.choiceHiddenZoneRuntime.installRunnerProgramForFree;
  startDerezRezzedBlackIceChoice =
    ports.choiceHiddenZoneRuntime.startDerezRezzedBlackIceChoice;
  resolveDerezRezzedBlackIceChoice =
    ports.choiceHiddenZoneRuntime.resolveDerezRezzedBlackIceChoice;
  startPayRezCostToTrashRezzedIceChoice =
    ports.choiceHiddenZoneRuntime.startPayRezCostToTrashRezzedIceChoice;
  resolvePayRezCostToTrashRezzedIceChoice =
    ports.choiceHiddenZoneRuntime.resolvePayRezCostToTrashRezzedIceChoice;
  publicIcePositionLabelForCard =
    ports.choiceHiddenZoneRuntime.publicIcePositionLabelForCard;
  publicIceSelectionLabelForCard =
    ports.choiceHiddenZoneRuntime.publicIceSelectionLabelForCard;
  startCorpChoiceRezOrTrashIceChoice =
    ports.choiceHiddenZoneRuntime.startCorpChoiceRezOrTrashIceChoice;
  resolveCorpChoiceRezOrTrashIceTargetChoice =
    ports.choiceHiddenZoneRuntime.resolveCorpChoiceRezOrTrashIceTargetChoice;
  resolveCorpChoiceRezOrTrashIceDecisionChoice =
    ports.choiceHiddenZoneRuntime.resolveCorpChoiceRezOrTrashIceDecisionChoice;
  startTrashUnrezzedIceChoice =
    ports.choiceHiddenZoneRuntime.startTrashUnrezzedIceChoice;
  resolveTrashUnrezzedIceChoice =
    ports.choiceHiddenZoneRuntime.resolveTrashUnrezzedIceChoice;
  startPaidSourceReturnToGripChoice =
    ports.choiceHiddenZoneRuntime.startPaidSourceReturnToGripChoice;
  resolvePaidSourceReturnToGripChoice =
    ports.choiceHiddenZoneRuntime.resolvePaidSourceReturnToGripChoice;
  corpAgendaPointTotal = ports.choiceHiddenZoneRuntime.corpAgendaPointTotal;
  chooseCorpAgendasForPointCost =
    ports.choiceHiddenZoneRuntime.chooseCorpAgendasForPointCost;
  resolveIncubatorTransformChoice =
    ports.choiceHiddenZoneRuntime.resolveIncubatorTransformChoice;
  resolveCardImplementationAccessPaymentChoice =
    ports.choiceHiddenZoneRuntime.resolveCardImplementationAccessPaymentChoice;
  resolveRunnerProgramReturnChoice =
    ports.choiceHiddenZoneRuntime.resolveRunnerProgramReturnChoice;
  selectedChoiceCardIds = ports.choiceHiddenZoneRuntime.selectedChoiceCardIds;
  iceChoiceLabelForSide = ports.choiceHiddenZoneRuntime.iceChoiceLabelForSide;
  resolveP358HiddenReplacementChoice =
    ports.choiceHiddenZoneRuntime.resolveP358HiddenReplacementChoice;
  installedRunnerConnectionIds =
    ports.choiceHiddenZoneRuntime.installedRunnerConnectionIds;
  canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity =
    ports.choiceHiddenZoneRuntime
      .canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity;
  resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent =
    ports.choiceHiddenZoneRuntime
      .resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent;
  parseRunnerInstalledConnectionTrashBadPublicityChoiceSource =
    ports.choiceHiddenZoneRuntime
      .parseRunnerInstalledConnectionTrashBadPublicityChoiceSource;
  selectedChoiceCardIdsForChoice =
    ports.choiceHiddenZoneRuntime.selectedChoiceCardIdsForChoice;
  resolveRunnerInstalledConnectionTrashBadPublicityChoice =
    ports.choiceHiddenZoneRuntime
      .resolveRunnerInstalledConnectionTrashBadPublicityChoice;
  resolveRandomDiceLoopEvent =
    ports.choiceHiddenZoneRuntime.resolveRandomDiceLoopEvent;
  startRandomDiceSplitChoice =
    ports.choiceHiddenZoneRuntime.startRandomDiceSplitChoice;
  creditTextForPrompt = ports.choiceHiddenZoneRuntime.creditTextForPrompt;
  diePromptText = ports.choiceHiddenZoneRuntime.diePromptText;
  randomDiceSplitOptions = ports.choiceHiddenZoneRuntime.randomDiceSplitOptions;
  parseRandomDiceSplitChoiceSource =
    ports.choiceHiddenZoneRuntime.parseRandomDiceSplitChoiceSource;
  parseRandomDiceSplit = ports.choiceHiddenZoneRuntime.parseRandomDiceSplit;
  continueRandomDiceLoop = ports.choiceHiddenZoneRuntime.continueRandomDiceLoop;
  resolveRandomDiceSplitChoice =
    ports.choiceHiddenZoneRuntime.resolveRandomDiceSplitChoice;
  shuffleRunnerStack = ports.choiceHiddenZoneRuntime.shuffleRunnerStack;
  revealRunnerStackTop = ports.choiceHiddenZoneRuntime.revealRunnerStackTop;
  revealCorpRdTop = ports.choiceHiddenZoneRuntime.revealCorpRdTop;
  resolveV1911RunnerHiddenZoneAbility =
    ports.choiceHiddenZoneRuntime.resolveV1911RunnerHiddenZoneAbility;
  resolveScoredAgendaCorpRdTopReveal =
    ports.choiceHiddenZoneRuntime.resolveScoredAgendaCorpRdTopReveal;
  exposedCorpCardInServer =
    ports.choiceHiddenZoneRuntime.exposedCorpCardInServer;
  exposeCorpCardInServer = ports.choiceHiddenZoneRuntime.exposeCorpCardInServer;
  installedCorpCardServerContext =
    ports.choiceHiddenZoneRuntime.installedCorpCardServerContext;
  exposeInstalledCorpCardTargets =
    ports.choiceHiddenZoneRuntime.exposeInstalledCorpCardTargets;
  exposeInstalledCorpCardLabel =
    ports.choiceHiddenZoneRuntime.exposeInstalledCorpCardLabel;
  exposeInstalledCorpCardForImplementation =
    ports.choiceHiddenZoneRuntime.exposeInstalledCorpCardForImplementation;
  installedRunnerIcebreakerIds =
    ports.choiceHiddenZoneRuntime.installedRunnerIcebreakerIds;
  addCounterToAllInstalledRunnerIcebreakers =
    ports.choiceHiddenZoneRuntime.addCounterToAllInstalledRunnerIcebreakers;
  shuffleCorpCardIntoRd = ports.choiceHiddenZoneRuntime.shuffleCorpCardIntoRd;
  trashCorpInstalledCardsInScoredSourceServer =
    ports.choiceHiddenZoneRuntime.trashCorpInstalledCardsInScoredSourceServer;
  resolveRunnerIcebreakerCounterEvent =
    ports.choiceHiddenZoneRuntime.resolveRunnerIcebreakerCounterEvent;
  multiExposeInstalledCorpCardTargets =
    ports.choiceHiddenZoneRuntime.multiExposeInstalledCorpCardTargets;
  multiExposeInstalledCorpCardOptionLabel =
    ports.choiceHiddenZoneRuntime.multiExposeInstalledCorpCardOptionLabel;
  exposeInstalledCorpCardsChoiceOptions =
    ports.choiceHiddenZoneRuntime.exposeInstalledCorpCardsChoiceOptions;
  startMultiExposeInstalledCorpCardsChoice =
    ports.choiceHiddenZoneRuntime.startMultiExposeInstalledCorpCardsChoice;
  startExposeInstalledCorpCardsChoice =
    ports.choiceHiddenZoneRuntime.startExposeInstalledCorpCardsChoice;
  resolveMultiExposeInstalledCorpCardsChoice =
    ports.choiceHiddenZoneRuntime.resolveMultiExposeInstalledCorpCardsChoice;
  resolveExposeInstalledCorpCardsChoice =
    ports.choiceHiddenZoneRuntime.resolveExposeInstalledCorpCardsChoice;
  outermostIceExposures = ports.choiceHiddenZoneRuntime.outermostIceExposures;
  exposeOutermostIceOfEachDataFort =
    ports.choiceHiddenZoneRuntime.exposeOutermostIceOfEachDataFort;
  canInstallCorpRootCardInServer =
    ports.flowRuntimeHosts.canInstallCorpRootCardInServer;
  corpRootAgendaOrNodeCapacityInServer =
    ports.flowRuntimeHosts.corpRootAgendaOrNodeCapacityInServer;
  corpRegionUpgradeIdsInServer =
    ports.flowRuntimeHosts.corpRegionUpgradeIdsInServer;
  startRun = ports.flowRuntimeHosts.startRun;
  runnerTraceCounterEffectDefinitions =
    ports.flowRuntimeHosts.runnerTraceCounterEffectDefinitions;
  runnerCounterDisplayName = ports.flowRuntimeHosts.runnerCounterDisplayName;
  traceCounterEffectDefinitionFor =
    ports.flowRuntimeHosts.traceCounterEffectDefinitionFor;
  runnerUtilityLongtailKindForDefinition =
    ports.flowRuntimeHosts.runnerUtilityLongtailKindForDefinition;
  runnerUtilityLongtailKindForCard =
    ports.flowRuntimeHosts.runnerUtilityLongtailKindForCard;
  runnerUtilityLongtailImplementationForCard =
    ports.flowRuntimeHosts.runnerUtilityLongtailImplementationForCard;
  uniqueDirectLongtailImplementationForDefinition =
    ports.flowRuntimeHosts.uniqueDirectLongtailImplementationForDefinition;
  uniqueDirectLongtailKindForDefinition =
    ports.flowRuntimeHosts.uniqueDirectLongtailKindForDefinition;
  uniqueDirectLongtailImplementationForCard =
    ports.flowRuntimeHosts.uniqueDirectLongtailImplementationForCard;
  uniqueDirectLongtailKindForCard =
    ports.flowRuntimeHosts.uniqueDirectLongtailKindForCard;
  remainingReplacementLongtailImplementationForDefinition =
    ports.flowRuntimeHosts
      .remainingReplacementLongtailImplementationForDefinition;
  remainingReplacementLongtailKindForDefinition =
    ports.flowRuntimeHosts.remainingReplacementLongtailKindForDefinition;
  remainingReplacementLongtailImplementationForCard =
    ports.flowRuntimeHosts.remainingReplacementLongtailImplementationForCard;
  remainingReplacementLongtailKindForCard =
    ports.flowRuntimeHosts.remainingReplacementLongtailKindForCard;
  isObligationDebtDefinition =
    ports.flowRuntimeHosts.isObligationDebtDefinition;
  isDrawTaxSourceDefinition = ports.flowRuntimeHosts.isDrawTaxSourceDefinition;
  isCorpInstalledEconomyCreditSource =
    ports.flowRuntimeHosts.isCorpInstalledEconomyCreditSource;
  isCorpTraceCounterPoolSource =
    ports.flowRuntimeHosts.isCorpTraceCounterPoolSource;
  applyRunnerTraceCounterRunStartEffects =
    ports.flowRuntimeHosts.applyRunnerTraceCounterRunStartEffects;
  applyRunStartRandomStrengthBonus =
    ports.flowRuntimeHosts.applyRunStartRandomStrengthBonus;
  continueRun = ports.flowRuntimeHosts.continueRun;
  addCurrentRunAccessCount = ports.flowRuntimeHosts.addCurrentRunAccessCount;
  passCurrentEncounteredIce = ports.flowRuntimeHosts.passCurrentEncounteredIce;
  resolveBlinkBreakSubroutineAction =
    ports.flowRuntimeHosts.resolveBlinkBreakSubroutineAction;
  recordBartmossEncounterUsage =
    ports.flowRuntimeHosts.recordBartmossEncounterUsage;
  recordSnowballBreakUsage = ports.flowRuntimeHosts.recordSnowballBreakUsage;
  icebreakerHasSpecial = ports.flowRuntimeHosts.icebreakerHasSpecial;
  corpTraceCounterPoolSourceIds =
    ports.flowRuntimeHosts.corpTraceCounterPoolSourceIds;
  corpTraceCounterPoolCounterType =
    ports.flowRuntimeHosts.corpTraceCounterPoolCounterType;
  corpTraceCounterPoolTotal = ports.flowRuntimeHosts.corpTraceCounterPoolTotal;
  spendCorpTraceCounterPoolCounters =
    ports.flowRuntimeHosts.spendCorpTraceCounterPoolCounters;
  addCorpTraceCounterPoolCounters =
    ports.flowRuntimeHosts.addCorpTraceCounterPoolCounters;
  rabbitTraceLimitReductionForIceTrace =
    ports.flowRuntimeHosts.rabbitTraceLimitReductionForIceTrace;
  archivesAccessRequiresDecisionOrEffect =
    ports.flowRuntimeHosts.archivesAccessRequiresDecisionOrEffect;
  runnerAccessActionHost = ports.flowRuntimeHosts.runnerAccessActionHost;
  runnerEncounterActionHostForState =
    ports.flowRuntimeHosts.runnerEncounterActionHostForState;
  runMovementHostForState = ports.flowRuntimeHosts.runMovementHostForState;
  runRezWindowHostForState = ports.flowRuntimeHosts.runRezWindowHostForState;
  fortPassWindowHostForState =
    ports.flowRuntimeHosts.fortPassWindowHostForState;
  fortRunSideFamiliesHostForState =
    ports.flowRuntimeHosts.fortRunSideFamiliesHostForState;
  encounterEntryHostForState =
    ports.flowRuntimeHosts.encounterEntryHostForState;
  successfulRunInterventionHost =
    ports.flowRuntimeHosts.successfulRunInterventionHost;
  encounterResolutionHostForState =
    ports.flowRuntimeHosts.encounterResolutionHostForState;
  encounterSpecialWindowHostForState =
    ports.flowRuntimeHosts.encounterSpecialWindowHostForState;
  encounterPrintedEffectHostForState =
    ports.flowRuntimeHosts.encounterPrintedEffectHostForState;
  encounterPrintedNonTraceHostForState =
    ports.flowRuntimeHosts.encounterPrintedNonTraceHostForState;
  runEndCleanupHost = ports.flowRuntimeHosts.runEndCleanupHost;
  runnerBreakerActionExecutionHost =
    ports.flowRuntimeHosts.runnerBreakerActionExecutionHost;
  startRunActionExecutionHost =
    ports.flowRuntimeHosts.startRunActionExecutionHost;
  rezActionExecutionHost = ports.flowRuntimeHosts.rezActionExecutionHost;
  breachStateHost = ports.flowRuntimeHosts.breachStateHost;
  accessFlowHost = ports.flowRuntimeHosts.accessFlowHost;
  runAccessTransitionHost = ports.flowRuntimeHosts.runAccessTransitionHost;
  accessEffectHandlerHost = ports.flowRuntimeHosts.accessEffectHandlerHost;
  expireScoredAgendaInstallRezCreditAbilities =
    ports.stateRuntimeServices.expireScoredAgendaInstallRezCreditAbilities;
  isCorpInstallableCardType =
    ports.stateRuntimeServices.isCorpInstallableCardType;
  edgerunnerTempsInstallActionsRemaining =
    ports.stateRuntimeServices.edgerunnerTempsInstallActionsRemaining;
  clearEdgerunnerTempsInstallFlags =
    ports.stateRuntimeServices.clearEdgerunnerTempsInstallFlags;
  consumeEdgerunnerTempsInstallAction =
    ports.stateRuntimeServices.consumeEdgerunnerTempsInstallAction;
  valuPakProgramInstallActionsRemaining =
    ports.stateRuntimeServices.valuPakProgramInstallActionsRemaining;
  valuPakTemporaryProgramInstallCredits =
    ports.stateRuntimeServices.valuPakTemporaryProgramInstallCredits;
  runnerInstallableProgramIdsForValuPak =
    ports.stateRuntimeServices.runnerInstallableProgramIdsForValuPak;
  installedRunnerProgramTrashOptionsForInstall =
    ports.stateRuntimeServices.installedRunnerProgramTrashOptionsForInstall;
  runnerProgramInstallMemoryReachableAfterTrash =
    ports.stateRuntimeServices.runnerProgramInstallMemoryReachableAfterTrash;
  shouldOfferRunnerProgramTrashBeforeInstall =
    ports.stateRuntimeServices.shouldOfferRunnerProgramTrashBeforeInstall;
  clearValuPakProgramInstallFlags =
    ports.stateRuntimeServices.clearValuPakProgramInstallFlags;
  consumeValuPakProgramInstallAction =
    ports.stateRuntimeServices.consumeValuPakProgramInstallAction;
  runnerDrawActionContext = ports.stateRuntimeServices.runnerDrawActionContext;
  normalizeSubtypeLabel = ports.stateRuntimeServices.normalizeSubtypeLabel;
  cardHasSubtype = ports.stateRuntimeServices.cardHasSubtype;
  stableSubtypeList = ports.stateRuntimeServices.stableSubtypeList;
  effectiveSubtypesForCard =
    ports.stateRuntimeServices.effectiveSubtypesForCard;
  rezzedIceOutsideThisIceCount =
    ports.stateRuntimeServices.rezzedIceOutsideThisIceCount;
  relativeIceStrengthBonusFor =
    ports.stateRuntimeServices.relativeIceStrengthBonusFor;
  isRegionUpgrade = ports.stateRuntimeServices.isRegionUpgrade;
  isUniqueCard = ports.stateRuntimeServices.isUniqueCard;
  rezzedBlackIceIds = ports.stateRuntimeServices.rezzedBlackIceIds;
  rezzedInstalledIceIds = ports.stateRuntimeServices.rezzedInstalledIceIds;
  affordableRezzedInstalledIceIdsForRunner =
    ports.stateRuntimeServices.affordableRezzedInstalledIceIdsForRunner;
  unrezzedInstalledIceIds = ports.stateRuntimeServices.unrezzedInstalledIceIds;
  hasInstalledUniqueCardDefinition =
    ports.stateRuntimeServices.hasInstalledUniqueCardDefinition;
  daemonHostingCapacity = ports.stateRuntimeServices.daemonHostingCapacity;
  daemonHostedMemoryUsed = ports.stateRuntimeServices.daemonHostedMemoryUsed;
  canHostProgramOnDaemon = ports.stateRuntimeServices.canHostProgramOnDaemon;
  hostedProgramStrengthModifier =
    ports.stateRuntimeServices.hostedProgramStrengthModifier;
  icebreakerEncounterStrengthBonus =
    ports.stateRuntimeServices.icebreakerEncounterStrengthBonus;
  rezzedCorpRootCardIds = ports.stateRuntimeServices.rezzedCorpRootCardIds;
  visibleVirusCounterTargetIds =
    ports.stateRuntimeServices.visibleVirusCounterTargetIds;
  iceStrengthBonusFor = ports.stateRuntimeServices.iceStrengthBonusFor;
  iceStrengthFor = ports.stateRuntimeServices.iceStrengthFor;
  runRemainderStrengthBonusForBreaker =
    ports.stateRuntimeServices.runRemainderStrengthBonusForBreaker;
  runBreakSubroutineAdditionalCost =
    ports.stateRuntimeServices.runBreakSubroutineAdditionalCost;
  runnerHardwareBreakSubroutineAdditionalCost =
    ports.stateRuntimeServices.runnerHardwareBreakSubroutineAdditionalCost;
  breakSubroutineCostBreakdown =
    ports.stateRuntimeServices.breakSubroutineCostBreakdown;
  hasInstalledRunnerApDamageReducerHardware =
    ports.stateRuntimeServices.hasInstalledRunnerApDamageReducerHardware;
  runnerHasInstalledCardDefinition =
    ports.stateRuntimeServices.runnerHasInstalledCardDefinition;
  runnerInstalledCardCountByDefinition =
    ports.stateRuntimeServices.runnerInstalledCardCountByDefinition;
  installedVirusCounterTotalForDefinition =
    ports.stateRuntimeServices.installedVirusCounterTotalForDefinition;
  virusCounterImplementationForDefinition =
    ports.stateRuntimeServices.virusCounterImplementationForDefinition;
  virusCounterImplementationForCard =
    ports.stateRuntimeServices.virusCounterImplementationForCard;
  corpUtilityImplementationForCard =
    ports.stateRuntimeServices.corpUtilityImplementationForCard;
  hasCorpUtilityKind = ports.stateRuntimeServices.hasCorpUtilityKind;
  cardInstallCapabilitiesForDefinition =
    ports.stateRuntimeServices.cardInstallCapabilitiesForDefinition;
  hasInstallCapabilityKindForDefinition =
    ports.stateRuntimeServices.hasInstallCapabilityKindForDefinition;
  rootInstallRezzesOnInstall =
    ports.stateRuntimeServices.rootInstallRezzesOnInstall;
  mustInstallInsideSubsidiaryDataFort =
    ports.stateRuntimeServices.mustInstallInsideSubsidiaryDataFort;
  fortCapacityModifiersForCard =
    ports.stateRuntimeServices.fortCapacityModifiersForCard;
  leavePlayCleanupImplementationsForCard =
    ports.stateRuntimeServices.leavePlayCleanupImplementationsForCard;
  installedRunnerVirusSourceIds =
    ports.stateRuntimeServices.installedRunnerVirusSourceIds;
  cockroachCounterTotal = ports.stateRuntimeServices.cockroachCounterTotal;
  incubatorCounterTotal = ports.stateRuntimeServices.incubatorCounterTotal;
  cockroachRandomHqDiscardActive =
    ports.stateRuntimeServices.cockroachRandomHqDiscardActive;
  isVisibleVirusCounterCardForRunner =
    ports.stateRuntimeServices.isVisibleVirusCounterCardForRunner;
  corpIceInstallBaseCost = ports.stateRuntimeServices.corpIceInstallBaseCost;
  outermostIceIndex = ports.stateRuntimeServices.outermostIceIndex;
  poxCountersForServer = ports.stateRuntimeServices.poxCountersForServer;
  spyCountersForServer = ports.stateRuntimeServices.spyCountersForServer;
  poxInstallTax = ports.stateRuntimeServices.poxInstallTax;
  corpIceInstallAdditionalCost =
    ports.stateRuntimeServices.corpIceInstallAdditionalCost;
  corpIceInstallTotalCost = ports.stateRuntimeServices.corpIceInstallTotalCost;
  assertCorpIceInstallCostValid =
    ports.stateRuntimeServices.assertCorpIceInstallCostValid;
  serverDifficultyIncreaseFromRunCounters =
    ports.stateCorpRuntimeResolvers.serverDifficultyIncreaseFromRunCounters;
  serverDifficultyReductionFromUpgrades =
    ports.stateCorpRuntimeResolvers.serverDifficultyReductionFromUpgrades;
  discardRandomCorpHqCards = ports.lifecycleRuntime.discardRandomCorpHqCards;
  trashRunnerInstalledProgram =
    ports.lifecycleRuntime.trashRunnerInstalledProgram;
  runnerProgramUsesMemory = ports.lifecycleRuntime.runnerProgramUsesMemory;
  trashRunnerInstalledCardToHeap =
    ports.lifecycleRuntime.trashRunnerInstalledCardToHeap;
  returnRunnerInstalledCardToGrip =
    ports.lifecycleRuntime.returnRunnerInstalledCardToGrip;
  returnRunnerInstalledProgramsToGripForAccess =
    ports.lifecycleRuntime.returnRunnerInstalledProgramsToGripForAccess;
  trashCorpInstalledCardToArchives =
    ports.lifecycleRuntime.trashCorpInstalledCardToArchives;
  cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay =
    ports.lifecycleRuntime.cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay;
  drawRunnerCard = ports.lifecycleRuntime.drawRunnerCard;
  activeCrashEverettSourceId =
    ports.lifecycleRuntime.activeCrashEverettSourceId;
  startCrashEverettDrawChoice =
    ports.lifecycleRuntime.startCrashEverettDrawChoice;
  drawRunnerCards = ports.lifecycleRuntime.drawRunnerCards;
  resolveCrashEverettDrawChoice =
    ports.lifecycleRuntime.resolveCrashEverettDrawChoice;
  resolveRunnerDrawSequenceChoice =
    ports.lifecycleRuntime.resolveRunnerDrawSequenceChoice;
  resumeRunnerDrawSequenceAfterTagPrevention =
    ports.lifecycleRuntime.resumeRunnerDrawSequenceAfterTagPrevention;
  swapCorpHqAndRdTop = ports.stateCorpRuntimeResolvers.swapCorpHqAndRdTop;
  spendRecurringTraceCreditPool =
    ports.stateCorpRuntimeResolvers.spendRecurringTraceCreditPool;
  resolveTraceHardwareWreckerSuccess =
    ports.stateRuntimeResolvers.resolveTraceHardwareWreckerSuccess;
  resolveTraceTrashRunnerResourceSuccess =
    ports.stateRuntimeResolvers.resolveTraceTrashRunnerResourceSuccess;
  encounterTemporaryTraceCreditsAvailable =
    ports.stateRuntimeResolvers.encounterTemporaryTraceCreditsAvailable;
  spendEncounterTemporaryTraceCredits =
    ports.stateRuntimeResolvers.spendEncounterTemporaryTraceCredits;
  identityModifierAmount = ports.stateRuntimeResolvers.identityModifierAmount;
  identityDefinition = ports.stateRuntimeResolvers.identityDefinition;
  executeEffectCommands = ports.stateRuntimeResolvers.executeEffectCommands;
  assertNonNegativeAmount = ports.stateRuntimeResolvers.assertNonNegativeAmount;
  assertPositiveIntegerAmount =
    ports.stateRuntimeResolvers.assertPositiveIntegerAmount;
  withoutVariableIceState = ports.stateRuntimeResolvers.withoutVariableIceState;
  clickCostForAction = ports.stateRuntimeResolvers.clickCostForAction;
  creditCostForAction = ports.stateRuntimeResolvers.creditCostForAction;
  runnerActionsPerTurn = ports.stateRuntimeResolvers.runnerActionsPerTurn;
  agendaPoints = ports.stateRuntimeResolvers.agendaPoints;
  addVirusCounterWithCounterPrevention =
    ports.stateRuntimeResolvers.addVirusCounterWithCounterPrevention;
  preventOneVirusCounterWithCounterPrevention =
    ports.stateRuntimeResolvers.preventOneVirusCounterWithCounterPrevention;
  addVisibleCardCounter = ports.stateRuntimeResolvers.addVisibleCardCounter;
  spendVisibleCardCounter = ports.stateRuntimeResolvers.spendVisibleCardCounter;
  totalCounters = ports.stateRuntimeResolvers.totalCounters;
  installedVirusCounterPurgePreserveSourceIds =
    ports.stateRuntimeResolvers.installedVirusCounterPurgePreserveSourceIds;
  virusCounterPurgePreserveTargets =
    ports.stateRuntimeResolvers.virusCounterPurgePreserveTargets;
  startVirusCounterPurgePreserveChoice =
    ports.stateRuntimeResolvers.startVirusCounterPurgePreserveChoice;
  parseVirusCounterPurgePreserveOption =
    ports.stateRuntimeResolvers.parseVirusCounterPurgePreserveOption;
  restorePurgePreservedVirusCounters =
    ports.stateRuntimeResolvers.restorePurgePreservedVirusCounters;
  resolveVirusCounterPurgePreserveChoice =
    ports.stateRuntimeResolvers.resolveVirusCounterPurgePreserveChoice;
  availableRunnerProgramInstallCredits =
    ports.stateRuntimeResolvers.availableRunnerProgramInstallCredits;
  runnerCanPayInstallCost = ports.stateRuntimeResolvers.runnerCanPayInstallCost;
  runnerCostPenaltySupportCreditCapacity =
    ports.stateRuntimeResolvers.runnerCostPenaltySupportCreditCapacity;
  openRunnerCostPenaltySupportWindow =
    ports.stateRuntimeResolvers.openRunnerCostPenaltySupportWindow;
  closeRunnerCostPenaltySupportWindowForPayment =
    ports.stateRuntimeResolvers.closeRunnerCostPenaltySupportWindowForPayment;
  spendRunnerInstallCredits =
    ports.stateRuntimeResolvers.spendRunnerInstallCredits;
  runnerTagRemovalRecurringCreditSourceIds =
    ports.stateRuntimeResolvers.runnerTagRemovalRecurringCreditSourceIds;
  runnerTagRemovalRecurringCredits =
    ports.stateRuntimeResolvers.runnerTagRemovalRecurringCredits;
  availableRunnerTagRemovalCredits =
    ports.stateRuntimeResolvers.availableRunnerTagRemovalCredits;
  spendRunnerTagRemovalCredits =
    ports.stateRuntimeResolvers.spendRunnerTagRemovalCredits;
  refreshRecurringCredits = ports.stateRuntimeResolvers.refreshRecurringCredits;
}
