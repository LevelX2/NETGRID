import { runtimeDelegates } from "./runtime-delegate-store";
import type {
  FlowRuntimePortFunction,
  FlowRuntimePortGroups,
} from "./runtime-port-contracts";

const typedRuntimePorts = runtimeDelegates as unknown as FlowRuntimePortGroups;

export const canInstallCorpRootCardInServer: FlowRuntimePortFunction<
  "canInstallCorpRootCardInServer"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.canInstallCorpRootCardInServer(...args);

export const corpRootAgendaOrNodeCapacityInServer: FlowRuntimePortFunction<
  "corpRootAgendaOrNodeCapacityInServer"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.corpRootAgendaOrNodeCapacityInServer(
    ...args,
  );

export const corpRegionUpgradeIdsInServer: FlowRuntimePortFunction<
  "corpRegionUpgradeIdsInServer"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.corpRegionUpgradeIdsInServer(...args);

export const startRun: FlowRuntimePortFunction<"startRun"> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.startRun(...args);

export const runnerTraceCounterEffectDefinitions: FlowRuntimePortFunction<
  "runnerTraceCounterEffectDefinitions"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.runnerTraceCounterEffectDefinitions(
    ...args,
  );

export const runnerCounterDisplayName: FlowRuntimePortFunction<
  "runnerCounterDisplayName"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.runnerCounterDisplayName(...args);

export const traceCounterEffectDefinitionFor: FlowRuntimePortFunction<
  "traceCounterEffectDefinitionFor"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.traceCounterEffectDefinitionFor(...args);

export const runnerUtilityLongtailKindForDefinition: FlowRuntimePortFunction<
  "runnerUtilityLongtailKindForDefinition"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.runnerUtilityLongtailKindForDefinition(
    ...args,
  );

export const runnerUtilityLongtailKindForCard: FlowRuntimePortFunction<
  "runnerUtilityLongtailKindForCard"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.runnerUtilityLongtailKindForCard(...args);

export const runnerUtilityLongtailImplementationForCard: FlowRuntimePortFunction<
  "runnerUtilityLongtailImplementationForCard"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.runnerUtilityLongtailImplementationForCard(
    ...args,
  );

export const uniqueDirectLongtailImplementationForDefinition: FlowRuntimePortFunction<
  "uniqueDirectLongtailImplementationForDefinition"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.uniqueDirectLongtailImplementationForDefinition(
    ...args,
  );

export const uniqueDirectLongtailKindForDefinition: FlowRuntimePortFunction<
  "uniqueDirectLongtailKindForDefinition"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.uniqueDirectLongtailKindForDefinition(
    ...args,
  );

export const uniqueDirectLongtailImplementationForCard: FlowRuntimePortFunction<
  "uniqueDirectLongtailImplementationForCard"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.uniqueDirectLongtailImplementationForCard(
    ...args,
  );

export const uniqueDirectLongtailKindForCard: FlowRuntimePortFunction<
  "uniqueDirectLongtailKindForCard"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.uniqueDirectLongtailKindForCard(...args);

export const remainingReplacementLongtailImplementationForDefinition: FlowRuntimePortFunction<
  "remainingReplacementLongtailImplementationForDefinition"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.remainingReplacementLongtailImplementationForDefinition(
    ...args,
  );

export const remainingReplacementLongtailKindForDefinition: FlowRuntimePortFunction<
  "remainingReplacementLongtailKindForDefinition"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.remainingReplacementLongtailKindForDefinition(
    ...args,
  );

export const remainingReplacementLongtailImplementationForCard: FlowRuntimePortFunction<
  "remainingReplacementLongtailImplementationForCard"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.remainingReplacementLongtailImplementationForCard(
    ...args,
  );

export const remainingReplacementLongtailKindForCard: FlowRuntimePortFunction<
  "remainingReplacementLongtailKindForCard"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.remainingReplacementLongtailKindForCard(
    ...args,
  );

export const isObligationDebtDefinition: FlowRuntimePortFunction<
  "isObligationDebtDefinition"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.isObligationDebtDefinition(...args);

export const isDrawTaxSourceDefinition: FlowRuntimePortFunction<
  "isDrawTaxSourceDefinition"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.isDrawTaxSourceDefinition(...args);

export const isCorpInstalledEconomyCreditSource: FlowRuntimePortFunction<
  "isCorpInstalledEconomyCreditSource"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.isCorpInstalledEconomyCreditSource(
    ...args,
  );

export const isCorpTraceCounterPoolSource: FlowRuntimePortFunction<
  "isCorpTraceCounterPoolSource"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.isCorpTraceCounterPoolSource(...args);

export const applyRunnerTraceCounterRunStartEffects: FlowRuntimePortFunction<
  "applyRunnerTraceCounterRunStartEffects"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.applyRunnerTraceCounterRunStartEffects(
    ...args,
  );

export const applyRunStartRandomStrengthBonus: FlowRuntimePortFunction<
  "applyRunStartRandomStrengthBonus"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.applyRunStartRandomStrengthBonus(...args);

export const continueRun: FlowRuntimePortFunction<"continueRun"> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.continueRun(...args);

export const addCurrentRunAccessCount: FlowRuntimePortFunction<
  "addCurrentRunAccessCount"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.addCurrentRunAccessCount(...args);

export const passCurrentEncounteredIce: FlowRuntimePortFunction<
  "passCurrentEncounteredIce"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.passCurrentEncounteredIce(...args);

export const resolveBlinkBreakSubroutineAction: FlowRuntimePortFunction<
  "resolveBlinkBreakSubroutineAction"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.resolveBlinkBreakSubroutineAction(...args);

export const recordBartmossEncounterUsage: FlowRuntimePortFunction<
  "recordBartmossEncounterUsage"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.recordBartmossEncounterUsage(...args);

export const recordSnowballBreakUsage: FlowRuntimePortFunction<
  "recordSnowballBreakUsage"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.recordSnowballBreakUsage(...args);

export const icebreakerHasSpecial: FlowRuntimePortFunction<
  "icebreakerHasSpecial"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.icebreakerHasSpecial(...args);

export const corpTraceCounterPoolSourceIds: FlowRuntimePortFunction<
  "corpTraceCounterPoolSourceIds"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.corpTraceCounterPoolSourceIds(...args);

export const corpTraceCounterPoolCounterType: FlowRuntimePortFunction<
  "corpTraceCounterPoolCounterType"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.corpTraceCounterPoolCounterType(...args);

export const corpTraceCounterPoolTotal: FlowRuntimePortFunction<
  "corpTraceCounterPoolTotal"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.corpTraceCounterPoolTotal(...args);

export const spendCorpTraceCounterPoolCounters: FlowRuntimePortFunction<
  "spendCorpTraceCounterPoolCounters"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.spendCorpTraceCounterPoolCounters(...args);

export const addCorpTraceCounterPoolCounters: FlowRuntimePortFunction<
  "addCorpTraceCounterPoolCounters"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.addCorpTraceCounterPoolCounters(...args);

export const rabbitTraceLimitReductionForIceTrace: FlowRuntimePortFunction<
  "rabbitTraceLimitReductionForIceTrace"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.rabbitTraceLimitReductionForIceTrace(
    ...args,
  );

export const archivesAccessRequiresDecisionOrEffect: FlowRuntimePortFunction<
  "archivesAccessRequiresDecisionOrEffect"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.archivesAccessRequiresDecisionOrEffect(
    ...args,
  );

export const runnerAccessActionHost: FlowRuntimePortFunction<
  "runnerAccessActionHost"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.runnerAccessActionHost(...args);

export const runnerEncounterActionHostForState: FlowRuntimePortFunction<
  "runnerEncounterActionHostForState"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.runnerEncounterActionHostForState(...args);

export const runMovementHostForState: FlowRuntimePortFunction<
  "runMovementHostForState"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.runMovementHostForState(...args);

export const runRezWindowHostForState: FlowRuntimePortFunction<
  "runRezWindowHostForState"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.runRezWindowHostForState(...args);

export const fortPassWindowHostForState: FlowRuntimePortFunction<
  "fortPassWindowHostForState"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.fortPassWindowHostForState(...args);

export const fortRunSideFamiliesHostForState: FlowRuntimePortFunction<
  "fortRunSideFamiliesHostForState"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.fortRunSideFamiliesHostForState(...args);

export const encounterEntryHostForState: FlowRuntimePortFunction<
  "encounterEntryHostForState"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.encounterEntryHostForState(...args);

export const successfulRunInterventionHost: FlowRuntimePortFunction<
  "successfulRunInterventionHost"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.successfulRunInterventionHost(...args);

export const encounterResolutionHostForState: FlowRuntimePortFunction<
  "encounterResolutionHostForState"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.encounterResolutionHostForState(...args);

export const encounterSpecialWindowHostForState: FlowRuntimePortFunction<
  "encounterSpecialWindowHostForState"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.encounterSpecialWindowHostForState(
    ...args,
  );

export const encounterPrintedEffectHostForState: FlowRuntimePortFunction<
  "encounterPrintedEffectHostForState"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.encounterPrintedEffectHostForState(
    ...args,
  );

export const encounterPrintedNonTraceHostForState: FlowRuntimePortFunction<
  "encounterPrintedNonTraceHostForState"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.encounterPrintedNonTraceHostForState(
    ...args,
  );

export const runEndCleanupHost: FlowRuntimePortFunction<"runEndCleanupHost"> = (
  ...args
) => typedRuntimePorts.flowRuntimeHosts.runEndCleanupHost(...args);

export const runnerBreakerActionExecutionHost: FlowRuntimePortFunction<
  "runnerBreakerActionExecutionHost"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.runnerBreakerActionExecutionHost(...args);

export const startRunActionExecutionHost: FlowRuntimePortFunction<
  "startRunActionExecutionHost"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.startRunActionExecutionHost(...args);

export const rezActionExecutionHost: FlowRuntimePortFunction<
  "rezActionExecutionHost"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.rezActionExecutionHost(...args);

export const breachStateHost: FlowRuntimePortFunction<"breachStateHost"> = (
  ...args
) => typedRuntimePorts.flowRuntimeHosts.breachStateHost(...args);

export const accessFlowHost: FlowRuntimePortFunction<"accessFlowHost"> = (
  ...args
) => typedRuntimePorts.flowRuntimeHosts.accessFlowHost(...args);

export const runAccessTransitionHost: FlowRuntimePortFunction<
  "runAccessTransitionHost"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.runAccessTransitionHost(...args);

export const accessEffectHandlerHost: FlowRuntimePortFunction<
  "accessEffectHandlerHost"
> = (...args) =>
  typedRuntimePorts.flowRuntimeHosts.accessEffectHandlerHost(...args);
