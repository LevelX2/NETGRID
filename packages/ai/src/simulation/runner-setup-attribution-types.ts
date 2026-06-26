import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import {
  hasMeaningfulProgressWithin,
  nextEntriesForSide,
} from "./plan-conversion-predicates";

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

export const RUNNER_SETUP_ATTRIBUTION_METRIC_KEYS: RunnerSetupAttributionMetricKey[] =
  [
    "runnerStarvedEconomySkipWindows",
    "runnerStarvedEconomySkipChosenRun",
    "runnerStarvedEconomySkipChosenDraw",
    "runnerStarvedEconomySkipChosenInstall",
    "runnerStarvedEconomySkipChosenSearchRecovery",
    "runnerStarvedEconomySkipChosenTrash",
    "runnerStarvedEconomySkipChosenEndTurn",
    "runnerStarvedEconomySkipChosenUnknown",
    "runnerStarvedEconomySkipThenUnaffordableRun",
    "runnerStarvedEconomySkipThenFailedRun",
    "runnerStarvedEconomySkipThenNoProgress",
    "runnerStarvedEconomySkipThenEconomyNextDecision",
    "runnerStarvedEconomySkipThenReserveRecovered",
    "runnerStarvedEconomySkipThenProgress",
    "runnerStarvedEconomySkipThenActionLimit",
    "runnerStarvedEconomySkipPlausiblePressure",
    "runnerStarvedEconomySkipPlausibleRemoteContest",
    "runnerStarvedEconomySkipPlausibleCriticalSetup",
    "runnerStarvedEconomySkipPlausibleTrash",
    "runnerStarvedEconomySkipSuspiciousLowValueRun",
    "runnerStarvedEconomySkipSuspiciousDraw",
    "runnerStarvedEconomySkipSuspiciousEndTurn",
    "runnerStarvedEconomySkipSuspiciousUnknown",
    "runnerEconomyFixGateAttributionEligible",
    "runnerEconomyFixGateAttributionBlocked",
    "runnerEconomyFixGateAttributionSuspicious",
    "runnerSearchRecoveryFixGateWindows",
    "runnerSearchRecoveryFixGateLegalSearch",
    "runnerSearchRecoveryFixGateLegalRecovery",
    "runnerSearchRecoveryFixGateMissingWall",
    "runnerSearchRecoveryFixGateMissingCodeGate",
    "runnerSearchRecoveryFixGateMissingSentry",
    "runnerSearchRecoveryFixGateMissingUniversal",
    "runnerSearchRecoveryFixGateMissingSpecial",
    "runnerSearchRecoveryAttributionWindows",
    "runnerSearchRecoveryAttributionLegalSearch",
    "runnerSearchRecoveryAttributionLegalRecovery",
    "runnerSearchRecoveryAttributionMissingWall",
    "runnerSearchRecoveryAttributionMissingCodeGate",
    "runnerSearchRecoveryAttributionMissingSentry",
    "runnerSearchRecoveryAttributionMissingUniversal",
    "runnerSearchRecoveryAttributionMissingSpecial",
    "runnerSearchRecoveryAttributionSearchTaken",
    "runnerSearchRecoveryAttributionRecoveryTaken",
    "runnerSearchRecoveryAttributionSkipped",
    "runnerSearchRecoverySkipChosenEconomy",
    "runnerSearchRecoverySkipChosenRun",
    "runnerSearchRecoverySkipChosenDraw",
    "runnerSearchRecoverySkipChosenInstall",
    "runnerSearchRecoverySkipChosenTrash",
    "runnerSearchRecoverySkipChosenEndTurn",
    "runnerSearchRecoverySkipChosenUnknown",
    "runnerSearchRecoverySkipThenInstallFollowup",
    "runnerSearchRecoverySkipThenCoverageResolved",
    "runnerSearchRecoverySkipThenCoverageStillMissing",
    "runnerSearchRecoverySkipThenKnownUnaffordableRun",
    "runnerSearchRecoverySkipThenNoProgress",
    "runnerSearchRecoverySkipThenActionLimit",
    "runnerSearchRecoveryWindowWithNoInstallFollowup",
    "runnerSearchRecoverySkipPlausibleEconomyReserve",
    "runnerSearchRecoverySkipPlausiblePressure",
    "runnerSearchRecoverySkipPlausibleRemoteContest",
    "runnerSearchRecoverySkipPlausibleCurrentRigEnough",
    "runnerSearchRecoverySkipSuspiciousCoverageStillMissing",
    "runnerSearchRecoverySkipSuspiciousNoProgress",
    "runnerSearchRecoverySkipSuspiciousKnownUnbreakableRun",
    "runnerSearchRecoverySkipUnclassified",
    "runnerSearchRecoveryFixGateAttributionEligible",
    "runnerSearchRecoveryFixGateAttributionBlocked",
    "runnerSearchRecoveryFixGateAttributionSuspicious",
    "runnerMemoryFixGateWindows",
    "runnerHandSizeFixGateWindows",
    "runnerMemoryFixGateLegalSupport",
    "runnerHandSizeFixGateLegalSupport",
    "runnerMemoryFixGateSkipped",
    "runnerHandSizeFixGateSkipped",
    "runnerMemoryAttributionWindows",
    "runnerHandSizeAttributionWindows",
    "runnerMemoryAttributionLegalSupport",
    "runnerHandSizeAttributionLegalSupport",
    "runnerMemoryAttributionSupportTaken",
    "runnerHandSizeAttributionSupportTaken",
    "runnerMemoryAttributionSkipped",
    "runnerHandSizeAttributionSkipped",
    "runnerMemorySkipChosenEconomy",
    "runnerMemorySkipChosenRun",
    "runnerMemorySkipChosenDraw",
    "runnerMemorySkipChosenInstallNonMemory",
    "runnerMemorySkipChosenSearchRecovery",
    "runnerMemorySkipChosenEndTurn",
    "runnerMemorySkipChosenUnknown",
    "runnerMemorySkipThenMemoryInstalled",
    "runnerMemorySkipThenProgramInstallBlocked",
    "runnerMemorySkipThenCoverageStillMissing",
    "runnerMemorySkipThenNoProgress",
    "runnerMemorySkipThenActionLimit",
    "runnerHandSizeSkipThenDamageRiskWindow",
    "runnerHandSizeSkipThenDiscardOrDamagePressure",
    "runnerMemorySkipPlausibleEconomyReserve",
    "runnerMemorySkipPlausiblePressure",
    "runnerMemorySkipPlausibleRemoteContest",
    "runnerMemorySkipPlausibleNoProgramPressure",
    "runnerMemorySkipSuspiciousRigBlocked",
    "runnerMemorySkipSuspiciousCoverageStillMissing",
    "runnerMemorySkipSuspiciousNoProgress",
    "runnerMemorySkipUnclassified",
    "runnerMemoryFixGateAttributionEligible",
    "runnerMemoryFixGateAttributionBlocked",
    "runnerMemoryFixGateAttributionSuspicious",
    "runnerHandSizeFixGateAttributionEligible",
    "runnerHandSizeFixGateAttributionBlocked",
    "runnerHandSizeFixGateAttributionSuspicious",
    "runnerSearchRecoveryNormalizedWindows",
    "runnerSearchRecoveryNormalizedTaken",
    "runnerSearchRecoveryNormalizedSkipped",
    "runnerSearchRecoveryNormalizedBlocked",
    "runnerSearchRecoveryNormalizedBlockedByPressureOrRemoteContest",
    "runnerSearchRecoveryNormalizedBlockedByEconomyOrReserve",
    "runnerSearchRecoveryNormalizedBlockedByCurrentRigEnough",
    "runnerSearchRecoveryNormalizedBlockedByNoInstallFollowup",
    "runnerSearchRecoveryNormalizedMetricArtifact",
    "runnerSearchRecoveryNormalizedUnclassified",
    "runnerSearchRecoveryNormalizedSuspicious",
    "runnerSearchRecoveryNormalizedTrueMissedCoverage",
    "runnerSearchRecoveryNormalizedFixGateEligible",
    "runnerMemoryNormalizedWindows",
    "runnerMemoryNormalizedTaken",
    "runnerMemoryNormalizedSkipped",
    "runnerMemoryNormalizedBlocked",
    "runnerMemoryNormalizedBlockedByPressureOrRemoteContest",
    "runnerMemoryNormalizedBlockedByEconomyOrReserve",
    "runnerMemoryNormalizedBlockedByNoProgramPressure",
    "runnerMemoryNormalizedMetricArtifact",
    "runnerMemoryNormalizedUnclassified",
    "runnerMemoryNormalizedSuspicious",
    "runnerMemoryNormalizedTrueRigBottleneck",
    "runnerMemoryNormalizedFixGateEligible",
    "runnerHandSizeNormalizedWindows",
    "runnerHandSizeNormalizedTaken",
    "runnerHandSizeNormalizedSkipped",
    "runnerHandSizeNormalizedBlocked",
    "runnerHandSizeNormalizedSuspicious",
    "runnerHandSizeNormalizedMetricArtifact",
    "runnerSetupNormalizedWindows",
    "runnerSetupNormalizedSuspicious",
    "runnerSetupNormalizedBlocked",
    "runnerSetupNormalizedMetricArtifact",
    "runnerSetupNormalizedUnclassified",
    "runnerSetupNormalizedFixGateEligible",
    "runnerSetupNormalizedRecommendedFixKindNone",
    "runnerSetupNormalizedRecommendedFixKindSearchRecovery",
    "runnerSetupNormalizedRecommendedFixKindMemory",
    "runnerSetupNormalizedRecommendedFixKindHandSize",
    "runnerSetupNormalizedRecommendedFixKindMixedNeedsMoreDiagnosis",
    "runnerSetupAttributionWindows",
    "runnerSetupAttributionSuspicious",
    "runnerSetupAttributionBlocked",
    "runnerSetupAttributionUnclassified",
    "runnerSetupAttributionByKindStarvedEconomy",
    "runnerSetupAttributionByKindSearchRecovery",
    "runnerSetupAttributionByKindMemory",
    "runnerSetupAttributionByKindHandSize",
    "runnerSetupRecommendedFixKindNone",
    "runnerSetupRecommendedFixKindEconomyStarvedSkip",
    "runnerSetupRecommendedFixKindSearchRecovery",
    "runnerSetupRecommendedFixKindMemorySetup",
    "runnerSetupRecommendedFixKindHandSizeSetup",
    "runnerSetupRecommendedFixKindMixedNeedsMoreDiagnosis",
  ];

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

export function incrementChosenFamily(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  prefix:
    | "runnerStarvedEconomySkip"
    | "runnerSearchRecoverySkip"
    | "runnerMemorySkip",
  entry: AiSimulationActionSequenceEntry,
): void {
  const family = runnerSetupChosenFamilyForEntry(entry);
  if (prefix === "runnerMemorySkip" && family === "install") {
    metrics.runnerMemorySkipChosenInstallNonMemory += 1;
    return;
  }
  const key = `${prefix}Chosen${capitalizeRunnerSetupFamily(family)}` as
    | RunnerSetupAttributionMetricKey
    | undefined;
  if (key && key in metrics) metrics[key] += 1;
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

export function attributeRunnerSetupSupportWindows(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  entry: AiSimulationActionSequenceEntry,
): void {
  if (entry.runnerMemoryBottleneckDecisionWindow === true) {
    metrics.runnerMemoryAttributionWindows += 1;
    metrics.runnerMemoryNormalizedWindows += 1;
    if ((entry.runnerLegalMemoryHardwareActions ?? 0) > 0)
      metrics.runnerMemoryAttributionLegalSupport += 1;
  }
  if (entry.runnerHandSizeBottleneckDecisionWindow === true) {
    metrics.runnerHandSizeAttributionWindows += 1;
    metrics.runnerHandSizeNormalizedWindows += 1;
    if ((entry.runnerLegalHandSizeActions ?? 0) > 0)
      metrics.runnerHandSizeAttributionLegalSupport += 1;
  }
  if (entry.runnerMemoryHardwareTaken === true)
    metrics.runnerMemoryAttributionSupportTaken += 1;
  if (entry.runnerMemoryHardwareTaken === true)
    metrics.runnerMemoryNormalizedTaken += 1;
  if (entry.runnerHandSizeSupportTaken === true)
    metrics.runnerHandSizeAttributionSupportTaken += 1;
  if (entry.runnerHandSizeSupportTaken === true)
    metrics.runnerHandSizeNormalizedTaken += 1;
  if (entry.runnerSearchTaken === true || entry.runnerRecoveryTaken === true) {
    metrics.runnerSearchRecoveryNormalizedWindows += 1;
    metrics.runnerSearchRecoveryNormalizedTaken += 1;
  }
}

export function attributeStarvedEconomySkip(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  sequence: AiSimulationActionSequenceEntry[],
  index: number,
  summary: AiSimulationSummary,
  isMeaningfulBoardProgress: (
    entry: AiSimulationActionSequenceEntry,
  ) => boolean,
): void {
  const entry = sequence[index]!;
  metrics.runnerStarvedEconomySkipWindows += 1;
  metrics.runnerSetupAttributionByKindStarvedEconomy += 1;
  incrementChosenFamily(metrics, "runnerStarvedEconomySkip", entry);
  const next = nextEntriesForSide(sequence, index, "runner", 5);
  if (
    entry.runStartedAgainstKnownUnaffordablePath === true ||
    next.some((candidate) => candidate.runStartedAgainstKnownUnaffordablePath)
  )
    metrics.runnerStarvedEconomySkipThenUnaffordableRun += 1;
  if (
    entry.lowValueUnaffordableRun === true ||
    entry.runEndedAfterFirstIceDueToCredits === true ||
    next.some(
      (candidate) =>
        candidate.lowValueUnaffordableRun === true ||
        candidate.runEndedAfterFirstIceDueToCredits === true,
    )
  )
    metrics.runnerStarvedEconomySkipThenFailedRun += 1;
  const progressed = hasMeaningfulProgressWithin(
    sequence,
    index,
    5,
    isMeaningfulBoardProgress,
  );
  if (!progressed) metrics.runnerStarvedEconomySkipThenNoProgress += 1;
  const economyNextDecision = next[0]?.runnerEconomyTaken === true;
  if (economyNextDecision)
    metrics.runnerStarvedEconomySkipThenEconomyNextDecision += 1;
  const reserveRecovered = next.some(
    (candidate) =>
      typeof candidate.runnerCreditsAfter === "number" &&
      typeof candidate.runnerReserveTarget === "number" &&
      candidate.runnerCreditsAfter >= candidate.runnerReserveTarget,
  );
  if (reserveRecovered)
    metrics.runnerStarvedEconomySkipThenReserveRecovered += 1;
  if (progressed) metrics.runnerStarvedEconomySkipThenProgress += 1;
  if (summary.winner === "action_limit_reached")
    metrics.runnerStarvedEconomySkipThenActionLimit += 1;

  const blocked =
    entry.runnerEconomySkippedForPressure === true ||
    entry.runnerEconomySkippedForRemoteContest === true ||
    entry.runnerEconomySkippedForInstallBreaker === true ||
    entry.runnerEconomySkippedForSetup === true ||
    entry.runnerEconomySkippedForTrash === true;
  if (entry.runnerEconomySkippedForPressure === true)
    metrics.runnerStarvedEconomySkipPlausiblePressure += 1;
  if (entry.runnerEconomySkippedForRemoteContest === true)
    metrics.runnerStarvedEconomySkipPlausibleRemoteContest += 1;
  if (
    entry.runnerEconomySkippedForInstallBreaker === true ||
    entry.runnerEconomySkippedForSetup === true
  )
    metrics.runnerStarvedEconomySkipPlausibleCriticalSetup += 1;
  if (entry.runnerEconomySkippedForTrash === true)
    metrics.runnerStarvedEconomySkipPlausibleTrash += 1;
  const suspiciousLowValue =
    entry.lowValueUnaffordableRun === true ||
    entry.runStartedAgainstKnownUnaffordablePath === true;
  if (suspiciousLowValue)
    metrics.runnerStarvedEconomySkipSuspiciousLowValueRun += 1;
  const suspiciousDraw =
    entry.runnerEconomySkippedForDraw === true &&
    !economyNextDecision &&
    !reserveRecovered;
  const suspiciousEndTurn =
    entry.runnerEconomySkippedForEndTurn === true &&
    !economyNextDecision &&
    !reserveRecovered;
  const suspiciousUnknown =
    entry.runnerEconomySkippedForUnknownHigherPriority === true &&
    !economyNextDecision &&
    !reserveRecovered;
  if (suspiciousDraw) metrics.runnerStarvedEconomySkipSuspiciousDraw += 1;
  if (suspiciousEndTurn) metrics.runnerStarvedEconomySkipSuspiciousEndTurn += 1;
  if (suspiciousUnknown) metrics.runnerStarvedEconomySkipSuspiciousUnknown += 1;
  const suspicious =
    suspiciousLowValue ||
    suspiciousDraw ||
    suspiciousEndTurn ||
    suspiciousUnknown ||
    (!blocked && !progressed);
  metrics.runnerEconomyFixGateAttributionEligible += 1;
  if (blocked) metrics.runnerEconomyFixGateAttributionBlocked += 1;
  if (suspicious) metrics.runnerEconomyFixGateAttributionSuspicious += 1;
}

export function attributeNormalizedSearchRecoverySkip(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  entry: AiSimulationActionSequenceEntry,
  followup: {
    installFollowup: boolean;
    coverageResolved: boolean;
    knownUnaffordableRun: boolean;
    noProgress: boolean;
    actionLimit: boolean;
  },
): void {
  metrics.runnerSearchRecoveryNormalizedWindows += 1;
  if (entry.runnerSearchTaken === true || entry.runnerRecoveryTaken === true)
    metrics.runnerSearchRecoveryNormalizedTaken += 1;
  else metrics.runnerSearchRecoveryNormalizedSkipped += 1;

  const blockedPressure =
    entry.runnerPressureActionTaken === true ||
    entry.runnerRemoteRunAgainstAdvancedRemote === true ||
    entry.runnerCentralRunWhileRemoteScoreThreatVisible === true ||
    entry.runnerRemoteTrashTaken === true;
  if (blockedPressure) {
    metrics.runnerSearchRecoveryNormalizedBlocked += 1;
    metrics.runnerSearchRecoveryNormalizedBlockedByPressureOrRemoteContest += 1;
    return;
  }

  if (
    entry.runnerEconomyTaken === true ||
    entry.runnerEconomyActionTaken === true
  ) {
    metrics.runnerSearchRecoveryNormalizedBlocked += 1;
    metrics.runnerSearchRecoveryNormalizedBlockedByEconomyOrReserve += 1;
    return;
  }

  if (
    entry.runnerPressureReadyTrue === true &&
    entry.runnerPathBlockedByMissingCoverage !== true
  ) {
    metrics.runnerSearchRecoveryNormalizedMetricArtifact += 1;
    metrics.runnerSearchRecoveryNormalizedBlockedByCurrentRigEnough += 1;
    return;
  }

  const missingCoverage =
    (entry.runnerSetupMissingCoverageTypes ?? []).length > 0;
  const legalSearchRecovery =
    (entry.runnerLegalSearchActions ?? 0) +
      (entry.runnerLegalRecoveryActions ?? 0) >
    0;
  if (!missingCoverage || !legalSearchRecovery) {
    metrics.runnerSearchRecoveryNormalizedMetricArtifact += 1;
    return;
  }

  const followupProblem =
    !followup.coverageResolved &&
    (followup.knownUnaffordableRun ||
      followup.noProgress ||
      followup.actionLimit);
  if (followupProblem) {
    metrics.runnerSearchRecoveryNormalizedSuspicious += 1;
    metrics.runnerSearchRecoveryNormalizedTrueMissedCoverage += 1;
    metrics.runnerSearchRecoveryNormalizedFixGateEligible += 1;
    return;
  }

  if (!followup.installFollowup && !followup.coverageResolved) {
    metrics.runnerSearchRecoveryNormalizedMetricArtifact += 1;
    metrics.runnerSearchRecoveryNormalizedBlockedByNoInstallFollowup += 1;
    return;
  }

  metrics.runnerSearchRecoveryNormalizedUnclassified += 1;
}

export function attributeSearchRecoverySkip(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  sequence: AiSimulationActionSequenceEntry[],
  index: number,
  summary: AiSimulationSummary,
  isMeaningfulBoardProgress: (
    entry: AiSimulationActionSequenceEntry,
  ) => boolean,
): void {
  const entry = sequence[index]!;
  metrics.runnerSearchRecoveryFixGateWindows += 1;
  metrics.runnerSearchRecoveryAttributionWindows += 1;
  metrics.runnerSearchRecoveryAttributionSkipped += 1;
  metrics.runnerSetupAttributionByKindSearchRecovery += 1;
  if ((entry.runnerLegalSearchActions ?? 0) > 0) {
    metrics.runnerSearchRecoveryFixGateLegalSearch += 1;
    metrics.runnerSearchRecoveryAttributionLegalSearch += 1;
  }
  if ((entry.runnerLegalRecoveryActions ?? 0) > 0) {
    metrics.runnerSearchRecoveryFixGateLegalRecovery += 1;
    metrics.runnerSearchRecoveryAttributionLegalRecovery += 1;
  }
  if (entry.runnerSearchTaken === true)
    metrics.runnerSearchRecoveryAttributionSearchTaken += 1;
  if (entry.runnerRecoveryTaken === true)
    metrics.runnerSearchRecoveryAttributionRecoveryTaken += 1;
  incrementCoverageTypes(metrics, entry);
  incrementChosenFamily(metrics, "runnerSearchRecoverySkip", entry);
  const next = nextEntriesForSide(sequence, index, "runner", 5);
  const installFollowup = next.some(
    (candidate) => candidate.actionType === "install_card",
  );
  const coverageResolved = next.some(
    (candidate) => candidate.runnerCoverageImproved === true,
  );
  const knownUnaffordableRun = next.some(
    (candidate) => candidate.runStartedAgainstKnownUnaffordablePath === true,
  );
  const noProgress = !hasMeaningfulProgressWithin(
    sequence,
    index,
    5,
    isMeaningfulBoardProgress,
  );
  const actionLimit = summary.winner === "action_limit_reached" && noProgress;
  if (installFollowup) metrics.runnerSearchRecoverySkipThenInstallFollowup += 1;
  if (coverageResolved)
    metrics.runnerSearchRecoverySkipThenCoverageResolved += 1;
  if (!coverageResolved)
    metrics.runnerSearchRecoverySkipThenCoverageStillMissing += 1;
  if (knownUnaffordableRun)
    metrics.runnerSearchRecoverySkipThenKnownUnaffordableRun += 1;
  if (noProgress) metrics.runnerSearchRecoverySkipThenNoProgress += 1;
  if (actionLimit) metrics.runnerSearchRecoverySkipThenActionLimit += 1;
  if (!installFollowup)
    metrics.runnerSearchRecoveryWindowWithNoInstallFollowup += 1;

  const blocked =
    entry.runnerEconomyTaken === true ||
    entry.runnerPressureActionTaken === true ||
    entry.runnerRemoteRunAgainstAdvancedRemote === true ||
    entry.runnerCentralRunWhileRemoteScoreThreatVisible === true;
  if (entry.runnerEconomyTaken === true)
    metrics.runnerSearchRecoverySkipPlausibleEconomyReserve += 1;
  if (entry.runnerPressureActionTaken === true)
    metrics.runnerSearchRecoverySkipPlausiblePressure += 1;
  if (
    entry.runnerRemoteRunAgainstAdvancedRemote === true ||
    entry.runnerCentralRunWhileRemoteScoreThreatVisible === true
  )
    metrics.runnerSearchRecoverySkipPlausibleRemoteContest += 1;
  if (
    entry.runnerPressureReadyTrue === true &&
    entry.runnerPathBlockedByMissingCoverage !== true
  )
    metrics.runnerSearchRecoverySkipPlausibleCurrentRigEnough += 1;
  const suspiciousCoverage = !coverageResolved && !installFollowup;
  if (suspiciousCoverage)
    metrics.runnerSearchRecoverySkipSuspiciousCoverageStillMissing += 1;
  if (noProgress) metrics.runnerSearchRecoverySkipSuspiciousNoProgress += 1;
  if (knownUnaffordableRun)
    metrics.runnerSearchRecoverySkipSuspiciousKnownUnbreakableRun += 1;
  const suspicious = suspiciousCoverage || noProgress || knownUnaffordableRun;
  if (!blocked && !suspicious)
    metrics.runnerSearchRecoverySkipUnclassified += 1;
  metrics.runnerSearchRecoveryFixGateAttributionEligible += 1;
  if (blocked) metrics.runnerSearchRecoveryFixGateAttributionBlocked += 1;
  if (suspicious) metrics.runnerSearchRecoveryFixGateAttributionSuspicious += 1;
  attributeNormalizedSearchRecoverySkip(metrics, entry, {
    installFollowup,
    coverageResolved,
    knownUnaffordableRun,
    noProgress,
    actionLimit,
  });
}

export function attributeHandSizeSkip(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  sequence: AiSimulationActionSequenceEntry[],
  index: number,
): void {
  const entry = sequence[index]!;
  const next = nextEntriesForSide(sequence, index, "runner", 5);
  metrics.runnerHandSizeFixGateWindows += 1;
  metrics.runnerSetupAttributionByKindHandSize += 1;
  metrics.runnerHandSizeFixGateLegalSupport += 1;
  metrics.runnerHandSizeFixGateSkipped += 1;
  metrics.runnerHandSizeAttributionSkipped += 1;
  metrics.runnerHandSizeSkipThenDamageRiskWindow += 1;
  metrics.runnerHandSizeFixGateAttributionEligible += 1;
  const blocked =
    entry.runnerEconomyTaken === true ||
    entry.runnerPressureActionTaken === true ||
    entry.runnerRemoteRunAgainstAdvancedRemote === true ||
    entry.runnerCentralRunWhileRemoteScoreThreatVisible === true;
  if (blocked) metrics.runnerHandSizeFixGateAttributionBlocked += 1;
  const suspicious = next.some(
    (candidate) =>
      candidate.runnerDiscardChoice === true ||
      candidate.runnerHandSizeSupportSkippedWhileDamageRiskVisible === true,
  );
  if (suspicious) metrics.runnerHandSizeSkipThenDiscardOrDamagePressure += 1;
  if (suspicious) metrics.runnerHandSizeFixGateAttributionSuspicious += 1;
  attributeNormalizedHandSizeSkip(metrics, entry, { blocked, suspicious });
}

export function attributeNormalizedHandSizeSkip(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  entry: AiSimulationActionSequenceEntry,
  context: { blocked: boolean; suspicious: boolean },
): void {
  if (entry.runnerHandSizeBottleneckDecisionWindow !== true)
    metrics.runnerHandSizeNormalizedWindows += 1;
  if (entry.runnerHandSizeSupportTaken === true)
    metrics.runnerHandSizeNormalizedTaken += 1;
  else metrics.runnerHandSizeNormalizedSkipped += 1;

  const legalHandSizeSupport = (entry.runnerLegalHandSizeActions ?? 0) > 0;
  if (!legalHandSizeSupport) {
    metrics.runnerHandSizeNormalizedMetricArtifact += 1;
    return;
  }

  if (context.blocked) {
    metrics.runnerHandSizeNormalizedBlocked += 1;
    return;
  }

  if (context.suspicious) {
    metrics.runnerHandSizeNormalizedSuspicious += 1;
    return;
  }

  metrics.runnerHandSizeNormalizedMetricArtifact += 1;
}

export function attributeNormalizedMemorySkip(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  entry: AiSimulationActionSequenceEntry,
  followup: {
    memoryInstalled: boolean;
    programBlocked: boolean;
    coverageStillMissing: boolean;
    noProgress: boolean;
    actionLimit: boolean;
  },
): void {
  if (entry.runnerMemoryBottleneckDecisionWindow !== true)
    metrics.runnerMemoryNormalizedWindows += 1;
  if (entry.runnerMemoryHardwareTaken === true)
    metrics.runnerMemoryNormalizedTaken += 1;
  else metrics.runnerMemoryNormalizedSkipped += 1;

  const legalMemorySupport = (entry.runnerLegalMemoryHardwareActions ?? 0) > 0;
  if (!legalMemorySupport) {
    metrics.runnerMemoryNormalizedMetricArtifact += 1;
    return;
  }

  const blockedPressure =
    entry.runnerPressureActionTaken === true ||
    entry.runnerRemoteRunAgainstAdvancedRemote === true ||
    entry.runnerCentralRunWhileRemoteScoreThreatVisible === true ||
    entry.runnerRemoteTrashTaken === true;
  if (blockedPressure) {
    metrics.runnerMemoryNormalizedBlocked += 1;
    metrics.runnerMemoryNormalizedBlockedByPressureOrRemoteContest += 1;
    return;
  }

  if (
    entry.runnerEconomyTaken === true ||
    entry.runnerEconomyActionTaken === true
  ) {
    metrics.runnerMemoryNormalizedBlocked += 1;
    metrics.runnerMemoryNormalizedBlockedByEconomyOrReserve += 1;
    return;
  }

  if (entry.runnerMemorySupportSkippedWhileGripHasPrograms !== true) {
    metrics.runnerMemoryNormalizedBlocked += 1;
    metrics.runnerMemoryNormalizedBlockedByNoProgramPressure += 1;
    return;
  }

  const followupProblem =
    !followup.memoryInstalled &&
    (followup.programBlocked ||
      followup.coverageStillMissing ||
      followup.noProgress ||
      followup.actionLimit);
  if (followupProblem) {
    metrics.runnerMemoryNormalizedSuspicious += 1;
    metrics.runnerMemoryNormalizedTrueRigBottleneck += 1;
    metrics.runnerMemoryNormalizedFixGateEligible += 1;
    return;
  }

  metrics.runnerMemoryNormalizedUnclassified += 1;
}

export function attributeMemorySkip(
  metrics: Record<RunnerSetupAttributionMetricKey, number>,
  sequence: AiSimulationActionSequenceEntry[],
  index: number,
  summary: AiSimulationSummary,
  isMeaningfulBoardProgress: (
    entry: AiSimulationActionSequenceEntry,
  ) => boolean,
): void {
  const entry = sequence[index]!;
  metrics.runnerMemoryFixGateWindows += 1;
  metrics.runnerSetupAttributionByKindMemory += 1;
  if ((entry.runnerLegalMemoryHardwareActions ?? 0) > 0)
    metrics.runnerMemoryFixGateLegalSupport += 1;
  metrics.runnerMemoryFixGateSkipped += 1;
  metrics.runnerMemoryAttributionSkipped += 1;
  incrementChosenFamily(metrics, "runnerMemorySkip", entry);
  const next = nextEntriesForSide(sequence, index, "runner", 5);
  const memoryInstalled = next.some(
    (candidate) => candidate.runnerMemoryHardwareTaken === true,
  );
  const programBlocked =
    entry.runnerMemorySupportSkippedWhileGripHasPrograms === true &&
    !memoryInstalled;
  const coverageStillMissing =
    !next.some((candidate) => candidate.runnerCoverageImproved === true) &&
    next.some(
      (candidate) =>
        candidate.runnerPathBlockedByMissingCoverage === true ||
        candidate.runnerSetupFixGateEligibleSearchRecoverySkip === true,
    );
  const noProgress = !hasMeaningfulProgressWithin(
    sequence,
    index,
    5,
    isMeaningfulBoardProgress,
  );
  const actionLimit = summary.winner === "action_limit_reached" && noProgress;
  if (memoryInstalled) metrics.runnerMemorySkipThenMemoryInstalled += 1;
  if (programBlocked) metrics.runnerMemorySkipThenProgramInstallBlocked += 1;
  if (coverageStillMissing)
    metrics.runnerMemorySkipThenCoverageStillMissing += 1;
  if (noProgress) metrics.runnerMemorySkipThenNoProgress += 1;
  if (actionLimit) metrics.runnerMemorySkipThenActionLimit += 1;

  const blocked =
    entry.runnerEconomyTaken === true ||
    entry.runnerPressureActionTaken === true ||
    entry.runnerRemoteRunAgainstAdvancedRemote === true ||
    entry.runnerCentralRunWhileRemoteScoreThreatVisible === true;
  if (entry.runnerEconomyTaken === true)
    metrics.runnerMemorySkipPlausibleEconomyReserve += 1;
  if (entry.runnerPressureActionTaken === true)
    metrics.runnerMemorySkipPlausiblePressure += 1;
  if (
    entry.runnerRemoteRunAgainstAdvancedRemote === true ||
    entry.runnerCentralRunWhileRemoteScoreThreatVisible === true
  )
    metrics.runnerMemorySkipPlausibleRemoteContest += 1;
  if (entry.runnerMemorySupportSkippedWhileGripHasPrograms !== true)
    metrics.runnerMemorySkipPlausibleNoProgramPressure += 1;
  const suspiciousRig = programBlocked || coverageStillMissing;
  if (suspiciousRig) metrics.runnerMemorySkipSuspiciousRigBlocked += 1;
  if (coverageStillMissing)
    metrics.runnerMemorySkipSuspiciousCoverageStillMissing += 1;
  if (noProgress) metrics.runnerMemorySkipSuspiciousNoProgress += 1;
  const suspicious = suspiciousRig || noProgress;
  if (!blocked && !suspicious) metrics.runnerMemorySkipUnclassified += 1;
  metrics.runnerMemoryFixGateAttributionEligible += 1;
  if (blocked) metrics.runnerMemoryFixGateAttributionBlocked += 1;
  if (suspicious) metrics.runnerMemoryFixGateAttributionSuspicious += 1;
  attributeNormalizedMemorySkip(metrics, entry, {
    memoryInstalled,
    programBlocked,
    coverageStillMissing,
    noProgress,
    actionLimit,
  });
}
