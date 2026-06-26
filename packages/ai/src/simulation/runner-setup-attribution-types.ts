import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";

export type RunnerSetupAttributionMetricKey =
  | "runnerStarvedEconomySkipWindows"
  | "runnerStarvedEconomySkipChosenRun"
  | "runnerStarvedEconomySkipChosenDraw"
  | "runnerStarvedEconomySkipChosenInstall"
  | "runnerStarvedEconomySkipChosenSearchRecovery"
  | "runnerStarvedEconomySkipChosenTrash"
  | "runnerStarvedEconomySkipChosenEndTurn"
  | "runnerStarvedEconomySkipChosenUnknown"
  | "runnerStarvedEconomySkipThenUnaffordableRun"
  | "runnerStarvedEconomySkipThenFailedRun"
  | "runnerStarvedEconomySkipThenNoProgress"
  | "runnerStarvedEconomySkipThenEconomyNextDecision"
  | "runnerStarvedEconomySkipThenReserveRecovered"
  | "runnerStarvedEconomySkipThenProgress"
  | "runnerStarvedEconomySkipThenActionLimit"
  | "runnerStarvedEconomySkipPlausiblePressure"
  | "runnerStarvedEconomySkipPlausibleRemoteContest"
  | "runnerStarvedEconomySkipPlausibleCriticalSetup"
  | "runnerStarvedEconomySkipPlausibleTrash"
  | "runnerStarvedEconomySkipSuspiciousLowValueRun"
  | "runnerStarvedEconomySkipSuspiciousDraw"
  | "runnerStarvedEconomySkipSuspiciousEndTurn"
  | "runnerStarvedEconomySkipSuspiciousUnknown"
  | "runnerEconomyFixGateAttributionEligible"
  | "runnerEconomyFixGateAttributionBlocked"
  | "runnerEconomyFixGateAttributionSuspicious"
  | "runnerSearchRecoveryFixGateWindows"
  | "runnerSearchRecoveryFixGateLegalSearch"
  | "runnerSearchRecoveryFixGateLegalRecovery"
  | "runnerSearchRecoveryFixGateMissingWall"
  | "runnerSearchRecoveryFixGateMissingCodeGate"
  | "runnerSearchRecoveryFixGateMissingSentry"
  | "runnerSearchRecoveryFixGateMissingUniversal"
  | "runnerSearchRecoveryFixGateMissingSpecial"
  | "runnerSearchRecoveryAttributionWindows"
  | "runnerSearchRecoveryAttributionLegalSearch"
  | "runnerSearchRecoveryAttributionLegalRecovery"
  | "runnerSearchRecoveryAttributionMissingWall"
  | "runnerSearchRecoveryAttributionMissingCodeGate"
  | "runnerSearchRecoveryAttributionMissingSentry"
  | "runnerSearchRecoveryAttributionMissingUniversal"
  | "runnerSearchRecoveryAttributionMissingSpecial"
  | "runnerSearchRecoveryAttributionSearchTaken"
  | "runnerSearchRecoveryAttributionRecoveryTaken"
  | "runnerSearchRecoveryAttributionSkipped"
  | "runnerSearchRecoverySkipChosenEconomy"
  | "runnerSearchRecoverySkipChosenRun"
  | "runnerSearchRecoverySkipChosenDraw"
  | "runnerSearchRecoverySkipChosenInstall"
  | "runnerSearchRecoverySkipChosenTrash"
  | "runnerSearchRecoverySkipChosenEndTurn"
  | "runnerSearchRecoverySkipChosenUnknown"
  | "runnerSearchRecoverySkipThenInstallFollowup"
  | "runnerSearchRecoverySkipThenCoverageResolved"
  | "runnerSearchRecoverySkipThenCoverageStillMissing"
  | "runnerSearchRecoverySkipThenKnownUnaffordableRun"
  | "runnerSearchRecoverySkipThenNoProgress"
  | "runnerSearchRecoverySkipThenActionLimit"
  | "runnerSearchRecoveryWindowWithNoInstallFollowup"
  | "runnerSearchRecoverySkipPlausibleEconomyReserve"
  | "runnerSearchRecoverySkipPlausiblePressure"
  | "runnerSearchRecoverySkipPlausibleRemoteContest"
  | "runnerSearchRecoverySkipPlausibleCurrentRigEnough"
  | "runnerSearchRecoverySkipSuspiciousCoverageStillMissing"
  | "runnerSearchRecoverySkipSuspiciousNoProgress"
  | "runnerSearchRecoverySkipSuspiciousKnownUnbreakableRun"
  | "runnerSearchRecoverySkipUnclassified"
  | "runnerSearchRecoveryFixGateAttributionEligible"
  | "runnerSearchRecoveryFixGateAttributionBlocked"
  | "runnerSearchRecoveryFixGateAttributionSuspicious"
  | "runnerMemoryFixGateWindows"
  | "runnerHandSizeFixGateWindows"
  | "runnerMemoryFixGateLegalSupport"
  | "runnerHandSizeFixGateLegalSupport"
  | "runnerMemoryFixGateSkipped"
  | "runnerHandSizeFixGateSkipped"
  | "runnerMemoryAttributionWindows"
  | "runnerHandSizeAttributionWindows"
  | "runnerMemoryAttributionLegalSupport"
  | "runnerHandSizeAttributionLegalSupport"
  | "runnerMemoryAttributionSupportTaken"
  | "runnerHandSizeAttributionSupportTaken"
  | "runnerMemoryAttributionSkipped"
  | "runnerHandSizeAttributionSkipped"
  | "runnerMemorySkipChosenEconomy"
  | "runnerMemorySkipChosenRun"
  | "runnerMemorySkipChosenDraw"
  | "runnerMemorySkipChosenInstallNonMemory"
  | "runnerMemorySkipChosenSearchRecovery"
  | "runnerMemorySkipChosenEndTurn"
  | "runnerMemorySkipChosenUnknown"
  | "runnerMemorySkipThenMemoryInstalled"
  | "runnerMemorySkipThenProgramInstallBlocked"
  | "runnerMemorySkipThenCoverageStillMissing"
  | "runnerMemorySkipThenNoProgress"
  | "runnerMemorySkipThenActionLimit"
  | "runnerHandSizeSkipThenDamageRiskWindow"
  | "runnerHandSizeSkipThenDiscardOrDamagePressure"
  | "runnerMemorySkipPlausibleEconomyReserve"
  | "runnerMemorySkipPlausiblePressure"
  | "runnerMemorySkipPlausibleRemoteContest"
  | "runnerMemorySkipPlausibleNoProgramPressure"
  | "runnerMemorySkipSuspiciousRigBlocked"
  | "runnerMemorySkipSuspiciousCoverageStillMissing"
  | "runnerMemorySkipSuspiciousNoProgress"
  | "runnerMemorySkipUnclassified"
  | "runnerMemoryFixGateAttributionEligible"
  | "runnerMemoryFixGateAttributionBlocked"
  | "runnerMemoryFixGateAttributionSuspicious"
  | "runnerHandSizeFixGateAttributionEligible"
  | "runnerHandSizeFixGateAttributionBlocked"
  | "runnerHandSizeFixGateAttributionSuspicious"
  | "runnerSearchRecoveryNormalizedWindows"
  | "runnerSearchRecoveryNormalizedTaken"
  | "runnerSearchRecoveryNormalizedSkipped"
  | "runnerSearchRecoveryNormalizedBlocked"
  | "runnerSearchRecoveryNormalizedBlockedByPressureOrRemoteContest"
  | "runnerSearchRecoveryNormalizedBlockedByEconomyOrReserve"
  | "runnerSearchRecoveryNormalizedBlockedByCurrentRigEnough"
  | "runnerSearchRecoveryNormalizedBlockedByNoInstallFollowup"
  | "runnerSearchRecoveryNormalizedMetricArtifact"
  | "runnerSearchRecoveryNormalizedUnclassified"
  | "runnerSearchRecoveryNormalizedSuspicious"
  | "runnerSearchRecoveryNormalizedTrueMissedCoverage"
  | "runnerSearchRecoveryNormalizedFixGateEligible"
  | "runnerMemoryNormalizedWindows"
  | "runnerMemoryNormalizedTaken"
  | "runnerMemoryNormalizedSkipped"
  | "runnerMemoryNormalizedBlocked"
  | "runnerMemoryNormalizedBlockedByPressureOrRemoteContest"
  | "runnerMemoryNormalizedBlockedByEconomyOrReserve"
  | "runnerMemoryNormalizedBlockedByNoProgramPressure"
  | "runnerMemoryNormalizedMetricArtifact"
  | "runnerMemoryNormalizedUnclassified"
  | "runnerMemoryNormalizedSuspicious"
  | "runnerMemoryNormalizedTrueRigBottleneck"
  | "runnerMemoryNormalizedFixGateEligible"
  | "runnerHandSizeNormalizedWindows"
  | "runnerHandSizeNormalizedTaken"
  | "runnerHandSizeNormalizedSkipped"
  | "runnerHandSizeNormalizedBlocked"
  | "runnerHandSizeNormalizedSuspicious"
  | "runnerHandSizeNormalizedMetricArtifact"
  | "runnerSetupNormalizedWindows"
  | "runnerSetupNormalizedSuspicious"
  | "runnerSetupNormalizedBlocked"
  | "runnerSetupNormalizedMetricArtifact"
  | "runnerSetupNormalizedUnclassified"
  | "runnerSetupNormalizedFixGateEligible"
  | "runnerSetupNormalizedRecommendedFixKindNone"
  | "runnerSetupNormalizedRecommendedFixKindSearchRecovery"
  | "runnerSetupNormalizedRecommendedFixKindMemory"
  | "runnerSetupNormalizedRecommendedFixKindHandSize"
  | "runnerSetupNormalizedRecommendedFixKindMixedNeedsMoreDiagnosis"
  | "runnerSetupAttributionWindows"
  | "runnerSetupAttributionSuspicious"
  | "runnerSetupAttributionBlocked"
  | "runnerSetupAttributionUnclassified"
  | "runnerSetupAttributionByKindStarvedEconomy"
  | "runnerSetupAttributionByKindSearchRecovery"
  | "runnerSetupAttributionByKindMemory"
  | "runnerSetupAttributionByKindHandSize"
  | "runnerSetupRecommendedFixKindNone"
  | "runnerSetupRecommendedFixKindEconomyStarvedSkip"
  | "runnerSetupRecommendedFixKindSearchRecovery"
  | "runnerSetupRecommendedFixKindMemorySetup"
  | "runnerSetupRecommendedFixKindHandSizeSetup"
  | "runnerSetupRecommendedFixKindMixedNeedsMoreDiagnosis";

export type RunnerSetupChosenFamily =
  | "economy"
  | "run"
  | "draw"
  | "install"
  | "searchRecovery"
  | "trash"
  | "endTurn"
  | "unknown";

export function runnerSetupChosenFamilyForEntry(entry: {
  actionType: string;
  runnerEconomyTaken?: boolean;
  runnerDrawAction?: boolean;
  runnerRigInstallAction?: boolean;
  runnerSearchTaken?: boolean;
  runnerRecoveryTaken?: boolean;
  runnerRemoteTrashTaken?: boolean;
}): RunnerSetupChosenFamily {
  if (entry.runnerEconomyTaken === true) return "economy";
  if (entry.actionType === "start_run") return "run";
  if (entry.runnerDrawAction === true || entry.actionType === "draw_card")
    return "draw";
  if (entry.runnerSearchTaken === true || entry.runnerRecoveryTaken === true)
    return "searchRecovery";
  if (
    entry.runnerRemoteTrashTaken === true ||
    entry.actionType === "trash_accessed_card"
  )
    return "trash";
  if (
    entry.actionType === "install_card" ||
    entry.runnerRigInstallAction === true
  )
    return "install";
  if (entry.actionType === "end_turn") return "endTurn";
  return "unknown";
}

export function capitalizeRunnerSetupFamily(
  family: RunnerSetupChosenFamily,
): string {
  if (family === "searchRecovery") return "SearchRecovery";
  if (family === "endTurn") return "EndTurn";
  return family.charAt(0).toUpperCase() + family.slice(1);
}

export function incrementCoverageTypes(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  entry: AiSimulationActionSequenceEntry,
): void {
  const types = entry.runnerSetupMissingCoverageTypes ?? [];
  if (types.includes("wall")) {
    metrics.runnerSearchRecoveryFixGateMissingWall += 1;
    metrics.runnerSearchRecoveryAttributionMissingWall += 1;
  }
  if (types.includes("code_gate")) {
    metrics.runnerSearchRecoveryFixGateMissingCodeGate += 1;
    metrics.runnerSearchRecoveryAttributionMissingCodeGate += 1;
  }
  if (types.includes("sentry")) {
    metrics.runnerSearchRecoveryFixGateMissingSentry += 1;
    metrics.runnerSearchRecoveryAttributionMissingSentry += 1;
  }
  if (types.includes("universal")) {
    metrics.runnerSearchRecoveryFixGateMissingUniversal += 1;
    metrics.runnerSearchRecoveryAttributionMissingUniversal += 1;
  }
  if (types.includes("special")) {
    metrics.runnerSearchRecoveryFixGateMissingSpecial += 1;
    metrics.runnerSearchRecoveryAttributionMissingSpecial += 1;
  }
}
