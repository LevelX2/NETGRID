import type {
  AiBenchmarkCorpArchetype,
  AiBenchmarkDeckSlotResult,
  AiBenchmarkDeckSlotType,
  AiDoctrineQualityBenchmarkResult,
  AiDoctrineQualityGateResult,
  AiDoctrineQualityGateThresholds,
  AiMatchProgressionBenchmarkResult,
  AiMatchProgressionBenchmarkSuiteResult,
} from "../index";
import type { AiSelfplayTraceMiningResult } from "./selfplay-trace-mining";
import { buildSelfplayActionTypeDominanceReport } from "./selfplay-action-type-dominance";
import { buildSemanticRuntimeWhyCoverageReportFromSimulationSummaries } from "./selfplay-why-coverage";

// Simulation-only report helpers. Live AI decisions must not depend on these
// aggregate benchmark outputs as an action source.

const CORP_STRATEGY_PANEL_TARGETS = [
  "remote_scoring",
  "fast_advance",
  "tag_punish",
  "net_damage",
  "hybrid_score_punish",
  "virus_damage",
] as const satisfies readonly AiBenchmarkCorpArchetype[];

export function evaluateDoctrineQualityGate(
  benchmark: AiDoctrineQualityBenchmarkResult,
  thresholds: Partial<AiDoctrineQualityGateThresholds> = {},
): AiDoctrineQualityGateResult {
  const resolved: AiDoctrineQualityGateThresholds = {
    maxCandidateIllegalActions: thresholds.maxCandidateIllegalActions ?? 0,
    maxCandidateReplayFailures: thresholds.maxCandidateReplayFailures ?? 0,
    maxTimeoutRateDelta: thresholds.maxTimeoutRateDelta ?? 0,
    maxFallbackRateDelta: thresholds.maxFallbackRateDelta ?? 0.02,
    maxNakedAgendaInstallDelta: thresholds.maxNakedAgendaInstallDelta ?? 0,
    maxScoreWindowMissedDelta: thresholds.maxScoreWindowMissedDelta ?? 0,
    maxEconomyStallDelta: thresholds.maxEconomyStallDelta ?? 2,
    maxRepeatedLowValueCentralRunDelta:
      thresholds.maxRepeatedLowValueCentralRunDelta ?? 2,
  };
  const hardFailures = [
    ...(benchmark.candidateRun.illegalActions >
    resolved.maxCandidateIllegalActions
      ? [`candidate_illegal_actions:${benchmark.candidateRun.illegalActions}`]
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
    ["replayFailureDelta", benchmark.safety.replayFailureDelta],
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
            `| ${finding.severity} | ${finding.seed} | ${finding.stateVersion} | ${finding.side} | ${finding.selectedActionType} | ${finding.detectorIds.join(", ")} | ${escapeMarkdownTableCell(finding.shortReason)} | ${escapeMarkdownTableCell(finding.relevantDebugFacts.slice(0, 4).join("; "))} |`,
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
    `| unsafeScoreChosen | ${result.aggregate.unsafeScoreChosen} |`,
    `| passiveActionWithScoreLineAvailable | ${result.aggregate.passiveActionWithScoreLineAvailable} |`,
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
      (row) => `| ${row.side} | ${row.actionType} | ${row.count} | ${row.share} |`,
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
  const progressionRows: Array<[string, number, number, number]> = [
    [
      "actionLimitRate",
      benchmark.baseline.actionLimitRate,
      benchmark.candidate.actionLimitRate,
      benchmark.delta.actionLimitRate,
    ],
    [
      "averageActions",
      benchmark.baseline.averageActions,
      benchmark.candidate.averageActions,
      benchmark.delta.averageActions,
    ],
    [
      "averageTurns",
      benchmark.baseline.averageTurns,
      benchmark.candidate.averageTurns,
      benchmark.delta.averageTurns,
    ],
    [
      "runnerAgendaPoints",
      benchmark.baseline.runnerAgendaPoints,
      benchmark.candidate.runnerAgendaPoints,
      benchmark.delta.runnerAgendaPoints,
    ],
    [
      "corpAgendaPoints",
      benchmark.baseline.corpAgendaPoints,
      benchmark.candidate.corpAgendaPoints,
      benchmark.delta.corpAgendaPoints,
    ],
    [
      "runnerSteals",
      benchmark.baseline.runnerSteals,
      benchmark.candidate.runnerSteals,
      benchmark.delta.runnerSteals,
    ],
    [
      "corpScores",
      benchmark.baseline.corpScores,
      benchmark.candidate.corpScores,
      benchmark.delta.corpScores,
    ],
    [
      "scoreActionsAvailable",
      benchmark.baseline.scoreActionsAvailable,
      benchmark.candidate.scoreActionsAvailable,
      benchmark.delta.scoreActionsAvailable,
    ],
    [
      "scoreActionsTaken",
      benchmark.baseline.scoreActionsTaken,
      benchmark.candidate.scoreActionsTaken,
      benchmark.delta.scoreActionsTaken,
    ],
    [
      "missedScoreWindows",
      benchmark.baseline.missedScoreWindows,
      benchmark.candidate.missedScoreWindows,
      benchmark.delta.missedScoreWindows,
    ],
    [
      "scoreActionTakeRate",
      benchmark.baseline.scoreActionTakeRate,
      benchmark.candidate.scoreActionTakeRate,
      benchmark.delta.scoreActionTakeRate,
    ],
    [
      "scoreOrStealActions",
      benchmark.baseline.scoreOrStealActions,
      benchmark.candidate.scoreOrStealActions,
      benchmark.delta.scoreOrStealActions,
    ],
    [
      "scoreOrStealActionsPerMatch",
      benchmark.baseline.scoreOrStealActionsPerMatch,
      benchmark.candidate.scoreOrStealActionsPerMatch,
      benchmark.delta.scoreOrStealActionsPerMatch,
    ],
    [
      "actionLedToProgressWithin3",
      benchmark.baseline.actionLedToProgressWithin3,
      benchmark.candidate.actionLedToProgressWithin3,
      benchmark.delta.actionLedToProgressWithin3,
    ],
    [
      "planIntentConverted",
      benchmark.baseline.planIntentConverted,
      benchmark.candidate.planIntentConverted,
      benchmark.delta.planIntentConverted,
    ],
    [
      "planIntentAbandoned",
      benchmark.baseline.planIntentAbandoned,
      benchmark.candidate.planIntentAbandoned,
      benchmark.delta.planIntentAbandoned,
    ],
    [
      "samePlanRepeatedWithoutProgress",
      benchmark.baseline.samePlanRepeatedWithoutProgress,
      benchmark.candidate.samePlanRepeatedWithoutProgress,
      benchmark.delta.samePlanRepeatedWithoutProgress,
    ],
    [
      "longestNoProgressChain",
      benchmark.baseline.longestNoProgressChain,
      benchmark.candidate.longestNoProgressChain,
      benchmark.delta.longestNoProgressChain,
    ],
    [
      "strategicLongestNoProgressChain",
      benchmark.baseline.strategicLongestNoProgressChain,
      benchmark.candidate.strategicLongestNoProgressChain,
      benchmark.delta.strategicLongestNoProgressChain,
    ],
    [
      "microActionNoProgressContribution",
      benchmark.baseline.microActionNoProgressContribution,
      benchmark.candidate.microActionNoProgressContribution,
      benchmark.delta.microActionNoProgressContribution,
    ],
    [
      "planContinuationRate",
      benchmark.baseline.planContinuationRate,
      benchmark.candidate.planContinuationRate,
      benchmark.delta.planContinuationRate,
    ],
    [
      "planIntentConvertedWithin3OwnDecisions",
      benchmark.baseline.planIntentConvertedWithin3OwnDecisions,
      benchmark.candidate.planIntentConvertedWithin3OwnDecisions,
      benchmark.delta.planIntentConvertedWithin3OwnDecisions,
    ],
    [
      "planIntentAbandonedWithoutReason",
      benchmark.baseline.planIntentAbandonedWithoutReason,
      benchmark.candidate.planIntentAbandonedWithoutReason,
      benchmark.delta.planIntentAbandonedWithoutReason,
    ],
    [
      "sameStrategicPlanRepeatedWithoutProgress",
      benchmark.baseline.sameStrategicPlanRepeatedWithoutProgress,
      benchmark.candidate.sameStrategicPlanRepeatedWithoutProgress,
      benchmark.delta.sameStrategicPlanRepeatedWithoutProgress,
    ],
    [
      "strategicLineSelected",
      benchmark.baseline.strategicLineSelected,
      benchmark.candidate.strategicLineSelected,
      benchmark.delta.strategicLineSelected,
    ],
    [
      "strategicLineSelectedBySideRunner",
      benchmark.baseline.strategicLineSelectedBySideRunner,
      benchmark.candidate.strategicLineSelectedBySideRunner,
      benchmark.delta.strategicLineSelectedBySideRunner,
    ],
    [
      "strategicLineSelectedBySideCorp",
      benchmark.baseline.strategicLineSelectedBySideCorp,
      benchmark.candidate.strategicLineSelectedBySideCorp,
      benchmark.delta.strategicLineSelectedBySideCorp,
    ],
    [
      "strategicLineSelectedBySeed",
      benchmark.baseline.strategicLineSelectedBySeed,
      benchmark.candidate.strategicLineSelectedBySeed,
      benchmark.delta.strategicLineSelectedBySeed,
    ],
    [
      "strategicLineVarianceAcrossSeeds",
      benchmark.baseline.strategicLineVarianceAcrossSeeds,
      benchmark.candidate.strategicLineVarianceAcrossSeeds,
      benchmark.delta.strategicLineVarianceAcrossSeeds,
    ],
    [
      "strategicLineConvertedToProgress",
      benchmark.baseline.strategicLineConvertedToProgress,
      benchmark.candidate.strategicLineConvertedToProgress,
      benchmark.delta.strategicLineConvertedToProgress,
    ],
    [
      "strategicLineRepeatedWithoutProgress",
      benchmark.baseline.strategicLineRepeatedWithoutProgress,
      benchmark.candidate.strategicLineRepeatedWithoutProgress,
      benchmark.delta.strategicLineRepeatedWithoutProgress,
    ],
    [
      "lineCommitmentLedToScore",
      benchmark.baseline.lineCommitmentLedToScore,
      benchmark.candidate.lineCommitmentLedToScore,
      benchmark.delta.lineCommitmentLedToScore,
    ],
    [
      "lineCommitmentLedToSteal",
      benchmark.baseline.lineCommitmentLedToSteal,
      benchmark.candidate.lineCommitmentLedToSteal,
      benchmark.delta.lineCommitmentLedToSteal,
    ],
    [
      "actionLimitRootCauseByMatch",
      benchmark.baseline.actionLimitRootCauseByMatch,
      benchmark.candidate.actionLimitRootCauseByMatch,
      benchmark.delta.actionLimitRootCauseByMatch,
    ],
    [
      "actionLimitDominantSideRunner",
      benchmark.baseline.actionLimitDominantSideRunner,
      benchmark.candidate.actionLimitDominantSideRunner,
      benchmark.delta.actionLimitDominantSideRunner,
    ],
    [
      "actionLimitDominantSideCorp",
      benchmark.baseline.actionLimitDominantSideCorp,
      benchmark.candidate.actionLimitDominantSideCorp,
      benchmark.delta.actionLimitDominantSideCorp,
    ],
    [
      "actionLimitDominantSideBoth",
      benchmark.baseline.actionLimitDominantSideBoth,
      benchmark.candidate.actionLimitDominantSideBoth,
      benchmark.delta.actionLimitDominantSideBoth,
    ],
    [
      "finalStrategicWindowNoProgressActions",
      benchmark.baseline.finalStrategicWindowNoProgressActions,
      benchmark.candidate.finalStrategicWindowNoProgressActions,
      benchmark.delta.finalStrategicWindowNoProgressActions,
    ],
    [
      "finalStrategicWindowRunnerNoProgressActions",
      benchmark.baseline.finalStrategicWindowRunnerNoProgressActions,
      benchmark.candidate.finalStrategicWindowRunnerNoProgressActions,
      benchmark.delta.finalStrategicWindowRunnerNoProgressActions,
    ],
    [
      "finalStrategicWindowCorpNoProgressActions",
      benchmark.baseline.finalStrategicWindowCorpNoProgressActions,
      benchmark.candidate.finalStrategicWindowCorpNoProgressActions,
      benchmark.delta.finalStrategicWindowCorpNoProgressActions,
    ],
    [
      "finalWindowRunnerMeaningfulRunOpportunities",
      benchmark.baseline.finalWindowRunnerMeaningfulRunOpportunities,
      benchmark.candidate.finalWindowRunnerMeaningfulRunOpportunities,
      benchmark.delta.finalWindowRunnerMeaningfulRunOpportunities,
    ],
    [
      "finalWindowRunnerMeaningfulRunsTaken",
      benchmark.baseline.finalWindowRunnerMeaningfulRunsTaken,
      benchmark.candidate.finalWindowRunnerMeaningfulRunsTaken,
      benchmark.delta.finalWindowRunnerMeaningfulRunsTaken,
    ],
    [
      "finalWindowCorpScorePathOpportunities",
      benchmark.baseline.finalWindowCorpScorePathOpportunities,
      benchmark.candidate.finalWindowCorpScorePathOpportunities,
      benchmark.delta.finalWindowCorpScorePathOpportunities,
    ],
    [
      "finalWindowCorpScorePathTaken",
      benchmark.baseline.finalWindowCorpScorePathTaken,
      benchmark.candidate.finalWindowCorpScorePathTaken,
      benchmark.delta.finalWindowCorpScorePathTaken,
    ],
    [
      "finalWindowKnownInfoExploitationOpportunities",
      benchmark.baseline.finalWindowKnownInfoExploitationOpportunities,
      benchmark.candidate.finalWindowKnownInfoExploitationOpportunities,
      benchmark.delta.finalWindowKnownInfoExploitationOpportunities,
    ],
    [
      "finalWindowKnownInfoExploitationTaken",
      benchmark.baseline.finalWindowKnownInfoExploitationTaken,
      benchmark.candidate.finalWindowKnownInfoExploitationTaken,
      benchmark.delta.finalWindowKnownInfoExploitationTaken,
    ],
    [
      "endgameCloseoutOpportunitiesRunner",
      benchmark.baseline.endgameCloseoutOpportunitiesRunner,
      benchmark.candidate.endgameCloseoutOpportunitiesRunner,
      benchmark.delta.endgameCloseoutOpportunitiesRunner,
    ],
    [
      "endgameCloseoutOpportunitiesRunnerRaw",
      benchmark.baseline.endgameCloseoutOpportunitiesRunnerRaw,
      benchmark.candidate.endgameCloseoutOpportunitiesRunnerRaw,
      benchmark.delta.endgameCloseoutOpportunitiesRunnerRaw,
    ],
    [
      "endgameCloseoutOpportunitiesRunnerDeduped",
      benchmark.baseline.endgameCloseoutOpportunitiesRunnerDeduped,
      benchmark.candidate.endgameCloseoutOpportunitiesRunnerDeduped,
      benchmark.delta.endgameCloseoutOpportunitiesRunnerDeduped,
    ],
    [
      "endgameCloseoutOpportunitiesRunnerTrue",
      benchmark.baseline.endgameCloseoutOpportunitiesRunnerTrue,
      benchmark.candidate.endgameCloseoutOpportunitiesRunnerTrue,
      benchmark.delta.endgameCloseoutOpportunitiesRunnerTrue,
    ],
    [
      "endgameCloseoutOpportunitiesRunnerFalsePositive",
      benchmark.baseline.endgameCloseoutOpportunitiesRunnerFalsePositive,
      benchmark.candidate.endgameCloseoutOpportunitiesRunnerFalsePositive,
      benchmark.delta.endgameCloseoutOpportunitiesRunnerFalsePositive,
    ],
    [
      "runnerCloseoutAttempted",
      benchmark.baseline.runnerCloseoutAttempted,
      benchmark.candidate.runnerCloseoutAttempted,
      benchmark.delta.runnerCloseoutAttempted,
    ],
    [
      "runnerMissingBreakerCoverageByType",
      benchmark.baseline.runnerMissingBreakerCoverageByType,
      benchmark.candidate.runnerMissingBreakerCoverageByType,
      benchmark.delta.runnerMissingBreakerCoverageByType,
    ],
    [
      "runnerSearchCardAvailableForMissingBreaker",
      benchmark.baseline.runnerSearchCardAvailableForMissingBreaker,
      benchmark.candidate.runnerSearchCardAvailableForMissingBreaker,
      benchmark.delta.runnerSearchCardAvailableForMissingBreaker,
    ],
    [
      "runnerSearchCardUsedForMissingBreaker",
      benchmark.baseline.runnerSearchCardUsedForMissingBreaker,
      benchmark.candidate.runnerSearchCardUsedForMissingBreaker,
      benchmark.delta.runnerSearchCardUsedForMissingBreaker,
    ],
    [
      "runnerSearchCardAvailableButUnused",
      benchmark.baseline.runnerSearchCardAvailableButUnused,
      benchmark.candidate.runnerSearchCardAvailableButUnused,
      benchmark.delta.runnerSearchCardAvailableButUnused,
    ],
    [
      "runnerTutorConvertedToUsefulRun",
      benchmark.baseline.runnerTutorConvertedToUsefulRun,
      benchmark.candidate.runnerTutorConvertedToUsefulRun,
      benchmark.delta.runnerTutorConvertedToUsefulRun,
    ],
    [
      "runnerBreakerInstallConvertedToUsefulRun",
      benchmark.baseline.runnerBreakerInstallConvertedToUsefulRun,
      benchmark.candidate.runnerBreakerInstallConvertedToUsefulRun,
      benchmark.delta.runnerBreakerInstallConvertedToUsefulRun,
    ],
    [
      "runnerSetupBreakerSearchStalled",
      benchmark.baseline.runnerSetupBreakerSearchStalled,
      benchmark.candidate.runnerSetupBreakerSearchStalled,
      benchmark.delta.runnerSetupBreakerSearchStalled,
    ],
    [
      "runnerSetupEconomyStalled",
      benchmark.baseline.runnerSetupEconomyStalled,
      benchmark.candidate.runnerSetupEconomyStalled,
      benchmark.delta.runnerSetupEconomyStalled,
    ],
    [
      "runnerSetupContinuedAfterCoverageReady",
      benchmark.baseline.runnerSetupContinuedAfterCoverageReady,
      benchmark.candidate.runnerSetupContinuedAfterCoverageReady,
      benchmark.delta.runnerSetupContinuedAfterCoverageReady,
    ],
    [
      "runnerPressureReadyTrue",
      benchmark.baseline.runnerPressureReadyTrue,
      benchmark.candidate.runnerPressureReadyTrue,
      benchmark.delta.runnerPressureReadyTrue,
    ],
    [
      "runnerPressureReadyFalsePositive",
      benchmark.baseline.runnerPressureReadyFalsePositive,
      benchmark.candidate.runnerPressureReadyFalsePositive,
      benchmark.delta.runnerPressureReadyFalsePositive,
    ],
    [
      "runnerPressureTakenAfterCoverageReady",
      benchmark.baseline.runnerPressureTakenAfterCoverageReady,
      benchmark.candidate.runnerPressureTakenAfterCoverageReady,
      benchmark.delta.runnerPressureTakenAfterCoverageReady,
    ],
    [
      "runnerPressureSkippedAfterCoverageReady",
      benchmark.baseline.runnerPressureSkippedAfterCoverageReady,
      benchmark.candidate.runnerPressureSkippedAfterCoverageReady,
      benchmark.delta.runnerPressureSkippedAfterCoverageReady,
    ],
    [
      "runnerCoverageImprovedThenPressureWithin3",
      benchmark.baseline.runnerCoverageImprovedThenPressureWithin3,
      benchmark.candidate.runnerCoverageImprovedThenPressureWithin3,
      benchmark.delta.runnerCoverageImprovedThenPressureWithin3,
    ],
    [
      "runnerSearchTutorThenPressureWithin3",
      benchmark.baseline.runnerSearchTutorThenPressureWithin3,
      benchmark.candidate.runnerSearchTutorThenPressureWithin3,
      benchmark.delta.runnerSearchTutorThenPressureWithin3,
    ],
    [
      "runnerEconomyReserveReachedThenPressureWithin2",
      benchmark.baseline.runnerEconomyReserveReachedThenPressureWithin2,
      benchmark.candidate.runnerEconomyReserveReachedThenPressureWithin2,
      benchmark.delta.runnerEconomyReserveReachedThenPressureWithin2,
    ],
    [
      "runnerSetupLoopAfterPressureReady",
      benchmark.baseline.runnerSetupLoopAfterPressureReady,
      benchmark.candidate.runnerSetupLoopAfterPressureReady,
      benchmark.delta.runnerSetupLoopAfterPressureReady,
    ],
    [
      "runnerPhaseExitToPressure",
      benchmark.baseline.runnerPhaseExitToPressure,
      benchmark.candidate.runnerPhaseExitToPressure,
      benchmark.delta.runnerPhaseExitToPressure,
    ],
    [
      "endgameCloseoutAttemptsRunner",
      benchmark.baseline.endgameCloseoutAttemptsRunner,
      benchmark.candidate.endgameCloseoutAttemptsRunner,
      benchmark.delta.endgameCloseoutAttemptsRunner,
    ],
    [
      "endgameCloseoutOpportunitiesCorp",
      benchmark.baseline.endgameCloseoutOpportunitiesCorp,
      benchmark.candidate.endgameCloseoutOpportunitiesCorp,
      benchmark.delta.endgameCloseoutOpportunitiesCorp,
    ],
    [
      "endgameCloseoutAttemptsCorp",
      benchmark.baseline.endgameCloseoutAttemptsCorp,
      benchmark.candidate.endgameCloseoutAttemptsCorp,
      benchmark.delta.endgameCloseoutAttemptsCorp,
    ],
    [
      "endgameScoreOrStealPressureActions",
      benchmark.baseline.endgameScoreOrStealPressureActions,
      benchmark.candidate.endgameScoreOrStealPressureActions,
      benchmark.delta.endgameScoreOrStealPressureActions,
    ],
    [
      "endgameSetupOrEconomyActions",
      benchmark.baseline.endgameSetupOrEconomyActions,
      benchmark.candidate.endgameSetupOrEconomyActions,
      benchmark.delta.endgameSetupOrEconomyActions,
    ],
    [
      "endgameProtectionActions",
      benchmark.baseline.endgameProtectionActions,
      benchmark.candidate.endgameProtectionActions,
      benchmark.delta.endgameProtectionActions,
    ],
    [
      "endgameLowValueRepeatActions",
      benchmark.baseline.endgameLowValueRepeatActions,
      benchmark.candidate.endgameLowValueRepeatActions,
      benchmark.delta.endgameLowValueRepeatActions,
    ],
    [
      "outcomeFollowupRate",
      benchmark.baseline.outcomeFollowupRate,
      benchmark.candidate.outcomeFollowupRate,
      benchmark.delta.outcomeFollowupRate,
    ],
    [
      "outcomeFollowupApplied",
      benchmark.baseline.outcomeFollowupApplied,
      benchmark.candidate.outcomeFollowupApplied,
      benchmark.delta.outcomeFollowupApplied,
    ],
    [
      "outcomeFollowupSuppressedByProgressionCost",
      benchmark.baseline.outcomeFollowupSuppressedByProgressionCost,
      benchmark.candidate.outcomeFollowupSuppressedByProgressionCost,
      benchmark.delta.outcomeFollowupSuppressedByProgressionCost,
    ],
    [
      "outcomeFollowupLedToProgressWithin3",
      benchmark.baseline.outcomeFollowupLedToProgressWithin3,
      benchmark.candidate.outcomeFollowupLedToProgressWithin3,
      benchmark.delta.outcomeFollowupLedToProgressWithin3,
    ],
    [
      "outcomeFollowupLedToNoProgressChain",
      benchmark.baseline.outcomeFollowupLedToNoProgressChain,
      benchmark.candidate.outcomeFollowupLedToNoProgressChain,
      benchmark.delta.outcomeFollowupLedToNoProgressChain,
    ],
    [
      "outcomeFollowupPreservedScoreWindow",
      benchmark.baseline.outcomeFollowupPreservedScoreWindow,
      benchmark.candidate.outcomeFollowupPreservedScoreWindow,
      benchmark.delta.outcomeFollowupPreservedScoreWindow,
    ],
    [
      "corpScoreWindowOverriddenByFollowup",
      benchmark.baseline.corpScoreWindowOverriddenByFollowup,
      benchmark.candidate.corpScoreWindowOverriddenByFollowup,
      benchmark.delta.corpScoreWindowOverriddenByFollowup,
    ],
    [
      "scoreNowProtectedFromFollowup",
      benchmark.baseline.scoreNowProtectedFromFollowup,
      benchmark.candidate.scoreNowProtectedFromFollowup,
      benchmark.delta.scoreNowProtectedFromFollowup,
    ],
    [
      "badOutcomeRepeatedWithoutNewInfo",
      benchmark.baseline.badOutcomeRepeatedWithoutNewInfo,
      benchmark.candidate.badOutcomeRepeatedWithoutNewInfo,
      benchmark.delta.badOutcomeRepeatedWithoutNewInfo,
    ],
    [
      "goodOutcomeConverted",
      benchmark.baseline.goodOutcomeConverted,
      benchmark.candidate.goodOutcomeConverted,
      benchmark.delta.goodOutcomeConverted,
    ],
    [
      "actionsUntilNextScoreOrSteal",
      benchmark.baseline.actionsUntilNextScoreOrSteal,
      benchmark.candidate.actionsUntilNextScoreOrSteal,
      benchmark.delta.actionsUntilNextScoreOrSteal,
    ],
    [
      "actionsUntilNextMeaningfulBoardProgress",
      benchmark.baseline.actionsUntilNextMeaningfulBoardProgress,
      benchmark.candidate.actionsUntilNextMeaningfulBoardProgress,
      benchmark.delta.actionsUntilNextMeaningfulBoardProgress,
    ],
    [
      "advancedAgendaSteals",
      benchmark.baseline.advancedAgendaSteals,
      benchmark.candidate.advancedAgendaSteals,
      benchmark.delta.advancedAgendaSteals,
    ],
    [
      "advancedAgendaStealsFromRemote",
      benchmark.baseline.advancedAgendaStealsFromRemote,
      benchmark.candidate.advancedAgendaStealsFromRemote,
      benchmark.delta.advancedAgendaStealsFromRemote,
    ],
    [
      "advancedAgendaStealsFromCentral",
      benchmark.baseline.advancedAgendaStealsFromCentral,
      benchmark.candidate.advancedAgendaStealsFromCentral,
      benchmark.delta.advancedAgendaStealsFromCentral,
    ],
    [
      "finalAdvanceActions",
      benchmark.baseline.finalAdvanceActions,
      benchmark.candidate.finalAdvanceActions,
      benchmark.delta.finalAdvanceActions,
    ],
    [
      "unsafeFinalAdvanceActions",
      benchmark.baseline.unsafeFinalAdvanceActions,
      benchmark.candidate.unsafeFinalAdvanceActions,
      benchmark.delta.unsafeFinalAdvanceActions,
    ],
    [
      "protectedFinalAdvanceActions",
      benchmark.baseline.protectedFinalAdvanceActions,
      benchmark.candidate.protectedFinalAdvanceActions,
      benchmark.delta.protectedFinalAdvanceActions,
    ],
    [
      "protectBeforeAdvanceActions",
      benchmark.baseline.protectBeforeAdvanceActions,
      benchmark.candidate.protectBeforeAdvanceActions,
      benchmark.delta.protectBeforeAdvanceActions,
    ],
    [
      "corpRemoteHasIceButRunnerPathCheap",
      benchmark.baseline.corpRemoteHasIceButRunnerPathCheap,
      benchmark.candidate.corpRemoteHasIceButRunnerPathCheap,
      benchmark.delta.corpRemoteHasIceButRunnerPathCheap,
    ],
    [
      "corpAgendaInstalledInCheaplyContestableRemote",
      benchmark.baseline.corpAgendaInstalledInCheaplyContestableRemote,
      benchmark.candidate.corpAgendaInstalledInCheaplyContestableRemote,
      benchmark.delta.corpAgendaInstalledInCheaplyContestableRemote,
    ],
    [
      "corpAdvanceInCheaplyContestableRemote",
      benchmark.baseline.corpAdvanceInCheaplyContestableRemote,
      benchmark.candidate.corpAdvanceInCheaplyContestableRemote,
      benchmark.delta.corpAdvanceInCheaplyContestableRemote,
    ],
    [
      "corpRemoteProtectionOverestimatedByIcePresence",
      benchmark.baseline.corpRemoteProtectionOverestimatedByIcePresence,
      benchmark.candidate.corpRemoteProtectionOverestimatedByIcePresence,
      benchmark.delta.corpRemoteProtectionOverestimatedByIcePresence,
    ],
    [
      "corpProtectionChosenBeforeUnsafeAgendaInstall",
      benchmark.baseline.corpProtectionChosenBeforeUnsafeAgendaInstall,
      benchmark.candidate.corpProtectionChosenBeforeUnsafeAgendaInstall,
      benchmark.delta.corpProtectionChosenBeforeUnsafeAgendaInstall,
    ],
    [
      "corpScoreLineContinuedWhenRemoteEffectivelyProtected",
      benchmark.baseline.corpScoreLineContinuedWhenRemoteEffectivelyProtected,
      benchmark.candidate.corpScoreLineContinuedWhenRemoteEffectivelyProtected,
      benchmark.delta.corpScoreLineContinuedWhenRemoteEffectivelyProtected,
    ],
    [
      "corpUnsafeScoringRemoteDetected",
      benchmark.baseline.corpUnsafeScoringRemoteDetected,
      benchmark.candidate.corpUnsafeScoringRemoteDetected,
      benchmark.delta.corpUnsafeScoringRemoteDetected,
    ],
    [
      "corpUnsafeScoringRemoteAlternativeChosen",
      benchmark.baseline.corpUnsafeScoringRemoteAlternativeChosen,
      benchmark.candidate.corpUnsafeScoringRemoteAlternativeChosen,
      benchmark.delta.corpUnsafeScoringRemoteAlternativeChosen,
    ],
    [
      "corpUnsafeScoringRemoteStalled",
      benchmark.baseline.corpUnsafeScoringRemoteStalled,
      benchmark.candidate.corpUnsafeScoringRemoteStalled,
      benchmark.delta.corpUnsafeScoringRemoteStalled,
    ],
    [
      "corpProtectionConvertedToScoreWithin3",
      benchmark.baseline.corpProtectionConvertedToScoreWithin3,
      benchmark.candidate.corpProtectionConvertedToScoreWithin3,
      benchmark.delta.corpProtectionConvertedToScoreWithin3,
    ],
    [
      "corpProtectionRepeatedWithoutScoreConversion",
      benchmark.baseline.corpProtectionRepeatedWithoutScoreConversion,
      benchmark.candidate.corpProtectionRepeatedWithoutScoreConversion,
      benchmark.delta.corpProtectionRepeatedWithoutScoreConversion,
    ],
    [
      "corpProtectionImprovedRemoteSafety",
      benchmark.baseline.corpProtectionImprovedRemoteSafety,
      benchmark.candidate.corpProtectionImprovedRemoteSafety,
      benchmark.delta.corpProtectionImprovedRemoteSafety,
    ],
    [
      "corpProtectionNoSafetyDelta",
      benchmark.baseline.corpProtectionNoSafetyDelta,
      benchmark.candidate.corpProtectionNoSafetyDelta,
      benchmark.delta.corpProtectionNoSafetyDelta,
    ],
    [
      "corpProtectionOpenedScorePath",
      benchmark.baseline.corpProtectionOpenedScorePath,
      benchmark.candidate.corpProtectionOpenedScorePath,
      benchmark.delta.corpProtectionOpenedScorePath,
    ],
    [
      "corpProtectionFollowedByAgendaInstall",
      benchmark.baseline.corpProtectionFollowedByAgendaInstall,
      benchmark.candidate.corpProtectionFollowedByAgendaInstall,
      benchmark.delta.corpProtectionFollowedByAgendaInstall,
    ],
    [
      "corpProtectionFollowedByAdvance",
      benchmark.baseline.corpProtectionFollowedByAdvance,
      benchmark.candidate.corpProtectionFollowedByAdvance,
      benchmark.delta.corpProtectionFollowedByAdvance,
    ],
    [
      "corpProtectionFollowedByScore",
      benchmark.baseline.corpProtectionFollowedByScore,
      benchmark.candidate.corpProtectionFollowedByScore,
      benchmark.delta.corpProtectionFollowedByScore,
    ],
    [
      "corpProtectionLoopAfterRemoteSafe",
      benchmark.baseline.corpProtectionLoopAfterRemoteSafe,
      benchmark.candidate.corpProtectionLoopAfterRemoteSafe,
      benchmark.delta.corpProtectionLoopAfterRemoteSafe,
    ],
    [
      "corpRemoteSafeButNoScoreActionTaken",
      benchmark.baseline.corpRemoteSafeButNoScoreActionTaken,
      benchmark.candidate.corpRemoteSafeButNoScoreActionTaken,
      benchmark.delta.corpRemoteSafeButNoScoreActionTaken,
    ],
    [
      "corpRemoteSafeButAgendaHeld",
      benchmark.baseline.corpRemoteSafeButAgendaHeld,
      benchmark.candidate.corpRemoteSafeButAgendaHeld,
      benchmark.delta.corpRemoteSafeButAgendaHeld,
    ],
    [
      "corpScorePathChosenAfterProtection",
      benchmark.baseline.corpScorePathChosenAfterProtection,
      benchmark.candidate.corpScorePathChosenAfterProtection,
      benchmark.delta.corpScorePathChosenAfterProtection,
    ],
    [
      "corpBestRemoteSelectedForAgenda",
      benchmark.baseline.corpBestRemoteSelectedForAgenda,
      benchmark.candidate.corpBestRemoteSelectedForAgenda,
      benchmark.delta.corpBestRemoteSelectedForAgenda,
    ],
    [
      "corpScorePathAvailableButNotTaken",
      benchmark.baseline.corpScorePathAvailableButNotTaken,
      benchmark.candidate.corpScorePathAvailableButNotTaken,
      benchmark.delta.corpScorePathAvailableButNotTaken,
    ],
    [
      "corpScoreWindowCompressionOpportunity",
      benchmark.baseline.corpScoreWindowCompressionOpportunity,
      benchmark.candidate.corpScoreWindowCompressionOpportunity,
      benchmark.delta.corpScoreWindowCompressionOpportunity,
    ],
    [
      "corpScoreWindowCompressionTaken",
      benchmark.baseline.corpScoreWindowCompressionTaken,
      benchmark.candidate.corpScoreWindowCompressionTaken,
      benchmark.delta.corpScoreWindowCompressionTaken,
    ],
    [
      "corpScoreWindowCompressionRate",
      benchmark.baseline.corpScoreWindowCompressionRate,
      benchmark.candidate.corpScoreWindowCompressionRate,
      benchmark.delta.corpScoreWindowCompressionRate,
    ],
    [
      "corpScoreTerminalWindow",
      benchmark.baseline.corpScoreTerminalWindow,
      benchmark.candidate.corpScoreTerminalWindow,
      benchmark.delta.corpScoreTerminalWindow,
    ],
    [
      "corpScoreTerminalScoreTaken",
      benchmark.baseline.corpScoreTerminalScoreTaken,
      benchmark.candidate.corpScoreTerminalScoreTaken,
      benchmark.delta.corpScoreTerminalScoreTaken,
    ],
    [
      "corpScoreTerminalAdvanceTaken",
      benchmark.baseline.corpScoreTerminalAdvanceTaken,
      benchmark.candidate.corpScoreTerminalAdvanceTaken,
      benchmark.delta.corpScoreTerminalAdvanceTaken,
    ],
    [
      "corpScoreTerminalAgendaInstalled",
      benchmark.baseline.corpScoreTerminalAgendaInstalled,
      benchmark.candidate.corpScoreTerminalAgendaInstalled,
      benchmark.delta.corpScoreTerminalAgendaInstalled,
    ],
    [
      "corpScoreTerminalSkipped",
      benchmark.baseline.corpScoreTerminalSkipped,
      benchmark.candidate.corpScoreTerminalSkipped,
      benchmark.delta.corpScoreTerminalSkipped,
    ],
    [
      "corpScoreConversionFixGateEligible",
      benchmark.baseline.corpScoreConversionFixGateEligible,
      benchmark.candidate.corpScoreConversionFixGateEligible,
      benchmark.delta.corpScoreConversionFixGateEligible,
    ],
    [
      "corpScoreConversionFixGateSuspiciousProtectionLoop",
      benchmark.baseline.corpScoreConversionFixGateSuspiciousProtectionLoop,
      benchmark.candidate.corpScoreConversionFixGateSuspiciousProtectionLoop,
      benchmark.delta.corpScoreConversionFixGateSuspiciousProtectionLoop,
    ],
    [
      "corpScoreConversionFixGateSuspiciousEconomyLoop",
      benchmark.baseline.corpScoreConversionFixGateSuspiciousEconomyLoop,
      benchmark.candidate.corpScoreConversionFixGateSuspiciousEconomyLoop,
      benchmark.delta.corpScoreConversionFixGateSuspiciousEconomyLoop,
    ],
    [
      "corpScoreConversionFixGateSuspiciousDraw",
      benchmark.baseline.corpScoreConversionFixGateSuspiciousDraw,
      benchmark.candidate.corpScoreConversionFixGateSuspiciousDraw,
      benchmark.delta.corpScoreConversionFixGateSuspiciousDraw,
    ],
    [
      "corpScoreConversionFixGateSuspiciousRemotePortfolio",
      benchmark.baseline.corpScoreConversionFixGateSuspiciousRemotePortfolio,
      benchmark.candidate.corpScoreConversionFixGateSuspiciousRemotePortfolio,
      benchmark.delta.corpScoreConversionFixGateSuspiciousRemotePortfolio,
    ],
    [
      "corpScoreTerminalSkippedThenAgendaStolen",
      benchmark.baseline.corpScoreTerminalSkippedThenAgendaStolen,
      benchmark.candidate.corpScoreTerminalSkippedThenAgendaStolen,
      benchmark.delta.corpScoreTerminalSkippedThenAgendaStolen,
    ],
    [
      "corpNonEssentialActionBeforeScoreWindow",
      benchmark.baseline.corpNonEssentialActionBeforeScoreWindow,
      benchmark.candidate.corpNonEssentialActionBeforeScoreWindow,
      benchmark.delta.corpNonEssentialActionBeforeScoreWindow,
    ],
    [
      "corpEconomyBeforeScoreWindow",
      benchmark.baseline.corpEconomyBeforeScoreWindow,
      benchmark.candidate.corpEconomyBeforeScoreWindow,
      benchmark.delta.corpEconomyBeforeScoreWindow,
    ],
    [
      "corpEconomyBeforeScoreWindowNecessary",
      benchmark.baseline.corpEconomyBeforeScoreWindowNecessary,
      benchmark.candidate.corpEconomyBeforeScoreWindowNecessary,
      benchmark.delta.corpEconomyBeforeScoreWindowNecessary,
    ],
    [
      "corpEconomyBeforeScoreTaken",
      benchmark.baseline.corpEconomyBeforeScoreTaken,
      benchmark.candidate.corpEconomyBeforeScoreTaken,
      benchmark.delta.corpEconomyBeforeScoreTaken,
    ],
    [
      "corpEconomyBeforeScoreTakenAsNecessaryCredits",
      benchmark.baseline.corpEconomyBeforeScoreTakenAsNecessaryCredits,
      benchmark.candidate.corpEconomyBeforeScoreTakenAsNecessaryCredits,
      benchmark.delta.corpEconomyBeforeScoreTakenAsNecessaryCredits,
    ],
    [
      "corpEconomyBeforeScoreTakenDespiteCreditsEnough",
      benchmark.baseline.corpEconomyBeforeScoreTakenDespiteCreditsEnough,
      benchmark.candidate.corpEconomyBeforeScoreTakenDespiteCreditsEnough,
      benchmark.delta.corpEconomyBeforeScoreTakenDespiteCreditsEnough,
    ],
    [
      "corpEconomyBeforeScoreConvertedWithin3CorpActions",
      benchmark.baseline.corpEconomyBeforeScoreConvertedWithin3CorpActions,
      benchmark.candidate.corpEconomyBeforeScoreConvertedWithin3CorpActions,
      benchmark.delta.corpEconomyBeforeScoreConvertedWithin3CorpActions,
    ],
    [
      "corpEconomyBeforeScoreRepeatedEconomyWithin3",
      benchmark.baseline.corpEconomyBeforeScoreRepeatedEconomyWithin3,
      benchmark.candidate.corpEconomyBeforeScoreRepeatedEconomyWithin3,
      benchmark.delta.corpEconomyBeforeScoreRepeatedEconomyWithin3,
    ],
    [
      "corpEconomyBeforeScoreNotConvertedWithin3CorpActions",
      benchmark.baseline.corpEconomyBeforeScoreNotConvertedWithin3CorpActions,
      benchmark.candidate.corpEconomyBeforeScoreNotConvertedWithin3CorpActions,
      benchmark.delta.corpEconomyBeforeScoreNotConvertedWithin3CorpActions,
    ],
    [
      "corpEconomyBeforeScoreThenRunnerSteal",
      benchmark.baseline.corpEconomyBeforeScoreThenRunnerSteal,
      benchmark.candidate.corpEconomyBeforeScoreThenRunnerSteal,
      benchmark.delta.corpEconomyBeforeScoreThenRunnerSteal,
    ],
    [
      "corpEconomyBeforeScoreFixGateSuspicious",
      benchmark.baseline.corpEconomyBeforeScoreFixGateSuspicious,
      benchmark.candidate.corpEconomyBeforeScoreFixGateSuspicious,
      benchmark.delta.corpEconomyBeforeScoreFixGateSuspicious,
    ],
    [
      "corpProtectionBeforeScoreWindowNoSafetyDelta",
      benchmark.baseline.corpProtectionBeforeScoreWindowNoSafetyDelta,
      benchmark.candidate.corpProtectionBeforeScoreWindowNoSafetyDelta,
      benchmark.delta.corpProtectionBeforeScoreWindowNoSafetyDelta,
    ],
    [
      "corpCentralProtectionBeforeScoreWindow",
      benchmark.baseline.corpCentralProtectionBeforeScoreWindow,
      benchmark.candidate.corpCentralProtectionBeforeScoreWindow,
      benchmark.delta.corpCentralProtectionBeforeScoreWindow,
    ],
    [
      "corpAdvanceBurstOpportunity",
      benchmark.baseline.corpAdvanceBurstOpportunity,
      benchmark.candidate.corpAdvanceBurstOpportunity,
      benchmark.delta.corpAdvanceBurstOpportunity,
    ],
    [
      "corpAdvanceBurstTaken",
      benchmark.baseline.corpAdvanceBurstTaken,
      benchmark.candidate.corpAdvanceBurstTaken,
      benchmark.delta.corpAdvanceBurstTaken,
    ],
    [
      "corpSameTurnScoreOpportunity",
      benchmark.baseline.corpSameTurnScoreOpportunity,
      benchmark.candidate.corpSameTurnScoreOpportunity,
      benchmark.delta.corpSameTurnScoreOpportunity,
    ],
    [
      "corpSameTurnScoreTaken",
      benchmark.baseline.corpSameTurnScoreTaken,
      benchmark.candidate.corpSameTurnScoreTaken,
      benchmark.delta.corpSameTurnScoreTaken,
    ],
    [
      "corpRunnerStealAfterDelayedScoreWindow",
      benchmark.baseline.corpRunnerStealAfterDelayedScoreWindow,
      benchmark.candidate.corpRunnerStealAfterDelayedScoreWindow,
      benchmark.delta.corpRunnerStealAfterDelayedScoreWindow,
    ],
    [
      "scoredAgendaActionOpportunities",
      benchmark.baseline.scoredAgendaActionOpportunities,
      benchmark.candidate.scoredAgendaActionOpportunities,
      benchmark.delta.scoredAgendaActionOpportunities,
    ],
    [
      "scoredAgendaActionTaken",
      benchmark.baseline.scoredAgendaActionTaken,
      benchmark.candidate.scoredAgendaActionTaken,
      benchmark.delta.scoredAgendaActionTaken,
    ],
    [
      "scoredAgendaActionTakeRate",
      benchmark.baseline.scoredAgendaActionTakeRate,
      benchmark.candidate.scoredAgendaActionTakeRate,
      benchmark.delta.scoredAgendaActionTakeRate,
    ],
    [
      "politicalOverthrowSkippedForBasicCredit",
      benchmark.baseline.politicalOverthrowSkippedForBasicCredit,
      benchmark.candidate.politicalOverthrowSkippedForBasicCredit,
      benchmark.delta.politicalOverthrowSkippedForBasicCredit,
    ],
    [
      "basicCreditTakenWhileBetterAgendaEconomyAvailable",
      benchmark.baseline.basicCreditTakenWhileBetterAgendaEconomyAvailable,
      benchmark.candidate.basicCreditTakenWhileBetterAgendaEconomyAvailable,
      benchmark.delta.basicCreditTakenWhileBetterAgendaEconomyAvailable,
    ],
    [
      "corpNewRemoteCreated",
      benchmark.baseline.corpNewRemoteCreated,
      benchmark.candidate.corpNewRemoteCreated,
      benchmark.delta.corpNewRemoteCreated,
    ],
    [
      "corpNewRemoteCreatedWithoutPayloadPlan",
      benchmark.baseline.corpNewRemoteCreatedWithoutPayloadPlan,
      benchmark.candidate.corpNewRemoteCreatedWithoutPayloadPlan,
      benchmark.delta.corpNewRemoteCreatedWithoutPayloadPlan,
    ],
    [
      "corpRemoteConversionRate",
      benchmark.baseline.corpRemoteConversionRate,
      benchmark.candidate.corpRemoteConversionRate,
      benchmark.delta.corpRemoteConversionRate,
    ],
    [
      "corpRemoteIceConsolidationOpportunity",
      benchmark.baseline.corpRemoteIceConsolidationOpportunity,
      benchmark.candidate.corpRemoteIceConsolidationOpportunity,
      benchmark.delta.corpRemoteIceConsolidationOpportunity,
    ],
    [
      "corpRemoteIceConsolidationTaken",
      benchmark.baseline.corpRemoteIceConsolidationTaken,
      benchmark.candidate.corpRemoteIceConsolidationTaken,
      benchmark.delta.corpRemoteIceConsolidationTaken,
    ],
    [
      "corpFutureRunIceInstallOpportunities",
      benchmark.baseline.corpFutureRunIceInstallOpportunities,
      benchmark.candidate.corpFutureRunIceInstallOpportunities,
      benchmark.delta.corpFutureRunIceInstallOpportunities,
    ],
    [
      "corpFutureRunIceInstalled",
      benchmark.baseline.corpFutureRunIceInstalled,
      benchmark.candidate.corpFutureRunIceInstalled,
      benchmark.delta.corpFutureRunIceInstalled,
    ],
    [
      "corpFutureRunIceInstalledAsDeadEffect",
      benchmark.baseline.corpFutureRunIceInstalledAsDeadEffect,
      benchmark.candidate.corpFutureRunIceInstalledAsDeadEffect,
      benchmark.delta.corpFutureRunIceInstalledAsDeadEffect,
    ],
    [
      "corpFutureRunIceInstalledAsLiveEffect",
      benchmark.baseline.corpFutureRunIceInstalledAsLiveEffect,
      benchmark.candidate.corpFutureRunIceInstalledAsLiveEffect,
      benchmark.delta.corpFutureRunIceInstalledAsLiveEffect,
    ],
    [
      "corpMultiIceInstallOrderOptimized",
      benchmark.baseline.corpMultiIceInstallOrderOptimized,
      benchmark.candidate.corpMultiIceInstallOrderOptimized,
      benchmark.delta.corpMultiIceInstallOrderOptimized,
    ],
    [
      "corpBallAndChainInstalledWithoutLaterIce",
      benchmark.baseline.corpBallAndChainInstalledWithoutLaterIce,
      benchmark.candidate.corpBallAndChainInstalledWithoutLaterIce,
      benchmark.delta.corpBallAndChainInstalledWithoutLaterIce,
    ],
    [
      "corpRemotePortfolioOverExpanded",
      benchmark.baseline.corpRemotePortfolioOverExpanded,
      benchmark.candidate.corpRemotePortfolioOverExpanded,
      benchmark.delta.corpRemotePortfolioOverExpanded,
    ],
    [
      "corpHqAgendaDensity",
      benchmark.baseline.corpHqAgendaDensity,
      benchmark.candidate.corpHqAgendaDensity,
      benchmark.delta.corpHqAgendaDensity,
    ],
    [
      "corpHqAgendaFloodRisk",
      benchmark.baseline.corpHqAgendaFloodRisk,
      benchmark.candidate.corpHqAgendaFloodRisk,
      benchmark.delta.corpHqAgendaFloodRisk,
    ],
    [
      "runnerHqAccessThreat",
      benchmark.baseline.runnerHqAccessThreat,
      benchmark.candidate.runnerHqAccessThreat,
      benchmark.delta.runnerHqAccessThreat,
    ],
    [
      "corpDrawChosenToDiluteAgendaFlood",
      benchmark.baseline.corpDrawChosenToDiluteAgendaFlood,
      benchmark.candidate.corpDrawChosenToDiluteAgendaFlood,
      benchmark.delta.corpDrawChosenToDiluteAgendaFlood,
    ],
    [
      "corpDrawSkippedBecauseAgendaFloodRisk",
      benchmark.baseline.corpDrawSkippedBecauseAgendaFloodRisk,
      benchmark.candidate.corpDrawSkippedBecauseAgendaFloodRisk,
      benchmark.delta.corpDrawSkippedBecauseAgendaFloodRisk,
    ],
    [
      "advanceThenScoreSameTurn",
      benchmark.baseline.advanceThenScoreSameTurn,
      benchmark.candidate.advanceThenScoreSameTurn,
      benchmark.delta.advanceThenScoreSameTurn,
    ],
    [
      "advanceThenRunnerStealBeforeNextCorpScore",
      benchmark.baseline.advanceThenRunnerStealBeforeNextCorpScore,
      benchmark.candidate.advanceThenRunnerStealBeforeNextCorpScore,
      benchmark.delta.advanceThenRunnerStealBeforeNextCorpScore,
    ],
    [
      "remoteProtectionScoreAtFinalAdvance",
      benchmark.baseline.remoteProtectionScoreAtFinalAdvance,
      benchmark.candidate.remoteProtectionScoreAtFinalAdvance,
      benchmark.delta.remoteProtectionScoreAtFinalAdvance,
    ],
    [
      "runnerContestRiskAtFinalAdvance",
      benchmark.baseline.runnerContestRiskAtFinalAdvance,
      benchmark.candidate.runnerContestRiskAtFinalAdvance,
      benchmark.delta.runnerContestRiskAtFinalAdvance,
    ],
    [
      "centralPressureRuns",
      benchmark.baseline.centralPressureRuns,
      benchmark.candidate.centralPressureRuns,
      benchmark.delta.centralPressureRuns,
    ],
    [
      "hqPressureRuns",
      benchmark.baseline.hqPressureRuns,
      benchmark.candidate.hqPressureRuns,
      benchmark.delta.hqPressureRuns,
    ],
    [
      "rdPressureRuns",
      benchmark.baseline.rdPressureRuns,
      benchmark.candidate.rdPressureRuns,
      benchmark.delta.rdPressureRuns,
    ],
    [
      "archivesPressureRuns",
      benchmark.baseline.archivesPressureRuns,
      benchmark.candidate.archivesPressureRuns,
      benchmark.delta.archivesPressureRuns,
    ],
    [
      "remotePressureRuns",
      benchmark.baseline.remotePressureRuns,
      benchmark.candidate.remotePressureRuns,
      benchmark.delta.remotePressureRuns,
    ],
    [
      "successfulCentralRuns",
      benchmark.baseline.successfulCentralRuns,
      benchmark.candidate.successfulCentralRuns,
      benchmark.delta.successfulCentralRuns,
    ],
    [
      "centralAgendaSteals",
      benchmark.baseline.centralAgendaSteals,
      benchmark.candidate.centralAgendaSteals,
      benchmark.delta.centralAgendaSteals,
    ],
    [
      "centralStealsPerRun",
      benchmark.baseline.centralStealsPerRun,
      benchmark.candidate.centralStealsPerRun,
      benchmark.delta.centralStealsPerRun,
    ],
    [
      "centralRunsWithMultiaccess",
      benchmark.baseline.centralRunsWithMultiaccess,
      benchmark.candidate.centralRunsWithMultiaccess,
      benchmark.delta.centralRunsWithMultiaccess,
    ],
    [
      "hqRunsWithHqInterface",
      benchmark.baseline.hqRunsWithHqInterface,
      benchmark.candidate.hqRunsWithHqInterface,
      benchmark.delta.hqRunsWithHqInterface,
    ],
    [
      "rndRunsWithRndInterface",
      benchmark.baseline.rndRunsWithRndInterface,
      benchmark.candidate.rndRunsWithRndInterface,
      benchmark.delta.rndRunsWithRndInterface,
    ],
    [
      "repeatedLowValueCentralRuns",
      benchmark.baseline.repeatedLowValueCentralRuns,
      benchmark.candidate.repeatedLowValueCentralRuns,
      benchmark.delta.repeatedLowValueCentralRuns,
    ],
    [
      "centralRunStreakWithoutValue",
      benchmark.baseline.centralRunStreakWithoutValue,
      benchmark.candidate.centralRunStreakWithoutValue,
      benchmark.delta.centralRunStreakWithoutValue,
    ],
    [
      "trueCentralCloseoutOpportunities",
      benchmark.baseline.trueCentralCloseoutOpportunities,
      benchmark.candidate.trueCentralCloseoutOpportunities,
      benchmark.delta.trueCentralCloseoutOpportunities,
    ],
    [
      "centralCloseoutOpportunitiesRaw",
      benchmark.baseline.centralCloseoutOpportunitiesRaw,
      benchmark.candidate.centralCloseoutOpportunitiesRaw,
      benchmark.delta.centralCloseoutOpportunitiesRaw,
    ],
    [
      "centralCloseoutOpportunitiesDeduped",
      benchmark.baseline.centralCloseoutOpportunitiesDeduped,
      benchmark.candidate.centralCloseoutOpportunitiesDeduped,
      benchmark.delta.centralCloseoutOpportunitiesDeduped,
    ],
    [
      "centralCloseoutOpportunities",
      benchmark.baseline.centralCloseoutOpportunities,
      benchmark.candidate.centralCloseoutOpportunities,
      benchmark.delta.centralCloseoutOpportunities,
    ],
    [
      "centralCloseoutRunsTaken",
      benchmark.baseline.centralCloseoutRunsTaken,
      benchmark.candidate.centralCloseoutRunsTaken,
      benchmark.delta.centralCloseoutRunsTaken,
    ],
    [
      "centralCloseoutSuccesses",
      benchmark.baseline.centralCloseoutSuccesses,
      benchmark.candidate.centralCloseoutSuccesses,
      benchmark.delta.centralCloseoutSuccesses,
    ],
    [
      "centralCloseoutFalsePositiveRate",
      benchmark.baseline.centralCloseoutFalsePositiveRate,
      benchmark.candidate.centralCloseoutFalsePositiveRate,
      benchmark.delta.centralCloseoutFalsePositiveRate,
    ],
    [
      "repeatedCentralRunsWithFreshValue",
      benchmark.baseline.repeatedCentralRunsWithFreshValue,
      benchmark.candidate.repeatedCentralRunsWithFreshValue,
      benchmark.delta.repeatedCentralRunsWithFreshValue,
    ],
    [
      "centralRunInsteadUnjustified",
      benchmark.baseline.centralRunInsteadUnjustified,
      benchmark.candidate.centralRunInsteadUnjustified,
      benchmark.delta.centralRunInsteadUnjustified,
    ],
    [
      "centralRunStalePenaltyApplied",
      benchmark.baseline.centralRunStalePenaltyApplied,
      benchmark.candidate.centralRunStalePenaltyApplied,
      benchmark.delta.centralRunStalePenaltyApplied,
    ],
    [
      "successfulRemoteRuns",
      benchmark.baseline.successfulRemoteRuns,
      benchmark.candidate.successfulRemoteRuns,
      benchmark.delta.successfulRemoteRuns,
    ],
    [
      "remoteTrashActions",
      benchmark.baseline.remoteTrashActions,
      benchmark.candidate.remoteTrashActions,
      benchmark.delta.remoteTrashActions,
    ],
    [
      "expensiveRemoteTrashTaken",
      benchmark.baseline.expensiveRemoteTrashTaken,
      benchmark.candidate.expensiveRemoteTrashTaken,
      benchmark.delta.expensiveRemoteTrashTaken,
    ],
    [
      "highImpactRemoteTrashDeferredByBudget",
      benchmark.baseline.highImpactRemoteTrashDeferredByBudget,
      benchmark.candidate.highImpactRemoteTrashDeferredByBudget,
      benchmark.delta.highImpactRemoteTrashDeferredByBudget,
    ],
    [
      "highImpactRemoteTrashSkippedNoThreat",
      benchmark.baseline.highImpactRemoteTrashSkippedNoThreat,
      benchmark.candidate.highImpactRemoteTrashSkippedNoThreat,
      benchmark.delta.highImpactRemoteTrashSkippedNoThreat,
    ],
    [
      "remoteTrashDroppedBelowReserve",
      benchmark.baseline.remoteTrashDroppedBelowReserve,
      benchmark.candidate.remoteTrashDroppedBelowReserve,
      benchmark.delta.remoteTrashDroppedBelowReserve,
    ],
    [
      "remoteTrashWithoutImmediateThreat",
      benchmark.baseline.remoteTrashWithoutImmediateThreat,
      benchmark.candidate.remoteTrashWithoutImmediateThreat,
      benchmark.delta.remoteTrashWithoutImmediateThreat,
    ],
    [
      "trashDecisionLeftRunnerUnableToContest",
      benchmark.baseline.trashDecisionLeftRunnerUnableToContest,
      benchmark.candidate.trashDecisionLeftRunnerUnableToContest,
      benchmark.delta.trashDecisionLeftRunnerUnableToContest,
    ],
    [
      "remoteContestActions",
      benchmark.baseline.remoteContestActions,
      benchmark.candidate.remoteContestActions,
      benchmark.delta.remoteContestActions,
    ],
    [
      "pressureTargetSwitches",
      benchmark.baseline.pressureTargetSwitches,
      benchmark.candidate.pressureTargetSwitches,
      benchmark.delta.pressureTargetSwitches,
    ],
    [
      "distinctPressureTargets",
      benchmark.baseline.distinctPressureTargets,
      benchmark.candidate.distinctPressureTargets,
      benchmark.delta.distinctPressureTargets,
    ],
    [
      "remoteInstalls",
      benchmark.baseline.remoteInstalls,
      benchmark.candidate.remoteInstalls,
      benchmark.delta.remoteInstalls,
    ],
    [
      "remoteRootInstalls",
      benchmark.baseline.remoteRootInstalls,
      benchmark.candidate.remoteRootInstalls,
      benchmark.delta.remoteRootInstalls,
    ],
    [
      "remoteIceInstalls",
      benchmark.baseline.remoteIceInstalls,
      benchmark.candidate.remoteIceInstalls,
      benchmark.delta.remoteIceInstalls,
    ],
    [
      "remoteAdvances",
      benchmark.baseline.remoteAdvances,
      benchmark.candidate.remoteAdvances,
      benchmark.delta.remoteAdvances,
    ],
    [
      "advancedAgendaInstalledInRemote",
      benchmark.baseline.advancedAgendaInstalledInRemote,
      benchmark.candidate.advancedAgendaInstalledInRemote,
      benchmark.delta.advancedAgendaInstalledInRemote,
    ],
    [
      "advancementActionsOnAgendas",
      benchmark.baseline.advancementActionsOnAgendas,
      benchmark.candidate.advancementActionsOnAgendas,
      benchmark.delta.advancementActionsOnAgendas,
    ],
    [
      "advancementActionsOnAssets",
      benchmark.baseline.advancementActionsOnAssets,
      benchmark.candidate.advancementActionsOnAssets,
      benchmark.delta.advancementActionsOnAssets,
    ],
    [
      "advancementActionsOnUpgrades",
      benchmark.baseline.advancementActionsOnUpgrades,
      benchmark.candidate.advancementActionsOnUpgrades,
      benchmark.delta.advancementActionsOnUpgrades,
    ],
    [
      "advancementActionsOnUnknown",
      benchmark.baseline.advancementActionsOnUnknown,
      benchmark.candidate.advancementActionsOnUnknown,
      benchmark.delta.advancementActionsOnUnknown,
    ],
    [
      "remoteBuildActions",
      benchmark.baseline.remoteBuildActions,
      benchmark.candidate.remoteBuildActions,
      benchmark.delta.remoteBuildActions,
    ],
    [
      "remoteAdvanceActions",
      benchmark.baseline.remoteAdvanceActions,
      benchmark.candidate.remoteAdvanceActions,
      benchmark.delta.remoteAdvanceActions,
    ],
    [
      "scoreWindowActions",
      benchmark.baseline.scoreWindowActions,
      benchmark.candidate.scoreWindowActions,
      benchmark.delta.scoreWindowActions,
    ],
    [
      "scoringRemoteDevelopmentActions",
      benchmark.baseline.scoringRemoteDevelopmentActions,
      benchmark.candidate.scoringRemoteDevelopmentActions,
      benchmark.delta.scoringRemoteDevelopmentActions,
    ],
    [
      "rezIceDuringRun",
      benchmark.baseline.rezIceDuringRun,
      benchmark.candidate.rezIceDuringRun,
      benchmark.delta.rezIceDuringRun,
    ],
    [
      "scoreWindows",
      benchmark.baseline.scoreWindows,
      benchmark.candidate.scoreWindows,
      benchmark.delta.scoreWindows,
    ],
    [
      "turnsToFirstCorpScore",
      benchmark.baseline.turnsToFirstCorpScore,
      benchmark.candidate.turnsToFirstCorpScore,
      benchmark.delta.turnsToFirstCorpScore,
    ],
    [
      "turnsToFirstAgendaSteal",
      benchmark.baseline.turnsToFirstAgendaSteal,
      benchmark.candidate.turnsToFirstAgendaSteal,
      benchmark.delta.turnsToFirstAgendaSteal,
    ],
    [
      "turnsFromFirstAdvanceToScore",
      benchmark.baseline.turnsFromFirstAdvanceToScore,
      benchmark.candidate.turnsFromFirstAdvanceToScore,
      benchmark.delta.turnsFromFirstAdvanceToScore,
    ],
    [
      "turnsFromFinalAdvanceToScoreOrSteal",
      benchmark.baseline.turnsFromFinalAdvanceToScoreOrSteal,
      benchmark.candidate.turnsFromFinalAdvanceToScoreOrSteal,
      benchmark.delta.turnsFromFinalAdvanceToScoreOrSteal,
    ],
    [
      "runnerDrawActions",
      benchmark.baseline.runnerDrawActions,
      benchmark.candidate.runnerDrawActions,
      benchmark.delta.runnerDrawActions,
    ],
    [
      "runnerDrawActionShare",
      benchmark.baseline.runnerDrawActionShare,
      benchmark.candidate.runnerDrawActionShare,
      benchmark.delta.runnerDrawActionShare,
    ],
    [
      "clickDrawActions",
      benchmark.baseline.clickDrawActions,
      benchmark.candidate.clickDrawActions,
      benchmark.delta.clickDrawActions,
    ],
    [
      "cardEffectDrawActions",
      benchmark.baseline.cardEffectDrawActions,
      benchmark.candidate.cardEffectDrawActions,
      benchmark.delta.cardEffectDrawActions,
    ],
    [
      "drawWhileHoldingPlayableEconomy",
      benchmark.baseline.drawWhileHoldingPlayableEconomy,
      benchmark.candidate.drawWhileHoldingPlayableEconomy,
      benchmark.delta.drawWhileHoldingPlayableEconomy,
    ],
    [
      "drawWhileHoldingInstallableBreaker",
      benchmark.baseline.drawWhileHoldingInstallableBreaker,
      benchmark.candidate.drawWhileHoldingInstallableBreaker,
      benchmark.delta.drawWhileHoldingInstallableBreaker,
    ],
    [
      "drawWhileHoldingRunnablePressureCard",
      benchmark.baseline.drawWhileHoldingRunnablePressureCard,
      benchmark.candidate.drawWhileHoldingRunnablePressureCard,
      benchmark.delta.drawWhileHoldingRunnablePressureCard,
    ],
    [
      "drawWhileRemoteTrashAvailable",
      benchmark.baseline.drawWhileRemoteTrashAvailable,
      benchmark.candidate.drawWhileRemoteTrashAvailable,
      benchmark.delta.drawWhileRemoteTrashAvailable,
    ],
    [
      "drawThenDiscardSameTurn",
      benchmark.baseline.drawThenDiscardSameTurn,
      benchmark.candidate.drawThenDiscardSameTurn,
      benchmark.delta.drawThenDiscardSameTurn,
    ],
    [
      "runnerDuplicateInstallActions",
      benchmark.baseline.runnerDuplicateInstallActions,
      benchmark.candidate.runnerDuplicateInstallActions,
      benchmark.delta.runnerDuplicateInstallActions,
    ],
    [
      "runnerLowValueDuplicateInstallActions",
      benchmark.baseline.runnerLowValueDuplicateInstallActions,
      benchmark.candidate.runnerLowValueDuplicateInstallActions,
      benchmark.delta.runnerLowValueDuplicateInstallActions,
    ],
    [
      "runnerJunkyardBbsDuplicateInstalls",
      benchmark.baseline.runnerJunkyardBbsDuplicateInstalls,
      benchmark.candidate.runnerJunkyardBbsDuplicateInstalls,
      benchmark.delta.runnerJunkyardBbsDuplicateInstalls,
    ],
    [
      "runnerEconomyActionsTaken",
      benchmark.baseline.runnerEconomyActionsTaken,
      benchmark.candidate.runnerEconomyActionsTaken,
      benchmark.delta.runnerEconomyActionsTaken,
    ],
    [
      "runnerRigInstallActions",
      benchmark.baseline.runnerRigInstallActions,
      benchmark.candidate.runnerRigInstallActions,
      benchmark.delta.runnerRigInstallActions,
    ],
    [
      "runnerRemoteTrashOpportunities",
      benchmark.baseline.runnerRemoteTrashOpportunities,
      benchmark.candidate.runnerRemoteTrashOpportunities,
      benchmark.delta.runnerRemoteTrashOpportunities,
    ],
    [
      "runnerRemoteTrashTaken",
      benchmark.baseline.runnerRemoteTrashTaken,
      benchmark.candidate.runnerRemoteTrashTaken,
      benchmark.delta.runnerRemoteTrashTaken,
    ],
    [
      "handUseRate",
      benchmark.baseline.handUseRate,
      benchmark.candidate.handUseRate,
      benchmark.delta.handUseRate,
    ],
  ];
  const safetyRows: Array<[string, number, number, number]> = [
    [
      "illegalActions",
      benchmark.baseline.illegalActions,
      benchmark.candidate.illegalActions,
      benchmark.delta.illegalActions,
    ],
    [
      "replayFailures",
      benchmark.baseline.replayFailures,
      benchmark.candidate.replayFailures,
      benchmark.delta.replayFailures,
    ],
    [
      "fallbackRate",
      benchmark.baseline.fallbackRate,
      benchmark.candidate.fallbackRate,
      benchmark.delta.fallbackRate,
    ],
    [
      "timeoutRate",
      benchmark.baseline.timeoutRate,
      benchmark.candidate.timeoutRate,
      benchmark.delta.timeoutRate,
    ],
  ];
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
    ...progressionRows.map(
      ([metric, baseline, candidate, delta]) =>
        `| ${metric} | ${baseline} | ${candidate} | ${delta} |`,
    ),
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
    ...safetyRows.map(
      ([metric, baseline, candidate, delta]) =>
        `| ${metric} | ${baseline} | ${candidate} | ${delta} |`,
    ),
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
      slot.benchmark!.profileComparisons.map(
        ({ profile, metrics }) =>
          [
            slot.slotId,
            slot.slotType,
            slot.tuningUse,
            slot.runnerArchetype,
            slot.corpArchetype,
            profile,
            slot.runnerDeckRef,
            slot.corpDeckRef,
            metrics.illegalActions,
            metrics.replayFailures,
            metrics.timeoutRate,
            metrics.actionLimitRate,
            metrics.averageTurns,
            metrics.corpScores,
            metrics.scoreActionsAvailable,
            metrics.scoreActionsTaken,
            metrics.missedScoreWindows,
            metrics.scoreActionTakeRate,
            metrics.runnerSteals,
            metrics.advancedAgendaSteals,
            metrics.advancedAgendaStealsFromRemote,
            metrics.advancedAgendaStealsFromCentral,
            metrics.finalAdvanceActions,
            metrics.unsafeFinalAdvanceActions,
            metrics.protectedFinalAdvanceActions,
            metrics.protectBeforeAdvanceActions,
            metrics.scoreOrStealActionsPerMatch,
            metrics.remoteBuildActions,
            metrics.remoteAdvanceActions,
            metrics.remoteTrashActions,
            metrics.successfulRemoteAccesses,
            metrics.remoteAccessesWithTrashableCards,
            metrics.affordableRelevantRemoteTrashOpportunities,
            metrics.relevantRemoteTrashTaken,
            metrics.relevantRemoteTrashTakeRate,
            metrics.skippedAffordableRelevantRemoteTrash,
            metrics.remoteRunsAgainstAdvancedRemote,
            metrics.skippedAdvancedRemoteContest,
            metrics.centralRunWhileRemoteScoreThreatVisible,
            metrics.runnerDrawActions,
            metrics.runnerDrawActionShare,
            metrics.drawThenDiscardSameTurn,
            metrics.runnerDuplicateInstallActions,
            metrics.runnerLowValueDuplicateInstallActions,
            metrics.runnerJunkyardBbsDuplicateInstalls,
            metrics.runnerEconomyActionsTaken,
            metrics.runnerRigInstallActions,
            metrics.runnerRemoteTrashOpportunities,
            metrics.runnerRemoteTrashTaken,
            metrics.handUseRate,
            metrics.runnerAverageCredits,
            metrics.runnerEndTurnAverageCredits,
            metrics.runnerEndTurnCreditsBelowReserve,
            metrics.runnerTurnsBelowContestReserve,
            metrics.runnerRunsStartedBelowReserve,
            metrics.runnerContestBlockedByCredits,
            metrics.runnerSpendBelowReserveActions,
            metrics.runsStartedAgainstKnownUnaffordablePath,
            metrics.creditsMissingForKnownPath,
            metrics.lowValueUnaffordableRuns,
            metrics.uniqueAdvancedRemoteThreats,
            metrics.contestableAdvancedRemoteThreats,
            metrics.advancedRemoteThreatsContested,
            metrics.advancedRemoteThreatContestRate,
            metrics.skippedContestableAdvancedRemoteThreats,
            metrics.centralRunInsteadOfContestableAdvancedRemote,
            metrics.centralRunInsteadWasJustified,
            metrics.centralRunBurnedRemoteContestReserve,
            metrics.remoteContestBlockedByCredits,
            metrics.remoteContestBlockedByPostRunReserve,
            metrics.remoteRunStartedWithInsufficientPostRunReserve,
            metrics.repeatedCentralRunsWhileSameRemoteThreat,
            metrics.successfulCentralRuns,
            metrics.successfulRemoteRuns,
            metrics.rezIceDuringRun,
          ] as const,
      ),
    );
  const nonRunnableRows = suite.slots.filter(
    (slot) => slot.status !== "runnable",
  );
  const corpStrategyPanelRows = summarizeCorpStrategyPanelCoverage(
    suite.slots,
  );
  const missingCorpStrategyTargets = CORP_STRATEGY_PANEL_TARGETS.filter(
    (target) =>
      !suite.slots.some(
        (slot) => slot.status === "runnable" && slot.corpArchetype === target,
      ),
  );
  const breakerOntologyRows = suite.slots
    .filter((slot) => slot.status === "runnable" && slot.benchmark)
    .flatMap((slot) =>
      slot.benchmark!.profileComparisons.map(({ profile, metrics }) => [
        slot.slotId,
        slot.tuningUse,
        profile,
        metrics.runnerBreakerOntologyProfilesSeen,
        metrics.runnerBreakerOntologyCoverageUsed,
        metrics.runnerBreakerOntologyFallbackUsed,
        metrics.runnerInstallableBreakerRankedByOntology,
        metrics.runnerSearchTargetRankedByOntology,
        metrics.corpVisibleRunnerBreakerOntologyProfilesSeen,
        metrics.corpRemoteSafetyUsedRunnerBreakerOntology,
        metrics.corpCheapContestDetectedByBreakerOntology,
        metrics.corpRemoteSafetyOntologyConflictWithEffectiveQuote,
        metrics.breakerOntologyCoverageByType,
        metrics.breakerOntologyFallbackEvidenceCount,
        metrics.breakerOntologyEffectiveQuoteOverrideCount,
      ]),
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
      .filter((row) => slotTypes.includes(row[1]))
      .map(formatSuiteMetricRow);
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
    "## Breaker Ontology Metrics",
    "",
    "| Slot | Use | Profile | Runner Profiles Seen | Runner Coverage Used | Runner Fallback | Runner Install Ranked | Runner Search Ranked | Corp Visible Profiles | Corp Remote Safety Used | Corp Cheap Contest | Quote Conflict/Override | Coverage Signals | Fallback Evidence | Effective Quote Override |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...breakerOntologyRows.map(
      ([
        slotId,
        tuningUse,
        profile,
        runnerProfilesSeen,
        runnerCoverageUsed,
        runnerFallback,
        runnerInstallRanked,
        runnerSearchRanked,
        corpVisibleProfiles,
        corpRemoteSafetyUsed,
        corpCheapContest,
        quoteConflict,
        coverageSignals,
        fallbackEvidence,
        effectiveQuoteOverride,
      ]) =>
        `| ${slotId} | ${tuningUse} | ${profile} | ${runnerProfilesSeen} | ${runnerCoverageUsed} | ${runnerFallback} | ${runnerInstallRanked} | ${runnerSearchRanked} | ${corpVisibleProfiles} | ${corpRemoteSafetyUsed} | ${corpCheapContest} | ${quoteConflict} | ${coverageSignals} | ${fallbackEvidence} | ${effectiveQuoteOverride} |`,
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

function suiteMetricHeader(): string {
  return [
    "| Slot | Type | Use | Runner Archetype | Corp Archetype | Profile | Runner | Corp | Illegal | Replay Failures | Timeout Rate | Action Limit Rate | Avg Turns | Corp Scores | Score Available | Score Taken | Missed Score | Score Take Rate | Runner Steals | Advanced Steals | Adv Steal Remote | Adv Steal Central | Final Advances | Unsafe Final | Protected Final | Protect Before | Score/Steal per Match | Remote Build | Remote Advances | Remote Trash | Successful Remote Access | Remote Access Trashable | Affordable Relevant Trash Opp | Relevant Trash Taken | Relevant Trash Take Rate | Skipped Relevant Trash | Remote Runs vs Advanced | Skipped Advanced Remote | Central While Remote Threat | Runner Draw | Draw Share | Draw+Discard | Duplicate Installs | Low-Value Dup | Junkyard Dup | Economy Taken | Rig Installs | Remote Trash Opp | Remote Trash Taken | Hand Use Rate | Runner Avg Credits | Runner End Credits | End Below Reserve | Turns Below Reserve | Runs Below Reserve | Contest Blocked Credits | Spend Below Reserve | Known Unaffordable Runs | Avg Missing Path Credits | Low-Value Unaffordable Runs | Unique Advanced Threats | Contestable Threats | Threats Contested | Threat Contest Rate | Skipped Contestable Threats | Central Instead Contestable | Central Justified | Central Burned Reserve | Remote Contest Credit Block | Remote Contest Post-Run Block | Remote Runs Insufficient Reserve | Repeated Central Same Threat | Successful Central | Successful Remote | Run-window Rez |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ].join("\n");
}

function escapeMarkdownTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function formatSuiteMetricRow(row: readonly (string | number)[]): string {
  const [
    slotId,
    slotType,
    tuningUse,
    runnerArchetype,
    corpArchetype,
    profile,
    runnerDeckRef,
    corpDeckRef,
    illegalActions,
    replayFailures,
    timeoutRate,
    actionLimitRate,
    averageTurns,
    corpScores,
    scoreActionsAvailable,
    scoreActionsTaken,
    missedScoreWindows,
    scoreActionTakeRate,
    runnerSteals,
    advancedAgendaSteals,
    advancedAgendaStealsFromRemote,
    advancedAgendaStealsFromCentral,
    finalAdvanceActions,
    unsafeFinalAdvanceActions,
    protectedFinalAdvanceActions,
    protectBeforeAdvanceActions,
    scoreOrStealActionsPerMatch,
    remoteBuildActions,
    remoteAdvanceActions,
    remoteTrashActions,
    successfulRemoteAccesses,
    remoteAccessesWithTrashableCards,
    affordableRelevantRemoteTrashOpportunities,
    relevantRemoteTrashTaken,
    relevantRemoteTrashTakeRate,
    skippedAffordableRelevantRemoteTrash,
    remoteRunsAgainstAdvancedRemote,
    skippedAdvancedRemoteContest,
    centralRunWhileRemoteScoreThreatVisible,
    runnerDrawActions,
    runnerDrawActionShare,
    drawThenDiscardSameTurn,
    runnerDuplicateInstallActions,
    runnerLowValueDuplicateInstallActions,
    runnerJunkyardBbsDuplicateInstalls,
    runnerEconomyActionsTaken,
    runnerRigInstallActions,
    runnerRemoteTrashOpportunities,
    runnerRemoteTrashTaken,
    handUseRate,
    runnerAverageCredits,
    runnerEndTurnAverageCredits,
    runnerEndTurnCreditsBelowReserve,
    runnerTurnsBelowContestReserve,
    runnerRunsStartedBelowReserve,
    runnerContestBlockedByCredits,
    runnerSpendBelowReserveActions,
    runsStartedAgainstKnownUnaffordablePath,
    creditsMissingForKnownPath,
    lowValueUnaffordableRuns,
    uniqueAdvancedRemoteThreats,
    contestableAdvancedRemoteThreats,
    advancedRemoteThreatsContested,
    advancedRemoteThreatContestRate,
    skippedContestableAdvancedRemoteThreats,
    centralRunInsteadOfContestableAdvancedRemote,
    centralRunInsteadWasJustified,
    centralRunBurnedRemoteContestReserve,
    remoteContestBlockedByCredits,
    remoteContestBlockedByPostRunReserve,
    remoteRunStartedWithInsufficientPostRunReserve,
    repeatedCentralRunsWhileSameRemoteThreat,
    successfulCentralRuns,
    successfulRemoteRuns,
    rezIceDuringRun,
  ] = row;
  return `| ${slotId} | ${slotType} | ${tuningUse} | ${runnerArchetype} | ${corpArchetype} | ${profile} | ${runnerDeckRef} | ${corpDeckRef} | ${illegalActions} | ${replayFailures} | ${timeoutRate} | ${actionLimitRate} | ${averageTurns} | ${corpScores} | ${scoreActionsAvailable} | ${scoreActionsTaken} | ${missedScoreWindows} | ${scoreActionTakeRate} | ${runnerSteals} | ${advancedAgendaSteals} | ${advancedAgendaStealsFromRemote} | ${advancedAgendaStealsFromCentral} | ${finalAdvanceActions} | ${unsafeFinalAdvanceActions} | ${protectedFinalAdvanceActions} | ${protectBeforeAdvanceActions} | ${scoreOrStealActionsPerMatch} | ${remoteBuildActions} | ${remoteAdvanceActions} | ${remoteTrashActions} | ${successfulRemoteAccesses} | ${remoteAccessesWithTrashableCards} | ${affordableRelevantRemoteTrashOpportunities} | ${relevantRemoteTrashTaken} | ${relevantRemoteTrashTakeRate} | ${skippedAffordableRelevantRemoteTrash} | ${remoteRunsAgainstAdvancedRemote} | ${skippedAdvancedRemoteContest} | ${centralRunWhileRemoteScoreThreatVisible} | ${runnerDrawActions} | ${runnerDrawActionShare} | ${drawThenDiscardSameTurn} | ${runnerDuplicateInstallActions} | ${runnerLowValueDuplicateInstallActions} | ${runnerJunkyardBbsDuplicateInstalls} | ${runnerEconomyActionsTaken} | ${runnerRigInstallActions} | ${runnerRemoteTrashOpportunities} | ${runnerRemoteTrashTaken} | ${handUseRate} | ${runnerAverageCredits} | ${runnerEndTurnAverageCredits} | ${runnerEndTurnCreditsBelowReserve} | ${runnerTurnsBelowContestReserve} | ${runnerRunsStartedBelowReserve} | ${runnerContestBlockedByCredits} | ${runnerSpendBelowReserveActions} | ${runsStartedAgainstKnownUnaffordablePath} | ${creditsMissingForKnownPath} | ${lowValueUnaffordableRuns} | ${uniqueAdvancedRemoteThreats} | ${contestableAdvancedRemoteThreats} | ${advancedRemoteThreatsContested} | ${advancedRemoteThreatContestRate} | ${skippedContestableAdvancedRemoteThreats} | ${centralRunInsteadOfContestableAdvancedRemote} | ${centralRunInsteadWasJustified} | ${centralRunBurnedRemoteContestReserve} | ${remoteContestBlockedByCredits} | ${remoteContestBlockedByPostRunReserve} | ${remoteRunStartedWithInsufficientPostRunReserve} | ${repeatedCentralRunsWhileSameRemoteThreat} | ${successfulCentralRuns} | ${successfulRemoteRuns} | ${rezIceDuringRun} |`;
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
    const runnable = matching.filter((slot) => slot.status === "runnable").length;
    const holdout = matching.filter((slot) => slot.tuningUse === "holdout_only")
      .length;
    return [
      archetype,
      runnable,
      holdout,
      matching.map((slot) => slot.slotId).join(", ") || "-",
    ] as const;
  });
}
