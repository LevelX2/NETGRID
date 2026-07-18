import { runtimeDelegates } from "./runtime-delegate-store";
import type {
  StateClusterRuntimePortFunction,
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

export const serverDifficultyIncreaseFromRunCounters: StateClusterRuntimePortFunction<
  "stateCorpRuntimeResolvers",
  "serverDifficultyIncreaseFromRunCounters"
> = (...args) =>
  typedRuntimePorts.stateCorpRuntimeResolvers.serverDifficultyIncreaseFromRunCounters(
    ...args,
  );

export const serverDifficultyReductionFromUpgrades: StateClusterRuntimePortFunction<
  "stateCorpRuntimeResolvers",
  "serverDifficultyReductionFromUpgrades"
> = (...args) =>
  typedRuntimePorts.stateCorpRuntimeResolvers.serverDifficultyReductionFromUpgrades(
    ...args,
  );

export const discardRandomCorpHqCards: StateClusterRuntimePortFunction<
  "lifecycleRuntime",
  "discardRandomCorpHqCards"
> = (...args) =>
  typedRuntimePorts.lifecycleRuntime.discardRandomCorpHqCards(...args);

export const trashRunnerInstalledProgram: StateClusterRuntimePortFunction<
  "lifecycleRuntime",
  "trashRunnerInstalledProgram"
> = (...args) =>
  typedRuntimePorts.lifecycleRuntime.trashRunnerInstalledProgram(...args);

export const backupProgramsOnTrashBackupHardwareBeforeTrash: StateClusterRuntimePortFunction<
  "lifecycleRuntime",
  "backupProgramsOnTrashBackupHardwareBeforeTrash"
> = (...args) =>
  typedRuntimePorts.lifecycleRuntime.backupProgramsOnTrashBackupHardwareBeforeTrash(
    ...args,
  );

export const runnerProgramUsesMemory: StateClusterRuntimePortFunction<
  "lifecycleRuntime",
  "runnerProgramUsesMemory"
> = (...args) =>
  typedRuntimePorts.lifecycleRuntime.runnerProgramUsesMemory(...args);

export const trashRunnerInstalledCardToHeap: StateClusterRuntimePortFunction<
  "lifecycleRuntime",
  "trashRunnerInstalledCardToHeap"
> = (...args) =>
  typedRuntimePorts.lifecycleRuntime.trashRunnerInstalledCardToHeap(...args);

export const returnRunnerInstalledCardToGrip: StateClusterRuntimePortFunction<
  "lifecycleRuntime",
  "returnRunnerInstalledCardToGrip"
> = (...args) =>
  typedRuntimePorts.lifecycleRuntime.returnRunnerInstalledCardToGrip(...args);

export const returnRunnerInstalledProgramsToGripForAccess: StateClusterRuntimePortFunction<
  "lifecycleRuntime",
  "returnRunnerInstalledProgramsToGripForAccess"
> = (...args) =>
  typedRuntimePorts.lifecycleRuntime.returnRunnerInstalledProgramsToGripForAccess(
    ...args,
  );

export const trashCorpInstalledCardToArchives: StateClusterRuntimePortFunction<
  "lifecycleRuntime",
  "trashCorpInstalledCardToArchives"
> = (...args) =>
  typedRuntimePorts.lifecycleRuntime.trashCorpInstalledCardToArchives(...args);

export const cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay: StateClusterRuntimePortFunction<
  "lifecycleRuntime",
  "cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay"
> = (...args) =>
  typedRuntimePorts.lifecycleRuntime.cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay(
    ...args,
  );

export const drawRunnerCard: StateClusterRuntimePortFunction<
  "lifecycleRuntime",
  "drawRunnerCard"
> = (...args) => typedRuntimePorts.lifecycleRuntime.drawRunnerCard(...args);

export const activeCrashEverettSourceId: StateClusterRuntimePortFunction<
  "lifecycleRuntime",
  "activeCrashEverettSourceId"
> = (...args) =>
  typedRuntimePorts.lifecycleRuntime.activeCrashEverettSourceId(...args);

export const startCrashEverettDrawChoice: StateClusterRuntimePortFunction<
  "lifecycleRuntime",
  "startCrashEverettDrawChoice"
> = (...args) =>
  typedRuntimePorts.lifecycleRuntime.startCrashEverettDrawChoice(...args);

export const drawRunnerCards: StateClusterRuntimePortFunction<
  "lifecycleRuntime",
  "drawRunnerCards"
> = (...args) => typedRuntimePorts.lifecycleRuntime.drawRunnerCards(...args);

export const resolveCrashEverettDrawChoice: StateClusterRuntimePortFunction<
  "lifecycleRuntime",
  "resolveCrashEverettDrawChoice"
> = (...args) =>
  typedRuntimePorts.lifecycleRuntime.resolveCrashEverettDrawChoice(...args);

export const resolveRunnerDrawSequenceChoice: StateClusterRuntimePortFunction<
  "lifecycleRuntime",
  "resolveRunnerDrawSequenceChoice"
> = (...args) =>
  typedRuntimePorts.lifecycleRuntime.resolveRunnerDrawSequenceChoice(...args);

export const resumeRunnerDrawSequenceAfterTagPrevention: StateClusterRuntimePortFunction<
  "lifecycleRuntime",
  "resumeRunnerDrawSequenceAfterTagPrevention"
> = (...args) =>
  typedRuntimePorts.lifecycleRuntime.resumeRunnerDrawSequenceAfterTagPrevention(
    ...args,
  );

export const swapCorpHqAndRdTop: StateClusterRuntimePortFunction<
  "stateCorpRuntimeResolvers",
  "swapCorpHqAndRdTop"
> = (...args) =>
  typedRuntimePorts.stateCorpRuntimeResolvers.swapCorpHqAndRdTop(...args);

export const spendRecurringTraceCreditPool: StateClusterRuntimePortFunction<
  "stateCorpRuntimeResolvers",
  "spendRecurringTraceCreditPool"
> = (...args) =>
  typedRuntimePorts.stateCorpRuntimeResolvers.spendRecurringTraceCreditPool(
    ...args,
  );

export const resolveTraceHardwareWreckerSuccess: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "resolveTraceHardwareWreckerSuccess"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.resolveTraceHardwareWreckerSuccess(
    ...args,
  );

export const resolveTraceTrashRunnerResourceSuccess: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "resolveTraceTrashRunnerResourceSuccess"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.resolveTraceTrashRunnerResourceSuccess(
    ...args,
  );

export const encounterTemporaryTraceCreditsAvailable: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "encounterTemporaryTraceCreditsAvailable"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.encounterTemporaryTraceCreditsAvailable(
    ...args,
  );

export const spendEncounterTemporaryTraceCredits: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "spendEncounterTemporaryTraceCredits"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.spendEncounterTemporaryTraceCredits(
    ...args,
  );

export const identityModifierAmount: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "identityModifierAmount"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.identityModifierAmount(...args);

export const identityDefinition: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "identityDefinition"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.identityDefinition(...args);

export const executeEffectCommands: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "executeEffectCommands"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.executeEffectCommands(...args);

export const assertNonNegativeAmount: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "assertNonNegativeAmount"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.assertNonNegativeAmount(...args);

export const assertPositiveIntegerAmount: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "assertPositiveIntegerAmount"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.assertPositiveIntegerAmount(...args);

export const withoutVariableIceState: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "withoutVariableIceState"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.withoutVariableIceState(...args);

export const clickCostForAction: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "clickCostForAction"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.clickCostForAction(...args);

export const creditCostForAction: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "creditCostForAction"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.creditCostForAction(...args);

export const runnerActionsPerTurn: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "runnerActionsPerTurn"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.runnerActionsPerTurn(...args);

export const agendaPoints: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "agendaPoints"
> = (...args) => typedRuntimePorts.stateRuntimeResolvers.agendaPoints(...args);

export const addVirusCounterWithCounterPrevention: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "addVirusCounterWithCounterPrevention"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.addVirusCounterWithCounterPrevention(
    ...args,
  );

export const preventOneVirusCounterWithCounterPrevention: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "preventOneVirusCounterWithCounterPrevention"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.preventOneVirusCounterWithCounterPrevention(
    ...args,
  );

export const addVisibleCardCounter: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "addVisibleCardCounter"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.addVisibleCardCounter(...args);

export const spendVisibleCardCounter: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "spendVisibleCardCounter"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.spendVisibleCardCounter(...args);

export const totalCounters: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "totalCounters"
> = (...args) => typedRuntimePorts.stateRuntimeResolvers.totalCounters(...args);

export const installedVirusCounterPurgePreserveSourceIds: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "installedVirusCounterPurgePreserveSourceIds"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.installedVirusCounterPurgePreserveSourceIds(
    ...args,
  );

export const virusCounterPurgePreserveTargets: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "virusCounterPurgePreserveTargets"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.virusCounterPurgePreserveTargets(
    ...args,
  );

export const startVirusCounterPurgePreserveChoice: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "startVirusCounterPurgePreserveChoice"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.startVirusCounterPurgePreserveChoice(
    ...args,
  );

export const parseVirusCounterPurgePreserveOption: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "parseVirusCounterPurgePreserveOption"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.parseVirusCounterPurgePreserveOption(
    ...args,
  );

export const restorePurgePreservedVirusCounters: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "restorePurgePreservedVirusCounters"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.restorePurgePreservedVirusCounters(
    ...args,
  );

export const resolveVirusCounterPurgePreserveChoice: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "resolveVirusCounterPurgePreserveChoice"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.resolveVirusCounterPurgePreserveChoice(
    ...args,
  );

export const installedProgramTrashBackupHardwareIds: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "installedProgramTrashBackupHardwareIds"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.installedProgramTrashBackupHardwareIds(
    ...args,
  );

export const availableRunnerProgramInstallCredits: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "availableRunnerProgramInstallCredits"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.availableRunnerProgramInstallCredits(
    ...args,
  );

export const runnerCanPayInstallCost: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "runnerCanPayInstallCost"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.runnerCanPayInstallCost(...args);

export const runnerCostPenaltySupportCreditCapacity: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "runnerCostPenaltySupportCreditCapacity"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.runnerCostPenaltySupportCreditCapacity(
    ...args,
  );

export const openRunnerCostPenaltySupportWindow: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "openRunnerCostPenaltySupportWindow"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.openRunnerCostPenaltySupportWindow(
    ...args,
  );

export const closeRunnerCostPenaltySupportWindowForPayment: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "closeRunnerCostPenaltySupportWindowForPayment"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.closeRunnerCostPenaltySupportWindowForPayment(
    ...args,
  );

export const runnerRecurringCredits: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "runnerRecurringCredits"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.runnerRecurringCredits(...args);

export const runnerProgramInstallRecurringCreditSourceIds: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "runnerProgramInstallRecurringCreditSourceIds"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.runnerProgramInstallRecurringCreditSourceIds(
    ...args,
  );

export const spendRunnerInstallCredits: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "spendRunnerInstallCredits"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.spendRunnerInstallCredits(...args);

export const runnerTagRemovalRecurringCreditSourceIds: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "runnerTagRemovalRecurringCreditSourceIds"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.runnerTagRemovalRecurringCreditSourceIds(
    ...args,
  );

export const runnerTagRemovalRecurringCredits: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "runnerTagRemovalRecurringCredits"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.runnerTagRemovalRecurringCredits(
    ...args,
  );

export const availableRunnerTagRemovalCredits: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "availableRunnerTagRemovalCredits"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.availableRunnerTagRemovalCredits(
    ...args,
  );

export const spendRunnerTagRemovalCredits: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "spendRunnerTagRemovalCredits"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.spendRunnerTagRemovalCredits(...args);

export const refreshRecurringCredits: StateClusterRuntimePortFunction<
  "stateRuntimeResolvers",
  "refreshRecurringCredits"
> = (...args) =>
  typedRuntimePorts.stateRuntimeResolvers.refreshRecurringCredits(...args);
