import { runtimeDelegate, runtimeDelegates } from "./runtime-delegate-store";
import type {
  StateRuntimePortFunction,
  StateRuntimePortGroups,
} from "./runtime-port-contracts";

const typedRuntimePorts = runtimeDelegates as unknown as StateRuntimePortGroups;

export const expireScoredAgendaInstallRezCreditAbilities: StateRuntimePortFunction<
  "expireScoredAgendaInstallRezCreditAbilities"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.expireScoredAgendaInstallRezCreditAbilities(
    ...args,
  );

export const isCorpInstallableCardType: StateRuntimePortFunction<
  "isCorpInstallableCardType"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.isCorpInstallableCardType(...args);

export const edgerunnerTempsInstallActionsRemaining: StateRuntimePortFunction<
  "edgerunnerTempsInstallActionsRemaining"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.edgerunnerTempsInstallActionsRemaining(
    ...args,
  );

export const clearEdgerunnerTempsInstallFlags: StateRuntimePortFunction<
  "clearEdgerunnerTempsInstallFlags"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.clearEdgerunnerTempsInstallFlags(
    ...args,
  );

export const consumeEdgerunnerTempsInstallAction: StateRuntimePortFunction<
  "consumeEdgerunnerTempsInstallAction"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.consumeEdgerunnerTempsInstallAction(
    ...args,
  );

export const valuPakProgramInstallActionsRemaining: StateRuntimePortFunction<
  "valuPakProgramInstallActionsRemaining"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.valuPakProgramInstallActionsRemaining(
    ...args,
  );

export const valuPakTemporaryProgramInstallCredits: StateRuntimePortFunction<
  "valuPakTemporaryProgramInstallCredits"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.valuPakTemporaryProgramInstallCredits(
    ...args,
  );

export const runnerInstallableProgramIdsForValuPak: StateRuntimePortFunction<
  "runnerInstallableProgramIdsForValuPak"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.runnerInstallableProgramIdsForValuPak(
    ...args,
  );

export const installedRunnerProgramTrashOptionsForInstall: StateRuntimePortFunction<
  "installedRunnerProgramTrashOptionsForInstall"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.installedRunnerProgramTrashOptionsForInstall(
    ...args,
  );

export const runnerProgramInstallMemoryReachableAfterTrash: StateRuntimePortFunction<
  "runnerProgramInstallMemoryReachableAfterTrash"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.runnerProgramInstallMemoryReachableAfterTrash(
    ...args,
  );

export const shouldOfferRunnerProgramTrashBeforeInstall: StateRuntimePortFunction<
  "shouldOfferRunnerProgramTrashBeforeInstall"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.shouldOfferRunnerProgramTrashBeforeInstall(
    ...args,
  );

export const clearValuPakProgramInstallFlags: StateRuntimePortFunction<
  "clearValuPakProgramInstallFlags"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.clearValuPakProgramInstallFlags(
    ...args,
  );

export const consumeValuPakProgramInstallAction: StateRuntimePortFunction<
  "consumeValuPakProgramInstallAction"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.consumeValuPakProgramInstallAction(
    ...args,
  );

export const runnerDrawActionContext: StateRuntimePortFunction<
  "runnerDrawActionContext"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.runnerDrawActionContext(...args);

export const normalizeSubtypeLabel: StateRuntimePortFunction<
  "normalizeSubtypeLabel"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.normalizeSubtypeLabel(...args);

export const cardHasSubtype: StateRuntimePortFunction<"cardHasSubtype"> = (
  ...args
) => typedRuntimePorts.stateRuntimeServices.cardHasSubtype(...args);

export const stableSubtypeList: StateRuntimePortFunction<
  "stableSubtypeList"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.stableSubtypeList(...args);

export const effectiveSubtypesForCard: StateRuntimePortFunction<
  "effectiveSubtypesForCard"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.effectiveSubtypesForCard(...args);

export const rezzedIceOutsideThisIceCount: StateRuntimePortFunction<
  "rezzedIceOutsideThisIceCount"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.rezzedIceOutsideThisIceCount(...args);

export const relativeIceStrengthBonusFor: StateRuntimePortFunction<
  "relativeIceStrengthBonusFor"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.relativeIceStrengthBonusFor(...args);

export const isRegionUpgrade: StateRuntimePortFunction<"isRegionUpgrade"> = (
  ...args
) => typedRuntimePorts.stateRuntimeServices.isRegionUpgrade(...args);

export const isUniqueCard: StateRuntimePortFunction<"isUniqueCard"> = (
  ...args
) => typedRuntimePorts.stateRuntimeServices.isUniqueCard(...args);

export const rezzedBlackIceIds: StateRuntimePortFunction<
  "rezzedBlackIceIds"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.rezzedBlackIceIds(...args);

export const rezzedInstalledIceIds: StateRuntimePortFunction<
  "rezzedInstalledIceIds"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.rezzedInstalledIceIds(...args);

export const affordableRezzedInstalledIceIdsForRunner: StateRuntimePortFunction<
  "affordableRezzedInstalledIceIdsForRunner"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.affordableRezzedInstalledIceIdsForRunner(
    ...args,
  );

export const unrezzedInstalledIceIds: StateRuntimePortFunction<
  "unrezzedInstalledIceIds"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.unrezzedInstalledIceIds(...args);

export const hasInstalledUniqueCardDefinition: StateRuntimePortFunction<
  "hasInstalledUniqueCardDefinition"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.hasInstalledUniqueCardDefinition(
    ...args,
  );

export const daemonHostingCapacity: StateRuntimePortFunction<
  "daemonHostingCapacity"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.daemonHostingCapacity(...args);

export const daemonHostedMemoryUsed: StateRuntimePortFunction<
  "daemonHostedMemoryUsed"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.daemonHostedMemoryUsed(...args);

export const canHostProgramOnDaemon: StateRuntimePortFunction<
  "canHostProgramOnDaemon"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.canHostProgramOnDaemon(...args);

export const hostedProgramStrengthModifier: StateRuntimePortFunction<
  "hostedProgramStrengthModifier"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.hostedProgramStrengthModifier(...args);

export const icebreakerEncounterStrengthBonus: StateRuntimePortFunction<
  "icebreakerEncounterStrengthBonus"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.icebreakerEncounterStrengthBonus(
    ...args,
  );

export const rezzedCorpRootCardIds: StateRuntimePortFunction<
  "rezzedCorpRootCardIds"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.rezzedCorpRootCardIds(...args);

export const visibleVirusCounterTargetIds: StateRuntimePortFunction<
  "visibleVirusCounterTargetIds"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.visibleVirusCounterTargetIds(...args);

export const iceStrengthBonusFor: StateRuntimePortFunction<
  "iceStrengthBonusFor"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.iceStrengthBonusFor(...args);

export const iceStrengthFor: StateRuntimePortFunction<"iceStrengthFor"> = (
  ...args
) => typedRuntimePorts.stateRuntimeServices.iceStrengthFor(...args);

export const runRemainderStrengthBonusForBreaker: StateRuntimePortFunction<
  "runRemainderStrengthBonusForBreaker"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.runRemainderStrengthBonusForBreaker(
    ...args,
  );

export const runBreakSubroutineAdditionalCost: StateRuntimePortFunction<
  "runBreakSubroutineAdditionalCost"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.runBreakSubroutineAdditionalCost(
    ...args,
  );

export const runnerHardwareBreakSubroutineAdditionalCost: StateRuntimePortFunction<
  "runnerHardwareBreakSubroutineAdditionalCost"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.runnerHardwareBreakSubroutineAdditionalCost(
    ...args,
  );

export const breakSubroutineCostBreakdown: StateRuntimePortFunction<
  "breakSubroutineCostBreakdown"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.breakSubroutineCostBreakdown(...args);

export const hasInstalledRunnerApDamageReducerHardware: StateRuntimePortFunction<
  "hasInstalledRunnerApDamageReducerHardware"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.hasInstalledRunnerApDamageReducerHardware(
    ...args,
  );

export const runnerHasInstalledCardDefinition: StateRuntimePortFunction<
  "runnerHasInstalledCardDefinition"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.runnerHasInstalledCardDefinition(
    ...args,
  );

export const runnerInstalledCardCountByDefinition: StateRuntimePortFunction<
  "runnerInstalledCardCountByDefinition"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.runnerInstalledCardCountByDefinition(
    ...args,
  );

export const installedVirusCounterTotalForDefinition: StateRuntimePortFunction<
  "installedVirusCounterTotalForDefinition"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.installedVirusCounterTotalForDefinition(
    ...args,
  );

export const virusCounterImplementationForDefinition: StateRuntimePortFunction<
  "virusCounterImplementationForDefinition"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.virusCounterImplementationForDefinition(
    ...args,
  );

export const virusCounterImplementationForCard: StateRuntimePortFunction<
  "virusCounterImplementationForCard"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.virusCounterImplementationForCard(
    ...args,
  );

export const corpUtilityImplementationForCard: StateRuntimePortFunction<
  "corpUtilityImplementationForCard"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.corpUtilityImplementationForCard(
    ...args,
  );

export const hasCorpUtilityKind: StateRuntimePortFunction<
  "hasCorpUtilityKind"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.hasCorpUtilityKind(...args);

export const cardInstallCapabilitiesForDefinition: StateRuntimePortFunction<
  "cardInstallCapabilitiesForDefinition"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.cardInstallCapabilitiesForDefinition(
    ...args,
  );

export const hasInstallCapabilityKindForDefinition: StateRuntimePortFunction<
  "hasInstallCapabilityKindForDefinition"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.hasInstallCapabilityKindForDefinition(
    ...args,
  );

export const rootInstallRezzesOnInstall: StateRuntimePortFunction<
  "rootInstallRezzesOnInstall"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.rootInstallRezzesOnInstall(...args);

export const mustInstallInsideSubsidiaryDataFort: StateRuntimePortFunction<
  "mustInstallInsideSubsidiaryDataFort"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.mustInstallInsideSubsidiaryDataFort(
    ...args,
  );

export const fortCapacityModifiersForCard: StateRuntimePortFunction<
  "fortCapacityModifiersForCard"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.fortCapacityModifiersForCard(...args);

export const leavePlayCleanupImplementationsForCard: StateRuntimePortFunction<
  "leavePlayCleanupImplementationsForCard"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.leavePlayCleanupImplementationsForCard(
    ...args,
  );

export const installedRunnerVirusSourceIds: StateRuntimePortFunction<
  "installedRunnerVirusSourceIds"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.installedRunnerVirusSourceIds(...args);

export const cockroachCounterTotal: StateRuntimePortFunction<
  "cockroachCounterTotal"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.cockroachCounterTotal(...args);

export const incubatorCounterTotal: StateRuntimePortFunction<
  "incubatorCounterTotal"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.incubatorCounterTotal(...args);

export const cockroachRandomHqDiscardActive: StateRuntimePortFunction<
  "cockroachRandomHqDiscardActive"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.cockroachRandomHqDiscardActive(
    ...args,
  );

export const isVisibleVirusCounterCardForRunner: StateRuntimePortFunction<
  "isVisibleVirusCounterCardForRunner"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.isVisibleVirusCounterCardForRunner(
    ...args,
  );

export const corpIceInstallBaseCost: StateRuntimePortFunction<
  "corpIceInstallBaseCost"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.corpIceInstallBaseCost(...args);

export const outermostIceIndex: StateRuntimePortFunction<
  "outermostIceIndex"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.outermostIceIndex(...args);

export const poxCountersForServer: StateRuntimePortFunction<
  "poxCountersForServer"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.poxCountersForServer(...args);

export const spyCountersForServer: StateRuntimePortFunction<
  "spyCountersForServer"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.spyCountersForServer(...args);

export const poxInstallTax: StateRuntimePortFunction<"poxInstallTax"> = (
  ...args
) => typedRuntimePorts.stateRuntimeServices.poxInstallTax(...args);

export const corpIceInstallAdditionalCost: StateRuntimePortFunction<
  "corpIceInstallAdditionalCost"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.corpIceInstallAdditionalCost(...args);

export const corpIceInstallTotalCost: StateRuntimePortFunction<
  "corpIceInstallTotalCost"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.corpIceInstallTotalCost(...args);

export const assertCorpIceInstallCostValid: StateRuntimePortFunction<
  "assertCorpIceInstallCostValid"
> = (...args) =>
  typedRuntimePorts.stateRuntimeServices.assertCorpIceInstallCostValid(...args);

export function serverDifficultyIncreaseFromRunCounters(...args: any[]): any {
  return runtimeDelegate(
    "stateCorpRuntimeResolvers",
    "serverDifficultyIncreaseFromRunCounters",
  )(...args);
}

export function serverDifficultyReductionFromUpgrades(...args: any[]): any {
  return runtimeDelegate(
    "stateCorpRuntimeResolvers",
    "serverDifficultyReductionFromUpgrades",
  )(...args);
}

export function discardRandomCorpHqCards(...args: any[]): any {
  return runtimeDelegate(
    "lifecycleRuntime",
    "discardRandomCorpHqCards",
  )(...args);
}

export function trashRunnerInstalledProgram(...args: any[]): any {
  return runtimeDelegate(
    "lifecycleRuntime",
    "trashRunnerInstalledProgram",
  )(...args);
}

export function backupProgramsOnTrashBackupHardwareBeforeTrash(
  ...args: any[]
): any {
  return runtimeDelegate(
    "lifecycleRuntime",
    "backupProgramsOnTrashBackupHardwareBeforeTrash",
  )(...args);
}

export function runnerProgramUsesMemory(...args: any[]): any {
  return runtimeDelegate(
    "lifecycleRuntime",
    "runnerProgramUsesMemory",
  )(...args);
}

export function trashRunnerInstalledCardToHeap(...args: any[]): any {
  return runtimeDelegate(
    "lifecycleRuntime",
    "trashRunnerInstalledCardToHeap",
  )(...args);
}

export function returnRunnerInstalledCardToGrip(...args: any[]): any {
  return runtimeDelegate(
    "lifecycleRuntime",
    "returnRunnerInstalledCardToGrip",
  )(...args);
}

export function returnRunnerInstalledProgramsToGripForAccess(
  ...args: any[]
): any {
  return runtimeDelegate(
    "lifecycleRuntime",
    "returnRunnerInstalledProgramsToGripForAccess",
  )(...args);
}

export function trashCorpInstalledCardToArchives(...args: any[]): any {
  return runtimeDelegate(
    "lifecycleRuntime",
    "trashCorpInstalledCardToArchives",
  )(...args);
}

export function cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay(
  ...args: any[]
): any {
  return runtimeDelegate(
    "lifecycleRuntime",
    "cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay",
  )(...args);
}

export function drawRunnerCard(...args: any[]): any {
  return runtimeDelegate("lifecycleRuntime", "drawRunnerCard")(...args);
}

export function activeCrashEverettSourceId(...args: any[]): any {
  return runtimeDelegate(
    "lifecycleRuntime",
    "activeCrashEverettSourceId",
  )(...args);
}

export function startCrashEverettDrawChoice(...args: any[]): any {
  return runtimeDelegate(
    "lifecycleRuntime",
    "startCrashEverettDrawChoice",
  )(...args);
}

export function drawRunnerCards(...args: any[]): any {
  return runtimeDelegate("lifecycleRuntime", "drawRunnerCards")(...args);
}

export function resolveCrashEverettDrawChoice(...args: any[]): any {
  return runtimeDelegate(
    "lifecycleRuntime",
    "resolveCrashEverettDrawChoice",
  )(...args);
}

export function resolveRunnerDrawSequenceChoice(...args: any[]): any {
  return runtimeDelegate(
    "lifecycleRuntime",
    "resolveRunnerDrawSequenceChoice",
  )(...args);
}

export function resumeRunnerDrawSequenceAfterTagPrevention(
  ...args: any[]
): any {
  return runtimeDelegate(
    "lifecycleRuntime",
    "resumeRunnerDrawSequenceAfterTagPrevention",
  )(...args);
}

export function swapCorpHqAndRdTop(...args: any[]): any {
  return runtimeDelegate(
    "stateCorpRuntimeResolvers",
    "swapCorpHqAndRdTop",
  )(...args);
}

export function spendRecurringTraceCreditPool(...args: any[]): any {
  return runtimeDelegate(
    "stateCorpRuntimeResolvers",
    "spendRecurringTraceCreditPool",
  )(...args);
}

export function resolveTraceHardwareWreckerSuccess(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "resolveTraceHardwareWreckerSuccess",
  )(...args);
}

export function resolveTraceTrashRunnerResourceSuccess(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "resolveTraceTrashRunnerResourceSuccess",
  )(...args);
}

export function encounterTemporaryTraceCreditsAvailable(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "encounterTemporaryTraceCreditsAvailable",
  )(...args);
}

export function spendEncounterTemporaryTraceCredits(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "spendEncounterTemporaryTraceCredits",
  )(...args);
}

export function identityModifierAmount(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "identityModifierAmount",
  )(...args);
}

export function identityDefinition(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "identityDefinition",
  )(...args);
}

export function executeEffectCommands(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "executeEffectCommands",
  )(...args);
}

export function assertNonNegativeAmount(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "assertNonNegativeAmount",
  )(...args);
}

export function assertPositiveIntegerAmount(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "assertPositiveIntegerAmount",
  )(...args);
}

export function withoutVariableIceState(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "withoutVariableIceState",
  )(...args);
}

export function clickCostForAction(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "clickCostForAction",
  )(...args);
}

export function creditCostForAction(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "creditCostForAction",
  )(...args);
}

export function runnerActionsPerTurn(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "runnerActionsPerTurn",
  )(...args);
}

export function agendaPoints(...args: any[]): any {
  return runtimeDelegate("stateRuntimeResolvers", "agendaPoints")(...args);
}

export function addVirusCounterWithCounterPrevention(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "addVirusCounterWithCounterPrevention",
  )(...args);
}

export function preventOneVirusCounterWithCounterPrevention(
  ...args: any[]
): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "preventOneVirusCounterWithCounterPrevention",
  )(...args);
}

export function addVisibleCardCounter(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "addVisibleCardCounter",
  )(...args);
}

export function spendVisibleCardCounter(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "spendVisibleCardCounter",
  )(...args);
}

export function totalCounters(...args: any[]): any {
  return runtimeDelegate("stateRuntimeResolvers", "totalCounters")(...args);
}

export function installedVirusCounterPurgePreserveSourceIds(
  ...args: any[]
): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "installedVirusCounterPurgePreserveSourceIds",
  )(...args);
}

export function virusCounterPurgePreserveTargets(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "virusCounterPurgePreserveTargets",
  )(...args);
}

export function startVirusCounterPurgePreserveChoice(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "startVirusCounterPurgePreserveChoice",
  )(...args);
}

export function parseVirusCounterPurgePreserveOption(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "parseVirusCounterPurgePreserveOption",
  )(...args);
}

export function restorePurgePreservedVirusCounters(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "restorePurgePreservedVirusCounters",
  )(...args);
}

export function resolveVirusCounterPurgePreserveChoice(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "resolveVirusCounterPurgePreserveChoice",
  )(...args);
}

export function installedProgramTrashBackupHardwareIds(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "installedProgramTrashBackupHardwareIds",
  )(...args);
}

export function availableRunnerProgramInstallCredits(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "availableRunnerProgramInstallCredits",
  )(...args);
}

export function runnerCanPayInstallCost(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "runnerCanPayInstallCost",
  )(...args);
}

export function runnerCostPenaltySupportCreditCapacity(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "runnerCostPenaltySupportCreditCapacity",
  )(...args);
}

export function openRunnerCostPenaltySupportWindow(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "openRunnerCostPenaltySupportWindow",
  )(...args);
}

export function closeRunnerCostPenaltySupportWindowForPayment(
  ...args: any[]
): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "closeRunnerCostPenaltySupportWindowForPayment",
  )(...args);
}

export function runnerRecurringCredits(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "runnerRecurringCredits",
  )(...args);
}

export function runnerProgramInstallRecurringCreditSourceIds(
  ...args: any[]
): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "runnerProgramInstallRecurringCreditSourceIds",
  )(...args);
}

export function spendRunnerInstallCredits(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "spendRunnerInstallCredits",
  )(...args);
}

export function runnerTagRemovalRecurringCreditSourceIds(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "runnerTagRemovalRecurringCreditSourceIds",
  )(...args);
}

export function runnerTagRemovalRecurringCredits(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "runnerTagRemovalRecurringCredits",
  )(...args);
}

export function availableRunnerTagRemovalCredits(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "availableRunnerTagRemovalCredits",
  )(...args);
}

export function spendRunnerTagRemovalCredits(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "spendRunnerTagRemovalCredits",
  )(...args);
}

export function refreshRecurringCredits(...args: any[]): any {
  return runtimeDelegate(
    "stateRuntimeResolvers",
    "refreshRecurringCredits",
  )(...args);
}
