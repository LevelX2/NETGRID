import { runtimeDelegates } from "./runtime-delegate-store";
import type {
  CardRuntimePortFunction,
  CardRuntimePortGroups,
} from "./runtime-port-contracts";

const typedRuntimePorts = runtimeDelegates as unknown as CardRuntimePortGroups;

export const openPostMeatDamageReactionWindow: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "openPostMeatDamageReactionWindow"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.openPostMeatDamageReactionWindow(
    ...args,
  );

export const postMeatDamageHiddenResourceCandidates: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "postMeatDamageHiddenResourceCandidates"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.postMeatDamageHiddenResourceCandidates(
    ...args,
  );

export const resolvePostMeatDamageHiddenResourceChoice: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "resolvePostMeatDamageHiddenResourceChoice"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.resolvePostMeatDamageHiddenResourceChoice(
    ...args,
  );

export const randomCorpHqDiscard: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "randomCorpHqDiscard"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.randomCorpHqDiscard(...args);

export const installTargetBindingForDefinition: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "installTargetBindingForDefinition"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.installTargetBindingForDefinition(
    ...args,
  );

export const requiresDataFortInstallTarget: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "requiresDataFortInstallTarget"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.requiresDataFortInstallTarget(...args);

export const runnerEventLongtailForDefinition: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "runnerEventLongtailForDefinition"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.runnerEventLongtailForDefinition(
    ...args,
  );

export const variableRezForDefinition: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "variableRezForDefinition"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.variableRezForDefinition(...args);

export const runnerEventLongtailKindForDefinition: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "runnerEventLongtailKindForDefinition"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.runnerEventLongtailKindForDefinition(
    ...args,
  );

export const hiddenReplacementLongtailForDefinition: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "hiddenReplacementLongtailForDefinition"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.hiddenReplacementLongtailForDefinition(
    ...args,
  );

export const cardImplementationRunnerEventResolver: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "cardImplementationRunnerEventResolver"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.cardImplementationRunnerEventResolver(
    ...args,
  );

export const printedCostCardImplementationMakeRunEffect: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "printedCostCardImplementationMakeRunEffect"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.printedCostCardImplementationMakeRunEffect(
    ...args,
  );

export const scoredAgendaImplementationForDefinitionId: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "scoredAgendaImplementationForDefinitionId"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.scoredAgendaImplementationForDefinitionId(
    ...args,
  );

export const scoredAgendaImplementationForDefinition: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "scoredAgendaImplementationForDefinition"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.scoredAgendaImplementationForDefinition(
    ...args,
  );

export const scoredAgendaKindForDefinition: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "scoredAgendaKindForDefinition"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.scoredAgendaKindForDefinition(...args);

export const emptyRunnerDrawSummary: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "emptyRunnerDrawSummary"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.emptyRunnerDrawSummary(...args);

export const mergeRunnerDrawSummary: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "mergeRunnerDrawSummary"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.mergeRunnerDrawSummary(...args);

export const applyRunnerDrawSummaryPayload: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "applyRunnerDrawSummaryPayload"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.applyRunnerDrawSummaryPayload(...args);

export const runnerDrawSummaryPublicPayload: CardRuntimePortFunction<
  "cardRuntimeResolvers",
  "runnerDrawSummaryPublicPayload"
> = (...args) =>
  typedRuntimePorts.cardRuntimeResolvers.runnerDrawSummaryPublicPayload(
    ...args,
  );

export const selectedServerIcebreakerStrengthCounterBonus: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "selectedServerIcebreakerStrengthCounterBonus"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.selectedServerIcebreakerStrengthCounterBonus(
    ...args,
  );

export const permanentIcebreakerStrengthCounterBonus: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "permanentIcebreakerStrengthCounterBonus"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.permanentIcebreakerStrengthCounterBonus(
    ...args,
  );

export const pumpAmountForLegalAction: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "pumpAmountForLegalAction"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.pumpAmountForLegalAction(...args);

export const pumpAbilityForLegalAction: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "pumpAbilityForLegalAction"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.pumpAbilityForLegalAction(...args);

export const breakAbilityForLegalAction: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "breakAbilityForLegalAction"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.breakAbilityForLegalAction(...args);

export const pumpDurationForLegalAction: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "pumpDurationForLegalAction"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.pumpDurationForLegalAction(...args);

export const assertCurrentSubroutineMatchesLegalAction: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "assertCurrentSubroutineMatchesLegalAction"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.assertCurrentSubroutineMatchesLegalAction(
    ...args,
  );

export const resolveMultiBreakSubroutinesAction: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "resolveMultiBreakSubroutinesAction"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.resolveMultiBreakSubroutinesAction(
    ...args,
  );

export const assertBreakSubroutineCostQuoteValid: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "assertBreakSubroutineCostQuoteValid"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.assertBreakSubroutineCostQuoteValid(
    ...args,
  );

export const subroutinesForCurrentEncounter: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "subroutinesForCurrentEncounter"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.subroutinesForCurrentEncounter(...args);

export const variableTraceSubroutineForCurrentEncounter: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "variableTraceSubroutineForCurrentEncounter"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.variableTraceSubroutineForCurrentEncounter(
    ...args,
  );

export const relativeDamageSubroutineForCurrentEncounter: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "relativeDamageSubroutineForCurrentEncounter"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.relativeDamageSubroutineForCurrentEncounter(
    ...args,
  );

export const relativeTraceSubroutinesForCurrentEncounter: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "relativeTraceSubroutinesForCurrentEncounter"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.relativeTraceSubroutinesForCurrentEncounter(
    ...args,
  );

export const runCardImplementationActionHost: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "runCardImplementationActionHost"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.runCardImplementationActionHost(...args);

export const runStartTaxForServerUpgrades: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "runStartTaxForServerUpgrades"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.runStartTaxForServerUpgrades(...args);

export const runStartTaxForCorpRootAssets: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "runStartTaxForCorpRootAssets"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.runStartTaxForCorpRootAssets(...args);

export const spendRunnerAccessTrashCredits: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "spendRunnerAccessTrashCredits"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.spendRunnerAccessTrashCredits(...args);

export const runnerSpecialTriggerExecutionHost: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "runnerSpecialTriggerExecutionHost"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.runnerSpecialTriggerExecutionHost(...args);

export const runFortTriggerExecutionHost: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "runFortTriggerExecutionHost"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.runFortTriggerExecutionHost(...args);

export const counterUtilityTriggerExecutionHost: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "counterUtilityTriggerExecutionHost"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.counterUtilityTriggerExecutionHost(
    ...args,
  );

export const triggerAbilityExecutionHost: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "triggerAbilityExecutionHost"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.triggerAbilityExecutionHost(...args);

export const installCardHost: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "installCardHost"
> = (...args) => typedRuntimePorts.cardRuntimeHosts.installCardHost(...args);

export const rezCardHost: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "rezCardHost"
> = (...args) => typedRuntimePorts.cardRuntimeHosts.rezCardHost(...args);

export const traceOrchestrationHost: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "traceOrchestrationHost"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.traceOrchestrationHost(...args);

export const activatedCardImplementationExecutionHost: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "activatedCardImplementationExecutionHost"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.activatedCardImplementationExecutionHost(
    ...args,
  );

export const resolveRunnerTargetedEventImplementation: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "resolveRunnerTargetedEventImplementation"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.resolveRunnerTargetedEventImplementation(
    ...args,
  );

export const resolvePostOnPlayGenericFollowups: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "resolvePostOnPlayGenericFollowups"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.resolvePostOnPlayGenericFollowups(...args);

export const resolveRunnerGripHeapStackShuffleDrawEvent: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "resolveRunnerGripHeapStackShuffleDrawEvent"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.resolveRunnerGripHeapStackShuffleDrawEvent(
    ...args,
  );

export const shuffleGripTrashAndStackThenDrawForCardImplementation: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "shuffleGripTrashAndStackThenDrawForCardImplementation"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.shuffleGripTrashAndStackThenDrawForCardImplementation(
    ...args,
  );

export const startRunnerProgramTrashBeforeInstallChoice: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "startRunnerProgramTrashBeforeInstallChoice"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.startRunnerProgramTrashBeforeInstallChoice(
    ...args,
  );

export const resolveRunnerProgramTrashBeforeInstallChoice: CardRuntimePortFunction<
  "cardRuntimeHosts",
  "resolveRunnerProgramTrashBeforeInstallChoice"
> = (...args) =>
  typedRuntimePorts.cardRuntimeHosts.resolveRunnerProgramTrashBeforeInstallChoice(
    ...args,
  );
