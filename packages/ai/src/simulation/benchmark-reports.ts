import { formatMarkdownTableRow as formatSuiteMetricRow } from "../reports/markdown-table";
import type {
  AiBenchmarkCorpArchetype,
  AiBenchmarkDeckSlotType,
} from "./benchmark-deck-types";
import type { AiBenchmarkDeckSlotResult } from "./ai-match-progression-types";
import type { AiDoctrineQualityBenchmarkResult } from "./doctrine-quality-benchmark-types";
import type {
  AiDoctrineQualityGateResult,
  AiDoctrineQualityGateThresholds,
} from "./doctrine-quality-tags";
import type {
  AiMatchProgressionBenchmarkResult,
  AiMatchProgressionMetrics,
  AiMatchProgressionBenchmarkSuiteResult,
} from "./ai-match-progression-types";
import type { AiSelfplayTraceMiningResult } from "./selfplay-trace-mining";
import { countSimulationRuntimeFailures } from "./simulation-quality-gate";
import { CORP_STRATEGY_PANEL_TARGETS } from "./benchmark-deck-strategy-panel";
import { buildSelfplayActionTypeDominanceReport } from "./selfplay-action-type-dominance";
import { buildSemanticRuntimeWhyCoverageReportFromSimulationSummaries } from "./selfplay-why-coverage";

// Simulation-only report helpers. Live AI decisions must not depend on these
// aggregate benchmark outputs as an action source.

export function evaluateDoctrineQualityGate(
  benchmark: AiDoctrineQualityBenchmarkResult,
  thresholds: Partial<AiDoctrineQualityGateThresholds> = {},
): AiDoctrineQualityGateResult {
  const resolved: AiDoctrineQualityGateThresholds = {
    maxCandidateIllegalActions: thresholds.maxCandidateIllegalActions ?? 0,
    maxCandidateRuntimeFailures: thresholds.maxCandidateRuntimeFailures ?? 0,
    maxCandidateReplayFailures: thresholds.maxCandidateReplayFailures ?? 0,
    maxTimeoutRateDelta: thresholds.maxTimeoutRateDelta ?? 0,
    maxFallbackRateDelta: thresholds.maxFallbackRateDelta ?? 0.02,
    maxNakedAgendaInstallDelta: thresholds.maxNakedAgendaInstallDelta ?? 0,
    maxScoreWindowMissedDelta: thresholds.maxScoreWindowMissedDelta ?? 0,
    maxEconomyStallDelta: thresholds.maxEconomyStallDelta ?? 2,
    maxRepeatedLowValueCentralRunDelta:
      thresholds.maxRepeatedLowValueCentralRunDelta ?? 2,
  };
  const candidateRuntimeFailures = countSimulationRuntimeFailures(
    benchmark.candidateRun,
  );
  const hardFailures = [
    ...(candidateRuntimeFailures > 0
      ? [`candidate_runtime_failures:${candidateRuntimeFailures}`]
      : []),
    ...(benchmark.candidateRun.illegalActions >
    resolved.maxCandidateIllegalActions
      ? [`candidate_illegal_actions:${benchmark.candidateRun.illegalActions}`]
      : []),
    ...(benchmark.candidateRun.runtimeFailures >
    resolved.maxCandidateRuntimeFailures
      ? [`candidate_runtime_failure_events:${benchmark.candidateRun.runtimeFailures}`]
      : []),
    ...(benchmark.candidateRun.replayFailures >
    resolved.maxCandidateReplayFailures
      ? [`candidate_replay_failures:${benchmark.candidateRun.replayFailures}`]
      : []),
    ...(benchmark.safety.timeoutRateDelta > resolved.maxTimeoutRateDelta
      ? [`timeout_rate_delta:${benchmark.safety.timeoutRateDelta}`]
      : []),
    ...(benchmark.safety.fallbackRateDelta > resolved.maxFallbackRateDelta
      ? [`fallback_rate_delta:${benchmark.safety.fallbackRateDelta}`]
      : []),
    ...(benchmark.delta.nakedAgendaInstalls >
    resolved.maxNakedAgendaInstallDelta
      ? [`naked_agenda_install_delta:${benchmark.delta.nakedAgendaInstalls}`]
      : []),
    ...(benchmark.delta.scoreWindowMissed > resolved.maxScoreWindowMissedDelta
      ? [`score_window_missed_delta:${benchmark.delta.scoreWindowMissed}`]
      : []),
    ...(benchmark.delta.economyStall > resolved.maxEconomyStallDelta
      ? [`economy_stall_delta:${benchmark.delta.economyStall}`]
      : []),
    ...(benchmark.delta.repeatedLowValueCentralRun >
    resolved.maxRepeatedLowValueCentralRunDelta
      ? [
          `repeated_low_value_central_run_delta:${benchmark.delta.repeatedLowValueCentralRun}`,
        ]
      : []),
  ];
  const warnings = [
    ...(benchmark.delta.remoteOverbuild > 0
      ? [`remote_overbuild_delta:${benchmark.delta.remoteOverbuild}`]
      : []),
    ...(benchmark.delta.rigStall > 0
      ? [`rig_stall_delta:${benchmark.delta.rigStall}`]
      : []),
    ...(benchmark.delta.assetTrashNeglect > 0
      ? [`asset_trash_neglect_delta:${benchmark.delta.assetTrashNeglect}`]
      : []),
  ];
  return {
    accepted: hardFailures.length === 0,
    thresholds: resolved,
    hardFailures,
    warnings,
  };
}

export function formatDoctrineQualityBenchmarkReport(
  benchmark: AiDoctrineQualityBenchmarkResult,
  gate: AiDoctrineQualityGateResult = evaluateDoctrineQualityGate(benchmark),
): string {
  const doctrineRows = [
    [
      "nakedAgendaInstalls",
      benchmark.baseline.nakedAgendaInstalls,
      benchmark.candidate.nakedAgendaInstalls,
      benchmark.delta.nakedAgendaInstalls,
    ],
    [
      "agendaFloodExposure",
      benchmark.baseline.agendaFloodExposure,
      benchmark.candidate.agendaFloodExposure,
      benchmark.delta.agendaFloodExposure,
    ],
    [
      "scoreWindowMissed",
      benchmark.baseline.scoreWindowMissed,
      benchmark.candidate.scoreWindowMissed,
      benchmark.delta.scoreWindowMissed,
    ],
    [
      "remoteOverbuild",
      benchmark.baseline.remoteOverbuild,
      benchmark.candidate.remoteOverbuild,
      benchmark.delta.remoteOverbuild,
    ],
    [
      "economyStall",
      benchmark.baseline.economyStall,
      benchmark.candidate.economyStall,
      benchmark.delta.economyStall,
    ],
    [
      "repeatedLowValueCentralRun",
      benchmark.baseline.repeatedLowValueCentralRun,
      benchmark.candidate.repeatedLowValueCentralRun,
      benchmark.delta.repeatedLowValueCentralRun,
    ],
    [
      "rigStall",
      benchmark.baseline.rigStall,
      benchmark.candidate.rigStall,
      benchmark.delta.rigStall,
    ],
    [
      "assetTrashNeglect",
      benchmark.baseline.assetTrashNeglect,
      benchmark.candidate.assetTrashNeglect,
      benchmark.delta.assetTrashNeglect,
    ],
  ];
  const safetyRows = [
    ["illegalActionDelta", benchmark.safety.illegalActionDelta],
    ["runtimeFailureEventDelta", benchmark.safety.runtimeFailureEventDelta],
    ["replayFailureDelta", benchmark.safety.replayFailureDelta],
    ["runtimeFailureDelta", benchmark.safety.runtimeFailureDelta],
    ["timeoutRateDelta", benchmark.safety.timeoutRateDelta],
    ["fallbackRateDelta", benchmark.safety.fallbackRateDelta],
  ];
  return [
    "# AI Deck Doctrine Quality Benchmark Report",
    "",
    `Version: ${benchmark.version}`,
    `Baseline: ${benchmark.baselineProfile}`,
    `Candidate: ${benchmark.candidateProfile}`,
    `Seeds: ${benchmark.seeds.length}`,
    `Gate: ${gate.accepted ? "PASS" : "FAIL"}`,
    "",
    "## Doctrine Delta",
    "",
    "| Metric | Baseline | Candidate | Delta |",
    "| --- | ---: | ---: | ---: |",
    ...doctrineRows.map(
      ([metric, baseline, candidate, delta]) =>
        `| ${metric} | ${baseline} | ${candidate} | ${delta} |`,
    ),
    "",
    "## Safety Delta",
    "",
    "| Metric | Delta |",
    "| --- | ---: |",
    ...safetyRows.map(([metric, value]) => `| ${metric} | ${value} |`),
    "",
    "## Gate",
    "",
    `Accepted: ${gate.accepted ? "yes" : "no"}`,
    `Hard failures: ${gate.hardFailures.length > 0 ? gate.hardFailures.join(", ") : "none"}`,
    `Warnings: ${gate.warnings.length > 0 ? gate.warnings.join(", ") : "none"}`,
    "",
    "## Interpretation",
    "",
    gate.accepted
      ? "Der Kandidat verletzt keine harte Safety- oder Doctrine-Schwelle. Einzelne Warnungen bleiben Review-Material, bevor Gewichte angepasst werden."
      : "Der Kandidat verletzt mindestens eine harte Schwelle. Gewichtungs- oder Planänderungen sollten vor weiterer Ausweitung geprüft werden.",
  ].join("\n");
}

export function formatAiSelfplayTraceMiningReport(
  result: AiSelfplayTraceMiningResult,
): string {
  const whyCoverage =
    buildSemanticRuntimeWhyCoverageReportFromSimulationSummaries(
      result.summaries,
    );
  const actionTypeDominance = buildSelfplayActionTypeDominanceReport(
    result.summaries,
  );
  const severityRows = Object.entries(result.aggregate.findingsBySeverity).map(
    ([severity, count]) => `| ${severity} | ${count} |`,
  );
  const detectorRows = Object.entries(result.aggregate.findingsByDetector)
    .filter(([, count]) => count > 0)
    .map(([detector, count]) => `| ${detector} | ${count} |`);
  const actionLimitClusterRows = Object.entries(
    result.aggregate.actionLimitClusters,
  )
    .filter(([, count]) => count > 0)
    .map(([cluster, count]) => `| ${cluster} | ${count} |`);
  const actionLimitSubclusterRows = Object.entries(
    result.aggregate.actionLimitSubclusters,
  )
    .filter(([, count]) => count > 0)
    .map(([subcluster, count]) => `| ${subcluster} | ${count} |`);
  const topFindingRows =
    result.topFindings.length > 0
      ? result.topFindings.map(
          (finding) =>
            formatSuiteMetricRow([
              finding.severity,
              finding.seed,
              finding.stateVersion,
              finding.side,
              finding.selectedActionType,
              finding.detectorIds.join(", "),
              finding.shortReason,
              finding.relevantDebugFacts.slice(0, 4).join("; "),
            ]),
        )
      : ["| none | none | 0 | unknown | none | none | Keine Funde. |  |"];
  return [
    "# AI Selfplay Trace Mining Report",
    "",
    `Version: ${result.version}`,
    `Gate: diagnostic_only`,
    `No training: ${result.noTraining ? "yes" : "no"}`,
    `No autofix: ${result.noAutofix ? "yes" : "no"}`,
    `Seeds: ${result.config.seeds.join(", ")}`,
    `Max actions: ${result.config.maxActions}`,
    `Runner deck: ${result.config.runnerDeckId}`,
    `Corp deck: ${result.config.corpDeckId}`,
    `Runner mode: ${result.config.runnerControllerMode}`,
    `Corp mode: ${result.config.corpControllerMode}`,
    "",
    "## Aggregate",
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    `| games | ${result.aggregate.games} |`,
    `| decisions | ${result.aggregate.decisions} |`,
    `| findings | ${result.aggregate.findings} |`,
    `| illegalActions | ${result.aggregate.illegalActions} |`,
    `| replayFailures | ${result.aggregate.replayFailures} |`,
    `| actionLimitReached | ${result.aggregate.actionLimitReached} |`,
    `| allRedactionSafe | ${result.aggregate.allRedactionSafe ? 1 : 0} |`,
    `| redactionSafe | ${result.aggregate.redactionSafe ? 1 : 0} |`,
    `| averageGameLength | ${result.aggregate.averageGameLength} |`,
    `| corpAgendaScores | ${result.aggregate.corpAgendaScores} |`,
    `| runnerAgendaSteals | ${result.aggregate.runnerAgendaSteals} |`,
    `| corpFlatlines | ${result.aggregate.corpFlatlines} |`,
    `| scoreWindowMissed | ${result.aggregate.scoreWindowMissed} |`,
    "",
    "## Action Type Dominance",
    "",
    `- Status: ${actionTypeDominance.status}`,
    `- Threshold: ${actionTypeDominance.threshold}`,
    `- Decisions: ${actionTypeDominance.decisions}`,
    `- Top share: ${actionTypeDominance.topShare}`,
    `- Findings: ${actionTypeDominance.findings.length > 0 ? actionTypeDominance.findings.join(", ") : "none"}`,
    "",
    "| Side | Top Action Type | Decisions | Top Share | Status |",
    "| --- | --- | ---: | ---: | --- |",
    ...(["all", "runner", "corp"] as const).map((side) => {
      const bucket = actionTypeDominance.bySide[side];
      return `| ${side} | ${bucket.topActionType ?? "none"} | ${bucket.decisions} | ${bucket.topShare} | ${bucket.status} |`;
    }),
    "",
    "| Side | Action Type | Count | Share |",
    "| --- | --- | ---: | ---: |",
    ...actionTypeDominance.topRows.map(
      (row) =>
        `| ${row.side} | ${row.actionType} | ${row.count} | ${row.share} |`,
    ),
    "",
    "## Findings By Severity",
    "",
    "| Severity | Count |",
    "| --- | ---: |",
    ...severityRows,
    "",
    "## Findings By Detector",
    "",
    "| Detector | Count |",
    "| --- | ---: |",
    ...(detectorRows.length > 0 ? detectorRows : ["| none | 0 |"]),
    "",
    "## Action Limit Clusters",
    "",
    "| Cluster | Matches |",
    "| --- | ---: |",
    ...(actionLimitClusterRows.length > 0
      ? actionLimitClusterRows
      : ["| none | 0 |"]),
    "",
    "## Action Limit Subclusters",
    "",
    "| Subcluster | Matches |",
    "| --- | ---: |",
    ...(actionLimitSubclusterRows.length > 0
      ? actionLimitSubclusterRows
      : ["| none | 0 |"]),
    "",
    "## Why Coverage",
    "",
    `- Audit status: ${whyCoverage.auditStatus}`,
    `- Decisions sampled: ${whyCoverage.sampleCount}`,
    `- Decisions requiring WhyNot: ${whyCoverage.decisionsRequiringWhyNot}`,
    `- Decisions not requiring WhyNot: ${whyCoverage.decisionsNotRequiringWhyNot}`,
    `- Decisions with top-level WhyNot: ${whyCoverage.decisionsWithTopLevelWhyNot}`,
    `- Decisions missing top-level WhyNot: ${whyCoverage.decisionsMissingTopLevelWhyNot}`,
    `- Decisions with Runtime WhyNot section: ${whyCoverage.decisionsWithRuntimeWhyNotSection}`,
    `- ActionAlternatives: ${whyCoverage.actionAlternativeCount}`,
    `- Selected ActionAlternatives with WhyChosen: ${whyCoverage.selectedActionAlternativesWithWhyChosen}/${whyCoverage.selectedActionAlternativeCount}`,
    `- Non-selected ActionAlternatives with WhyNot: ${whyCoverage.nonSelectedActionAlternativesWithWhyNot}/${whyCoverage.nonSelectedActionAlternativeCount}`,
    `- ActionAlternatives with WhyChosen: ${whyCoverage.actionAlternativesWithWhyChosen}`,
    `- ActionAlternatives with WhyNot: ${whyCoverage.actionAlternativesWithWhyNot}`,
    `- Missing coverage signals: ${whyCoverage.missingCoverageSignals.length > 0 ? whyCoverage.missingCoverageSignals.join(", ") : "none"}`,
    "",
    "## Top Findings",
    "",
    "| Severity | Seed | State | Side | Action | Detectors | Reason | Facts |",
    "| --- | --- | ---: | --- | --- | --- | --- | --- |",
    ...topFindingRows,
    "",
    "## Interpretation",
    "",
    result.aggregate.findings === 0
      ? "Keine verdächtigen Entscheidungen im geprüften Selfplay-Fenster. Das ist kein Spielstärke-Beweis, sondern nur ein grünes Diagnosefenster."
      : "Die Funde sind Review-Hinweise. Echte Fehler sollten als generische KI-Fix-Klasse formuliert und danach mit denselben Seeds erneut geprüft werden.",
  ].join("\n");
}

export function formatMatchProgressionBenchmarkReport(
  benchmark: AiMatchProgressionBenchmarkResult,
): string {
  const progressionMetrics = [
    "actionLimitRate",
    "averageActions",
    "averageTurns",
    "runnerAgendaPoints",
    "corpAgendaPoints",
    "runnerSteals",
    "corpScores",
    "scoreActionsAvailable",
    "scoreActionsTaken",
    "missedScoreWindows",
    "scoreActionTakeRate",
    "scoreOrStealActions",
    "scoreOrStealActionsPerMatch",
    "actionLedToProgressWithin3",
    "planIntentConverted",
    "planIntentAbandoned",
    "samePlanRepeatedWithoutProgress",
    "longestNoProgressChain",
    "strategicLongestNoProgressChain",
    "microActionNoProgressContribution",
    "planContinuationRate",
    "planIntentConvertedWithin3OwnDecisions",
    "planIntentAbandonedWithoutReason",
    "sameStrategicPlanRepeatedWithoutProgress",
    "actionLimitRootCauseByMatch",
    "actionLimitDominantSideRunner",
    "actionLimitDominantSideCorp",
    "actionLimitDominantSideBoth",
    "finalStrategicWindowNoProgressActions",
    "finalStrategicWindowRunnerNoProgressActions",
    "finalStrategicWindowCorpNoProgressActions",
    "finalWindowRunnerMeaningfulRunOpportunities",
    "finalWindowRunnerMeaningfulRunsTaken",
    "finalWindowCorpScorePathOpportunities",
    "finalWindowCorpScorePathTaken",
    "finalWindowKnownInfoExploitationOpportunities",
    "finalWindowKnownInfoExploitationTaken",
    "endgameCloseoutOpportunitiesRunner",
    "endgameCloseoutOpportunitiesRunnerRaw",
    "endgameCloseoutOpportunitiesRunnerDeduped",
    "endgameCloseoutOpportunitiesRunnerTrue",
    "endgameCloseoutOpportunitiesRunnerFalsePositive",
    "runnerCloseoutAttempted",
    "runnerMissingBreakerCoverageByType",
    "runnerSearchCardAvailableForMissingBreaker",
    "runnerSearchCardUsedForMissingBreaker",
    "runnerSearchCardAvailableButUnused",
    "runnerTutorConvertedToUsefulRun",
    "runnerBreakerInstallConvertedToUsefulRun",
    "runnerSetupBreakerSearchStalled",
    "runnerSetupEconomyStalled",
    "runnerSetupContinuedAfterCoverageReady",
    "runnerPressureReadyTrue",
    "runnerPressureReadyFalsePositive",
    "runnerPressureTakenAfterCoverageReady",
    "runnerPressureSkippedAfterCoverageReady",
    "runnerCoverageImprovedThenPressureWithin3",
    "runnerSearchTutorThenPressureWithin3",
    "runnerEconomyReserveReachedThenPressureWithin2",
    "runnerSetupLoopAfterPressureReady",
    "runnerPhaseExitToPressure",
    "endgameCloseoutAttemptsRunner",
    "endgameCloseoutOpportunitiesCorp",
    "endgameCloseoutAttemptsCorp",
    "endgameScoreOrStealPressureActions",
    "endgameSetupOrEconomyActions",
    "endgameProtectionActions",
    "endgameLowValueRepeatActions",
    "actionsUntilNextScoreOrSteal",
    "actionsUntilNextMeaningfulBoardProgress",
    "advancedAgendaSteals",
    "advancedAgendaStealsFromRemote",
    "advancedAgendaStealsFromCentral",
    "finalAdvanceActions",
    "unsafeFinalAdvanceActions",
    "protectedFinalAdvanceActions",
    "protectBeforeAdvanceActions",
    "corpRemoteHasIceButRunnerPathCheap",
    "corpAgendaInstalledInCheaplyContestableRemote",
    "corpAdvanceInCheaplyContestableRemote",
    "corpRemoteProtectionOverestimatedByIcePresence",
    "corpProtectionChosenBeforeUnsafeAgendaInstall",
    "corpScoreLineContinuedWhenRemoteEffectivelyProtected",
    "corpUnsafeScoringRemoteDetected",
    "corpUnsafeScoringRemoteAlternativeChosen",
    "corpUnsafeScoringRemoteStalled",
    "corpProtectionConvertedToScoreWithin3",
    "corpProtectionRepeatedWithoutScoreConversion",
    "corpProtectionImprovedRemoteSafety",
    "corpProtectionNoSafetyDelta",
    "corpProtectionOpenedScorePath",
    "corpProtectionFollowedByAgendaInstall",
    "corpProtectionFollowedByAdvance",
    "corpProtectionFollowedByScore",
    "corpProtectionLoopAfterRemoteSafe",
    "corpRemoteSafeButNoScoreActionTaken",
    "corpRemoteSafeButAgendaHeld",
    "corpScorePathChosenAfterProtection",
    "corpBestRemoteSelectedForAgenda",
    "corpScorePathAvailableButNotTaken",
    "corpScoreWindowCompressionOpportunity",
    "corpScoreWindowCompressionTaken",
    "corpScoreWindowCompressionRate",
    "corpNonEssentialActionBeforeScoreWindow",
    "corpProtectionBeforeScoreWindowNoSafetyDelta",
    "corpCentralProtectionBeforeScoreWindow",
    "corpAdvanceBurstOpportunity",
    "corpAdvanceBurstTaken",
    "corpSameTurnScoreOpportunity",
    "corpSameTurnScoreTaken",
    "corpRunnerStealAfterDelayedScoreWindow",
    "scoredAgendaActionOpportunities",
    "scoredAgendaActionTaken",
    "scoredAgendaActionTakeRate",
    "politicalOverthrowSkippedForBasicCredit",
    "basicCreditTakenWhileBetterAgendaEconomyAvailable",
    "corpNewRemoteCreated",
    "corpNewRemoteCreatedWithoutPayloadPlan",
    "corpRemoteConversionRate",
    "corpRemoteIceConsolidationOpportunity",
    "corpRemoteIceConsolidationTaken",
    "corpFutureRunIceInstallOpportunities",
    "corpFutureRunIceInstalled",
    "corpFutureRunIceInstalledAsDeadEffect",
    "corpFutureRunIceInstalledAsLiveEffect",
    "corpMultiIceInstallOrderOptimized",
    "corpBallAndChainInstalledWithoutLaterIce",
    "corpRemotePortfolioOverExpanded",
    "corpHqAgendaDensity",
    "corpHqAgendaFloodRisk",
    "runnerHqAccessThreat",
    "corpDrawChosenToDiluteAgendaFlood",
    "corpDrawSkippedBecauseAgendaFloodRisk",
    "advanceThenScoreSameTurn",
    "advanceThenRunnerStealBeforeNextCorpScore",
    "remoteProtectionScoreAtFinalAdvance",
    "runnerContestRiskAtFinalAdvance",
    "centralPressureRuns",
    "hqPressureRuns",
    "rdPressureRuns",
    "archivesPressureRuns",
    "remotePressureRuns",
    "successfulCentralRuns",
    "centralAgendaSteals",
    "centralStealsPerRun",
    "centralRunsWithMultiaccess",
    "hqRunsWithHqInterface",
    "rndRunsWithRndInterface",
    "repeatedLowValueCentralRuns",
    "centralRunStreakWithoutValue",
    "trueCentralCloseoutOpportunities",
    "centralCloseoutOpportunitiesRaw",
    "centralCloseoutOpportunitiesDeduped",
    "centralCloseoutOpportunities",
    "centralCloseoutRunsTaken",
    "centralCloseoutSuccesses",
    "centralCloseoutFalsePositiveRate",
    "repeatedCentralRunsWithFreshValue",
    "centralRunInsteadUnjustified",
    "centralRunStalePenaltyApplied",
    "successfulRemoteRuns",
    "remoteTrashActions",
    "expensiveRemoteTrashTaken",
    "highImpactRemoteTrashDeferredByBudget",
    "highImpactRemoteTrashSkippedNoThreat",
    "remoteTrashDroppedBelowReserve",
    "remoteTrashWithoutImmediateThreat",
    "trashDecisionLeftRunnerUnableToContest",
    "remoteContestActions",
    "pressureTargetSwitches",
    "distinctPressureTargets",
    "remoteInstalls",
    "remoteRootInstalls",
    "remoteIceInstalls",
    "remoteAdvances",
    "advancedAgendaInstalledInRemote",
    "advancementActionsOnAgendas",
    "advancementActionsOnAssets",
    "advancementActionsOnUpgrades",
    "advancementActionsOnUnknown",
    "remoteBuildActions",
    "remoteAdvanceActions",
    "scoreWindowActions",
    "scoringRemoteDevelopmentActions",
    "rezIceDuringRun",
    "scoreWindows",
    "turnsToFirstCorpScore",
    "turnsToFirstAgendaSteal",
    "turnsFromFirstAdvanceToScore",
    "turnsFromFinalAdvanceToScoreOrSteal",
    "runnerDrawActions",
    "runnerDrawActionShare",
    "clickDrawActions",
    "cardEffectDrawActions",
    "drawWhileHoldingPlayableEconomy",
    "drawWhileHoldingInstallableBreaker",
    "drawWhileHoldingRunnablePressureCard",
    "drawWhileRemoteTrashAvailable",
    "drawThenDiscardSameTurn",
    "runnerDuplicateInstallActions",
    "runnerLowValueDuplicateInstallActions",
    "runnerJunkyardBbsDuplicateInstalls",
    "runnerEconomyActionsTaken",
    "runnerRigInstallActions",
    "runnerRemoteTrashOpportunities",
    "runnerRemoteTrashTaken",
    "handUseRate",
  ] as const;
  const safetyMetrics = [
    "illegalActions",
    "replayFailures",
    "fallbackRate",
    "timeoutRate",
  ] as const;
  const metricRow = (
    metric:
      | (typeof progressionMetrics)[number]
      | (typeof safetyMetrics)[number],
  ) =>
    `| ${metric} | ${benchmark.baseline[metric]} | ${benchmark.candidate[metric]} | ${benchmark.delta[metric]} |`;
  const profileRows = benchmark.profileComparisons.map(
    ({ profile, metrics }) =>
      [
        profile,
        metrics.actionLimitRate,
        metrics.averageTurns,
        metrics.scoreOrStealActionsPerMatch,
        metrics.remoteInstalls,
        metrics.remoteAdvances,
        metrics.rezIceDuringRun,
        metrics.successfulCentralRuns,
        metrics.successfulRemoteRuns,
        metrics.remoteTrashActions,
        metrics.illegalActions,
        metrics.replayFailures,
      ] as const,
  );
  return [
    "# AI Match Progression Benchmark Report",
    "",
    `Version: ${benchmark.version}`,
    `Baseline: ${benchmark.baselineProfile}`,
    `Candidate: ${benchmark.candidateProfile}`,
    `Seeds: ${benchmark.seeds.length}`,
    `Runner deck: ${benchmark.runnerDeckId}`,
    `Corp deck: ${benchmark.corpDeckId}`,
    `Max actions: ${benchmark.maxActions}`,
    "Gate: diagnostic_only",
    "",
    "## Progression Metrics",
    "",
    "| Metric | Baseline | Candidate | Delta |",
    "| --- | ---: | ---: | ---: |",
    ...progressionMetrics.map(metricRow),
    "",
    "## Profile Comparison",
    "",
    "| Profile | Action Limit Rate | Avg Turns | Score/Steal per Match | Remote Installs | Remote Advances | Run-window Rez | Successful Central Runs | Successful Remote Runs | Remote Trash | Illegal Actions | Replay Failures |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...profileRows.map(
      ([
        profile,
        actionLimitRate,
        averageTurns,
        scoreOrStealActionsPerMatch,
        remoteInstalls,
        remoteAdvances,
        rezIceDuringRun,
        successfulCentralRuns,
        successfulRemoteRuns,
        remoteTrashActions,
        illegalActions,
        replayFailures,
      ]) =>
        `| ${profile} | ${actionLimitRate} | ${averageTurns} | ${scoreOrStealActionsPerMatch} | ${remoteInstalls} | ${remoteAdvances} | ${rezIceDuringRun} | ${successfulCentralRuns} | ${successfulRemoteRuns} | ${remoteTrashActions} | ${illegalActions} | ${replayFailures} |`,
    ),
    "",
    "## Safety Metrics",
    "",
    "| Metric | Baseline | Candidate | Delta |",
    "| --- | ---: | ---: | ---: |",
    ...safetyMetrics.map(metricRow),
    "",
    "## Interpretation",
    "",
    "This benchmark is diagnostic, not a hard release gate. P1 AI tuning should improve progression without increasing illegal actions, replay failures, timeout rate, or fallback rate.",
  ].join("\n");
}

export function formatMatchProgressionBenchmarkSuiteReport(
  suite: AiMatchProgressionBenchmarkSuiteResult,
): string {
  const runnableRows = suite.slots
    .filter((slot) => slot.status === "runnable" && slot.benchmark)
    .flatMap((slot) =>
      slot.benchmark!.profileComparisons.map(({ profile, metrics }) => ({
        slotType: slot.slotType,
        cells: [
          slot.slotId,
          slot.slotType,
          slot.tuningUse,
          slot.runnerArchetype,
          slot.corpArchetype,
          profile,
          slot.runnerDeckRef,
          slot.corpDeckRef,
          ...SUITE_METRIC_COLUMNS.map(([, metric]) => metrics[metric]),
        ],
      })),
    );
  const nonRunnableRows = suite.slots.filter(
    (slot) => slot.status !== "runnable",
  );
  const corpStrategyPanelRows = summarizeCorpStrategyPanelCoverage(suite.slots);
  const strategyPanelGapRows = suite.slots.filter(
    (slot) => slot.slotType === "strategy_panel_gap",
  );
  const missingCorpStrategyTargets = CORP_STRATEGY_PANEL_TARGETS.filter(
    (target) =>
      !suite.slots.some(
        (slot) => slot.status === "runnable" && slot.corpArchetype === target,
      ),
  );
  const remoteRoleRows = suite.slots
    .filter((slot) => slot.status === "runnable" && slot.benchmark)
    .flatMap((slot) =>
      slot.benchmark!.profileComparisons.map(({ profile, metrics }) => [
        slot.slotId,
        slot.tuningUse,
        profile,
        metrics.corpRemoteRoleProfilesSeen,
        metrics.corpRemoteRoleUsedForSafety,
        metrics.corpRemoteRoleUsedForScoringRemote,
        metrics.corpRemoteRoleRaisedSafetyScore,
        metrics.corpRemoteRoleDidNotRaiseSafetyBecauseInactive,
        metrics.corpRemoteRoleDidNotRaiseSafetyBecauseCheapContest,
        metrics.corpRemoteRoleConflictWithLegacy,
        metrics.corpRemoteRolePreventedBaitAsScoringProtection,
        metrics.corpRemoteRolePreventedAssetAsScoringProtection,
        metrics.runnerRemoteRoleProfilesSeen,
        metrics.runnerRemoteRoleUsedForTrashValue,
        metrics.remoteRoleByKind,
        metrics.remoteRoleByServerScope,
      ]),
    );
  const tagPunishOntologyRows = suite.slots
    .filter((slot) => slot.status === "runnable" && slot.benchmark)
    .flatMap((slot) =>
      slot.benchmark!.profileComparisons.map(({ profile, metrics }) => [
        slot.slotId,
        slot.tuningUse,
        profile,
        metrics.corpTagPunishOntologyProfilesSeen,
        metrics.corpTagSourceOntologyUsed,
        metrics.corpTagPunishPayoffOntologyUsed,
        metrics.corpPunishOpportunityConfirmedByOntology,
        metrics.corpPunishSkippedDespiteOntologyOpportunity,
        metrics.corpOntologyPunishOpportunityConverted,
        metrics.corpOntologyPunishOpportunityExpired,
        metrics.corpTagSourceTakenWithOntologyPayoffAvailable,
        metrics.corpTagSourceTakenWithoutOntologyPayoff,
        metrics.corpTagPunishOntologyConflict,
        metrics.corpTagPunishOntologyByKind,
        metrics.corpTagPunishConditionByKind,
      ]),
    );
  const sectionRows = (slotTypes: AiBenchmarkDeckSlotType[]) =>
    runnableRows
      .filter(({ slotType }) => slotTypes.includes(slotType))
      .map(({ cells }) => formatSuiteMetricRow(cells));
  return [
    "# AI Match Progression Benchmark Suite Report",
    "",
    `Version: ${suite.version}`,
    `Baseline: ${suite.baselineProfile}`,
    `Candidate: ${suite.candidateProfile}`,
    `Comparison profiles: ${suite.comparisonProfiles.join(", ")}`,
    `Seeds: ${suite.seeds.length}`,
    "Gate: diagnostic_only",
    "",
    "## Slot Status",
    "",
    "| Slot | Type | Status | Use | Runner Archetype | Corp Archetype | Runner | Corp | Reason |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...suite.slots.map(
      (slot) =>
        `| ${slot.slotId} | ${slot.slotType} | ${slot.status} | ${slot.tuningUse} | ${slot.runnerArchetype} | ${slot.corpArchetype} | ${slot.runnerDeckRef} | ${slot.corpDeckRef} | ${slot.reason ?? "ok"} |`,
    ),
    "",
    "## Strategy Panel Coverage",
    "",
    `Target Corp archetypes: ${CORP_STRATEGY_PANEL_TARGETS.join(", ")}`,
    `Missing runnable Corp archetypes: ${missingCorpStrategyTargets.join(", ") || "none"}`,
    "",
    "| Corp Archetype | Runnable Slots | Holdout Slots | Slots |",
    "| --- | ---: | ---: | --- |",
    ...corpStrategyPanelRows.map(
      ([archetype, runnable, holdout, slots]) =>
        `| ${archetype} | ${runnable} | ${holdout} | ${slots} |`,
    ),
    "",
    "## Strategy Panel Gaps",
    "",
    "Pending slots are explicit placeholders for Corp archetypes that need stable benchmark decks before they can be used as evidence.",
    "",
    "| Slot | Corp Archetype | Status | Reason |",
    "| --- | --- | --- | --- |",
    ...(strategyPanelGapRows.length > 0
      ? strategyPanelGapRows.map(
          (slot) =>
            `| ${slot.slotId} | ${slot.corpArchetype} | ${slot.status} | ${slot.reason ?? "pending"} |`,
        )
      : ["| none | none | runnable | none |"]),
    "",
    "## Demo Smoke",
    "",
    "Demo-Smoke-Decks bleiben Safety-/Regression-Material und sind keine Spielstaerke-Basis.",
    "",
    suiteMetricHeader(),
    ...sectionRows(["smoke"]),
    "",
    "## Snapshot Progression",
    "",
    "Snapshot-Decks sind die interne Progression-Messung fuer Tuning- und Holdout-Signale.",
    "",
    suiteMetricHeader(),
    ...sectionRows(["snapshot_tuning", "snapshot_holdout"]),
    "",
    "## Local Realistic Holdout",
    "",
    "Lokale Deck-Editor-Decks sind Holdout-/Reality-Check-Slots und werden nicht als Tuningbasis behandelt.",
    "",
    suiteMetricHeader(),
    ...sectionRows(["local_realistic_holdout"]),
    "",
    "## Real Scene Holdout",
    "",
    "Echte Szenedecks sind externe Reality-Check-Slots und bleiben von der Progression-Tuningbasis getrennt.",
    "",
    "| Slot | Status | Runner Archetype | Corp Archetype | Runner | Corp | Reason |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...nonRunnableRows
      .filter((slot) => slot.slotType === "real_scene_holdout")
      .map(
        (slot) =>
          `| ${slot.slotId} | ${slot.status} | ${slot.runnerArchetype} | ${slot.corpArchetype} | ${slot.runnerDeckRef} | ${slot.corpDeckRef} | ${slot.reason ?? "pending"} |`,
      ),
    "",
    "## RemoteRole Ontology Metrics",
    "",
    "| Slot | Use | Profile | Corp Profiles Seen | Corp Safety Used | Corp Scoring Used | Raised Safety | Inactive | Cheap Contest Blocked | Legacy Conflict | Bait Not Protection | Asset Not Protection | Runner Profiles Seen | Runner Trash Value | Kinds | Scopes |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...remoteRoleRows.map(
      ([
        slotId,
        tuningUse,
        profile,
        corpProfilesSeen,
        corpSafetyUsed,
        corpScoringUsed,
        raisedSafety,
        inactive,
        cheapContestBlocked,
        legacyConflict,
        baitNotProtection,
        assetNotProtection,
        runnerProfilesSeen,
        runnerTrashValue,
        kinds,
        scopes,
      ]) =>
        `| ${slotId} | ${tuningUse} | ${profile} | ${corpProfilesSeen} | ${corpSafetyUsed} | ${corpScoringUsed} | ${raisedSafety} | ${inactive} | ${cheapContestBlocked} | ${legacyConflict} | ${baitNotProtection} | ${assetNotProtection} | ${runnerProfilesSeen} | ${runnerTrashValue} | ${kinds} | ${scopes} |`,
    ),
    "",
    "## Tag/Punish Ontology Metrics",
    "",
    "| Slot | Use | Profile | Profiles Seen | Tag Source Used | Payoff Used | Confirmed Punish Opp | Skipped Confirmed Opp | Converted | Expired | Tag Source With Payoff | Tag Source Without Payoff | Conflict | Kinds | Conditions |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...tagPunishOntologyRows.map(
      ([
        slotId,
        tuningUse,
        profile,
        profilesSeen,
        tagSourceUsed,
        payoffUsed,
        confirmedOpp,
        skippedConfirmed,
        converted,
        expired,
        sourceWithPayoff,
        sourceWithoutPayoff,
        conflict,
        kinds,
        conditions,
      ]) =>
        `| ${slotId} | ${tuningUse} | ${profile} | ${profilesSeen} | ${tagSourceUsed} | ${payoffUsed} | ${confirmedOpp} | ${skippedConfirmed} | ${converted} | ${expired} | ${sourceWithPayoff} | ${sourceWithoutPayoff} | ${conflict} | ${kinds} | ${conditions} |`,
    ),
    "",
    "## Metric Notes",
    "",
    "`scoreActionsAvailable` zaehlt Corp-Entscheidungsfenster mit mindestens einer legalen Score-Action. `missedScoreWindows` zaehlt diese Fenster, wenn die Corp nicht scored. `finalAdvanceActions` zaehlt Remote-Agenda-Advances, die eine Agenda auf 0 oder 1 verbleibende Advances bringen. `unsafeFinalAdvanceActions` markiert diese Fenster bei hoher sichtbarer Runner-Contest-Gefahr oder schwachem Schutz. `protectBeforeAdvanceActions` zaehlt Remote-Schutzaktionen vor einer near-final Agenda. `relevantRemoteTrashTakeRate` misst genommene relevante und bezahlbare Remote-Trash-Gelegenheiten. `skippedAdvancedRemoteContest` zaehlt Runner-Fenster mit legaler Advanced-Remote-Run-Gelegenheit, in denen kein solcher Remote-Run gewaehlt wurde. Die `uniqueAdvancedRemoteThreats`-/`contestableAdvancedRemoteThreats`-Metriken deduplizieren diese Bedrohungen pro Match, Turn und Server und trennen echte Contest-Targets von Reserve-/Coverage-Blockern. `runnerDrawActions` zaehlt Click-Draw sowie Draw-/Setup-/Search-Karteneffekte. `drawThenDiscardSameTurn` zaehlt Runner-Draws, denen im selben Runner-Turn ein Discard-Choice folgt. `runnerLowValueDuplicateInstallActions` markiert installierte Zweitkopien mit niedrigem Grenznutzen wie Junkyard BBS. `handUseRate` misst, wie oft der Runner bei sichtbarer Economy-/Breaker-/Pressure-/Remote-Trash-Gelegenheit eine solche Hand-/Board-Aktion statt Draw/Filler nimmt. `runnerEndTurnCreditsBelowReserve`, `runnerRunsStartedBelowReserve` und `runsStartedAgainstKnownUnaffordablePath` messen Cashpool-/Spend-Discipline und bekannte ICE-Pfad-Bezahlbarkeit auf sichtbarer Information. `remoteBuildActions` zaehlt Remote-Installationen plus Run-Fenster-Rez-Aktionen. `remoteAdvanceActions` zaehlt Advances und explizite Advancement-Counter-Zuwaechse auf Remotes.",
  ].join("\n");
}

const SUITE_METADATA_COLUMNS = [
  "Slot",
  "Type",
  "Use",
  "Runner Archetype",
  "Corp Archetype",
  "Profile",
  "Runner",
  "Corp",
];
const SUITE_METRIC_COLUMNS = [
  ["Illegal", "illegalActions"],
  ["Replay Failures", "replayFailures"],
  ["Timeout Rate", "timeoutRate"],
  ["Action Limit Rate", "actionLimitRate"],
  ["Avg Turns", "averageTurns"],
  ["Corp Scores", "corpScores"],
  ["Score Available", "scoreActionsAvailable"],
  ["Score Taken", "scoreActionsTaken"],
  ["Missed Score", "missedScoreWindows"],
  ["Score Take Rate", "scoreActionTakeRate"],
  ["Runner Steals", "runnerSteals"],
  ["Advanced Steals", "advancedAgendaSteals"],
  ["Adv Steal Remote", "advancedAgendaStealsFromRemote"],
  ["Adv Steal Central", "advancedAgendaStealsFromCentral"],
  ["Final Advances", "finalAdvanceActions"],
  ["Unsafe Final", "unsafeFinalAdvanceActions"],
  ["Protected Final", "protectedFinalAdvanceActions"],
  ["Protect Before", "protectBeforeAdvanceActions"],
  ["Score/Steal per Match", "scoreOrStealActionsPerMatch"],
  ["Remote Build", "remoteBuildActions"],
  ["Remote Advances", "remoteAdvanceActions"],
  ["Remote Trash", "remoteTrashActions"],
  ["Successful Remote Access", "successfulRemoteAccesses"],
  ["Remote Access Trashable", "remoteAccessesWithTrashableCards"],
  [
    "Affordable Relevant Trash Opp",
    "affordableRelevantRemoteTrashOpportunities",
  ],
  ["Relevant Trash Taken", "relevantRemoteTrashTaken"],
  ["Relevant Trash Take Rate", "relevantRemoteTrashTakeRate"],
  ["Skipped Relevant Trash", "skippedAffordableRelevantRemoteTrash"],
  ["Remote Runs vs Advanced", "remoteRunsAgainstAdvancedRemote"],
  ["Skipped Advanced Remote", "skippedAdvancedRemoteContest"],
  ["Central While Remote Threat", "centralRunWhileRemoteScoreThreatVisible"],
  ["Runner Draw", "runnerDrawActions"],
  ["Draw Share", "runnerDrawActionShare"],
  ["Draw+Discard", "drawThenDiscardSameTurn"],
  ["Duplicate Installs", "runnerDuplicateInstallActions"],
  ["Low-Value Dup", "runnerLowValueDuplicateInstallActions"],
  ["Junkyard Dup", "runnerJunkyardBbsDuplicateInstalls"],
  ["Economy Taken", "runnerEconomyActionsTaken"],
  ["Rig Installs", "runnerRigInstallActions"],
  ["Remote Trash Opp", "runnerRemoteTrashOpportunities"],
  ["Remote Trash Taken", "runnerRemoteTrashTaken"],
  ["Hand Use Rate", "handUseRate"],
  ["Runner Avg Credits", "runnerAverageCredits"],
  ["Runner End Credits", "runnerEndTurnAverageCredits"],
  ["End Below Reserve", "runnerEndTurnCreditsBelowReserve"],
  ["Turns Below Reserve", "runnerTurnsBelowContestReserve"],
  ["Runs Below Reserve", "runnerRunsStartedBelowReserve"],
  ["Contest Blocked Credits", "runnerContestBlockedByCredits"],
  ["Spend Below Reserve", "runnerSpendBelowReserveActions"],
  ["Known Unaffordable Runs", "runsStartedAgainstKnownUnaffordablePath"],
  ["Avg Missing Path Credits", "creditsMissingForKnownPath"],
  ["Low-Value Unaffordable Runs", "lowValueUnaffordableRuns"],
  ["Unique Advanced Threats", "uniqueAdvancedRemoteThreats"],
  ["Contestable Threats", "contestableAdvancedRemoteThreats"],
  ["Threats Contested", "advancedRemoteThreatsContested"],
  ["Threat Contest Rate", "advancedRemoteThreatContestRate"],
  ["Skipped Contestable Threats", "skippedContestableAdvancedRemoteThreats"],
  [
    "Central Instead Contestable",
    "centralRunInsteadOfContestableAdvancedRemote",
  ],
  ["Central Justified", "centralRunInsteadWasJustified"],
  ["Central Burned Reserve", "centralRunBurnedRemoteContestReserve"],
  ["Remote Contest Credit Block", "remoteContestBlockedByCredits"],
  ["Remote Contest Post-Run Block", "remoteContestBlockedByPostRunReserve"],
  [
    "Remote Runs Insufficient Reserve",
    "remoteRunStartedWithInsufficientPostRunReserve",
  ],
  ["Repeated Central Same Threat", "repeatedCentralRunsWhileSameRemoteThreat"],
  ["Successful Central", "successfulCentralRuns"],
  ["Successful Remote", "successfulRemoteRuns"],
  ["Run-window Rez", "rezIceDuringRun"],
] as const satisfies readonly (readonly [
  string,
  keyof AiMatchProgressionMetrics,
])[];

function suiteMetricHeader(): string {
  const labels = [
    ...SUITE_METADATA_COLUMNS,
    ...SUITE_METRIC_COLUMNS.map(([label]) => label),
  ];
  const alignment = [
    ...SUITE_METADATA_COLUMNS.map(() => "---"),
    ...SUITE_METRIC_COLUMNS.map(() => "---:"),
  ];
  return [formatSuiteMetricRow(labels), formatSuiteMetricRow(alignment)].join(
    "\n",
  );
}

function summarizeCorpStrategyPanelCoverage(
  slots: readonly AiBenchmarkDeckSlotResult[],
): Array<readonly [AiBenchmarkCorpArchetype, number, number, string]> {
  const archetypes = [
    ...new Set([
      ...CORP_STRATEGY_PANEL_TARGETS,
      ...slots.map((slot) => slot.corpArchetype),
    ]),
  ].sort();
  return archetypes.map((archetype) => {
    const matching = slots.filter((slot) => slot.corpArchetype === archetype);
    const runnable = matching.filter(
      (slot) => slot.status === "runnable",
    ).length;
    const holdout = matching.filter(
      (slot) => slot.tuningUse === "holdout_only",
    ).length;
    return [
      archetype,
      runnable,
      holdout,
      matching.map((slot) => slot.slotId).join(", ") || "-",
    ] as const;
  });
}
