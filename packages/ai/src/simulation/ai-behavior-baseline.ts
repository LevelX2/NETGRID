import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSelfplayTraceMiningDetectorId } from "./selfplay-trace-mining";
import type { ActionCapacityBaselineMetrics } from "./action-capacity-baseline-metrics";
import type { RunnerActionValuationBaselineMetrics } from "./runner-action-valuation-baseline-metrics";
import type { AiBehaviorActionLimitDiagnosis } from "./ai-behavior-baseline-runtime-evidence";
import type { AiSimulationRuntimeFailure } from "./ai-simulation-runtime-failure";

export const AI_BEHAVIOR_BASELINE_VERSION = "ai-behavior-baseline-v1";

type BehaviorProgressionMetrics = Pick<
  AiMatchProgressionMetrics,
  | "games"
  | "averageActions"
  | "averageTurns"
  | "runnerAgendaPoints"
  | "corpAgendaPoints"
  | "runnerSteals"
  | "corpScores"
  | "scoreOrStealActions"
  | "scoreActionsAvailable"
  | "missedScoreWindows"
  | "remoteRunOpportunitiesAgainstAdvancedRemote"
  | "remoteRunsAgainstAdvancedRemote"
  | "skippedAdvancedRemoteContest"
  | "planIntentConvertedWithin3OwnDecisions"
  | "planIntentExpired"
  | "planIntentAbandoned"
  | "sameStrategicPlanRepeatedWithoutProgress"
>;

export type AiBehaviorBaselineSlotDescriptor = {
  slotId: string;
  label: string;
  slotType: string;
  runnerArchetype: string;
  corpArchetype: string;
  runnerDeckFingerprint: string;
  corpDeckFingerprint: string;
};

export type AiBehaviorBaselineGame = {
  seed: string;
  terminationKind: "game_result" | "action_limit" | "runtime_failure";
  winner: string;
  gameEndReason?: string;
  actions: number;
  turns: number;
  runnerAgendaPoints: number;
  corpAgendaPoints: number;
  finalStateHash: string;
  replayOk: boolean;
  errorCount: number;
  runtimeFailures?: AiSimulationRuntimeFailure[];
  actionLimitDiagnosis?: AiBehaviorActionLimitDiagnosis;
};

export type AiBehaviorBaselineSlotInput = {
  descriptor: AiBehaviorBaselineSlotDescriptor;
  progression: BehaviorProgressionMetrics;
  decisions: number;
  findings: number;
  findingsByDetector: Partial<Record<AiSelfplayTraceMiningDetectorId, number>>;
  illegalActions: number;
  replayFailures: number;
  actionLimitGames: number;
  fallbackActions: number;
  timeoutActions: number;
  runtimeErrors: number;
  redactionSafe: boolean;
  actionCapacity?: ActionCapacityBaselineMetrics;
  runnerActionValuation?: RunnerActionValuationBaselineMetrics;
  games: AiBehaviorBaselineGame[];
};

export type AiBehaviorBaselineMetrics = {
  games: number;
  decisions: number;
  averageActions: number;
  averageTurns: number;
  runnerAgendaPoints: number;
  corpAgendaPoints: number;
  runnerSteals: number;
  corpScores: number;
  scoreOrStealActions: number;
  scoreOpportunities: number;
  missedScoreWindows: number;
  missedScoreWindowRate: number | null;
  advancedRemoteContestOpportunities: number;
  advancedRemoteContestsTaken: number;
  skippedAdvancedRemoteContests: number;
  advancedRemoteContestSkipRate: number | null;
  settledPlanIntents: number;
  planIntentsConvertedWithin3: number;
  expiredPlanIntents: number;
  abandonedPlanIntents: number;
  planConversionRate: number | null;
  strategicNoProgressRepeats: number;
  strategicNoProgressRatePer100Decisions: number;
  clearlyDominatedPlanChoices: number;
  clearlyDominatedPlanChoiceRatePer100Decisions: number;
  actionCapacityOpportunities: number;
  actionCapacityUses: number;
  actionCapacityUseRate: number | null;
  actionCapacityPlanConversions: number;
  actionCapacityPlanConversionRate: number | null;
  actionCapacityFollowupConversions: number;
  actionCapacityExpiredUses: number;
  actionCapacityExpirationRate: number | null;
  actionCapacityMisconversions: number;
  actionCapacityMisconversionRate: number | null;
  runnerEndTurnsWithClicks: number;
  runnerInevitableCorpDeckoutEndTurnsWithClicks: number;
  runnerPrematureEndTurnsWithClicks: number;
  runnerPrematureEndTurnRatePer100Decisions: number;
  runnerPersistentInstallSelections: number;
  runnerRedundantPersistentInstallSelections: number;
  runnerRedundantPersistentInstallRate: number | null;
  findings: number;
  findingRatePer100Decisions: number;
  illegalActions: number;
  replayFailures: number;
  actionLimitGames: number;
  fallbackActions: number;
  timeoutActions: number;
  runtimeErrors: number;
  classifiedRuntimeFailures: number;
  unclassifiedRuntimeFailures: number;
  runtimeFailureCodeCounts: Record<string, number>;
  runtimeFailureOwnerCounts: Record<string, number>;
  repeatedRuntimeFailureOwners: string[];
  classifiedActionLimitGames: number;
  unclassifiedActionLimitGames: number;
  hiddenInfoFindings: number;
  noLegalActionFailures: number;
  redactionSafe: boolean;
};

export type AiBehaviorBaselineSlotResult = AiBehaviorBaselineSlotDescriptor & {
  metrics: AiBehaviorBaselineMetrics;
  games: AiBehaviorBaselineGame[];
};

export type AiBehaviorBaselineConfig = {
  seeds: string[];
  maxActions: number;
  runnerControllerMode: "current_candidate";
  corpControllerMode: "current_candidate";
  slotIds: string[];
};

export type AiBehaviorBaselineGate = {
  accepted: boolean;
  hardFailures: string[];
};

export type AiBehaviorBaselineResult = {
  version: typeof AI_BEHAVIOR_BASELINE_VERSION;
  diagnosticOnly: true;
  generatedAt: string;
  gitHead: string;
  config: AiBehaviorBaselineConfig;
  slots: AiBehaviorBaselineSlotResult[];
  aggregate: AiBehaviorBaselineMetrics;
  gate: AiBehaviorBaselineGate;
};

export type AiBehaviorBaselineComparison = {
  comparable: boolean;
  incompatibilities: string[];
  baselineGitHead: string;
  candidateGitHead: string;
  aggregateDelta?: Record<
    | "missedScoreWindowRate"
    | "advancedRemoteContestSkipRate"
    | "planConversionRate"
    | "strategicNoProgressRatePer100Decisions"
    | "clearlyDominatedPlanChoiceRatePer100Decisions"
    | "findingRatePer100Decisions"
    | "averageActions",
    number | null
  >;
};

export function createAiBehaviorBaselineSlotResult(
  input: AiBehaviorBaselineSlotInput,
): AiBehaviorBaselineSlotResult {
  return {
    ...input.descriptor,
    metrics: createMetrics(input),
    games: input.games,
  };
}

export function createAiBehaviorBaseline(input: {
  generatedAt: string;
  gitHead: string;
  config: AiBehaviorBaselineConfig;
  slots: AiBehaviorBaselineSlotResult[];
}): AiBehaviorBaselineResult {
  const aggregate = combineMetrics(input.slots.map((slot) => slot.metrics));
  return {
    version: AI_BEHAVIOR_BASELINE_VERSION,
    diagnosticOnly: true,
    generatedAt: input.generatedAt,
    gitHead: input.gitHead,
    config: input.config,
    slots: input.slots,
    aggregate,
    gate: evaluateAiBehaviorBaselineGate(aggregate),
  };
}

export function evaluateAiBehaviorBaselineGate(
  metrics: AiBehaviorBaselineMetrics,
): AiBehaviorBaselineGate {
  const hardFailures = [
    ...(metrics.illegalActions > 0
      ? [`illegal_actions:${metrics.illegalActions}`]
      : []),
    ...(metrics.replayFailures > 0
      ? [`replay_failures:${metrics.replayFailures}`]
      : []),
    ...(metrics.actionLimitGames > 0
      ? [`action_limit_games:${metrics.actionLimitGames}`]
      : []),
    ...(metrics.unclassifiedActionLimitGames > 0
      ? [
          `unclassified_action_limit_games:${metrics.unclassifiedActionLimitGames}`,
        ]
      : []),
    ...(metrics.fallbackActions > 0
      ? [`fallback_actions:${metrics.fallbackActions}`]
      : []),
    ...(metrics.timeoutActions > 0
      ? [`timeout_actions:${metrics.timeoutActions}`]
      : []),
    ...(metrics.runtimeErrors > 0
      ? [`runtime_errors:${metrics.runtimeErrors}`]
      : []),
    ...(metrics.unclassifiedRuntimeFailures > 0
      ? [`unclassified_runtime_failures:${metrics.unclassifiedRuntimeFailures}`]
      : []),
    ...metrics.repeatedRuntimeFailureOwners.map(
      (owner) =>
        `repeated_runtime_failure_owner:${owner}:${metrics.runtimeFailureOwnerCounts[owner] ?? 0}`,
    ),
    ...(metrics.runnerPrematureEndTurnsWithClicks > 0
      ? [
          `premature_runner_end_turns_with_clicks:${metrics.runnerPrematureEndTurnsWithClicks}`,
        ]
      : []),
    ...(metrics.runnerRedundantPersistentInstallSelections > 0
      ? [
          `redundant_low_value_runner_persistent_installs:${metrics.runnerRedundantPersistentInstallSelections}`,
        ]
      : []),
    ...(metrics.hiddenInfoFindings > 0
      ? [`hidden_info_findings:${metrics.hiddenInfoFindings}`]
      : []),
    ...(metrics.noLegalActionFailures > 0
      ? [`no_legal_action_failures:${metrics.noLegalActionFailures}`]
      : []),
    ...(!metrics.redactionSafe ? ["redaction_safe:false"] : []),
  ];
  return { accepted: hardFailures.length === 0, hardFailures };
}

export function compareAiBehaviorBaselines(
  baseline: AiBehaviorBaselineResult,
  candidate: AiBehaviorBaselineResult,
): AiBehaviorBaselineComparison {
  const incompatibilities = baselineCompatibilityIssues(baseline, candidate);
  if (incompatibilities.length > 0) {
    return {
      comparable: false,
      incompatibilities,
      baselineGitHead: baseline.gitHead,
      candidateGitHead: candidate.gitHead,
    };
  }
  return {
    comparable: true,
    incompatibilities: [],
    baselineGitHead: baseline.gitHead,
    candidateGitHead: candidate.gitHead,
    aggregateDelta: {
      missedScoreWindowRate: difference(
        candidate.aggregate.missedScoreWindowRate,
        baseline.aggregate.missedScoreWindowRate,
      ),
      advancedRemoteContestSkipRate: difference(
        candidate.aggregate.advancedRemoteContestSkipRate,
        baseline.aggregate.advancedRemoteContestSkipRate,
      ),
      planConversionRate: difference(
        candidate.aggregate.planConversionRate,
        baseline.aggregate.planConversionRate,
      ),
      strategicNoProgressRatePer100Decisions: round(
        candidate.aggregate.strategicNoProgressRatePer100Decisions -
          baseline.aggregate.strategicNoProgressRatePer100Decisions,
      ),
      clearlyDominatedPlanChoiceRatePer100Decisions: round(
        candidate.aggregate.clearlyDominatedPlanChoiceRatePer100Decisions -
          baseline.aggregate.clearlyDominatedPlanChoiceRatePer100Decisions,
      ),
      findingRatePer100Decisions: round(
        candidate.aggregate.findingRatePer100Decisions -
          baseline.aggregate.findingRatePer100Decisions,
      ),
      averageActions: round(
        candidate.aggregate.averageActions - baseline.aggregate.averageActions,
      ),
    },
  };
}

export function formatAiBehaviorBaselineReport(
  result: AiBehaviorBaselineResult,
  comparison?: AiBehaviorBaselineComparison,
): string {
  const metrics = result.aggregate;
  const metricRows = [
    ["Missed score window rate", formatRate(metrics.missedScoreWindowRate)],
    [
      "Advanced remote contest skip rate",
      formatRate(metrics.advancedRemoteContestSkipRate),
    ],
    ["Plan conversion rate", formatRate(metrics.planConversionRate)],
    [
      "Strategic no-progress repeats / 100 decisions",
      metrics.strategicNoProgressRatePer100Decisions,
    ],
    [
      "Clearly dominated plan choices / 100 decisions",
      metrics.clearlyDominatedPlanChoiceRatePer100Decisions,
    ],
    ["Trace findings / 100 decisions", metrics.findingRatePer100Decisions],
    ["Action-capacity use rate", formatRate(metrics.actionCapacityUseRate)],
    [
      "Action-capacity plan conversion rate",
      formatRate(metrics.actionCapacityPlanConversionRate),
    ],
    [
      "Action-capacity expiration rate",
      formatRate(metrics.actionCapacityExpirationRate),
    ],
    [
      "Action-capacity misconversion rate",
      formatRate(metrics.actionCapacityMisconversionRate),
    ],
    [
      "Premature Runner end turns / 100 decisions",
      metrics.runnerPrematureEndTurnRatePer100Decisions,
    ],
    [
      "Redundant low-value Runner persistent install rate",
      formatRate(metrics.runnerRedundantPersistentInstallRate),
    ],
  ];
  const hardRows = [
    ["illegalActions", metrics.illegalActions],
    ["replayFailures", metrics.replayFailures],
    ["actionLimitGames", metrics.actionLimitGames],
    ["fallbackActions", metrics.fallbackActions],
    ["timeoutActions", metrics.timeoutActions],
    ["runtimeErrors", metrics.runtimeErrors],
    ["classifiedRuntimeFailures", metrics.classifiedRuntimeFailures],
    ["unclassifiedRuntimeFailures", metrics.unclassifiedRuntimeFailures],
    ["classifiedActionLimitGames", metrics.classifiedActionLimitGames],
    ["unclassifiedActionLimitGames", metrics.unclassifiedActionLimitGames],
    ["hiddenInfoFindings", metrics.hiddenInfoFindings],
    ["noLegalActionFailures", metrics.noLegalActionFailures],
    ["redactionSafe", metrics.redactionSafe ? "yes" : "no"],
  ];
  const slotRows = result.slots.map((slot) => {
    const slotMetrics = slot.metrics;
    return `| ${slot.slotId} | ${slot.runnerArchetype} | ${slot.corpArchetype} | ${slotMetrics.games} | ${slotMetrics.decisions} | ${formatRate(slotMetrics.missedScoreWindowRate)} | ${formatRate(slotMetrics.advancedRemoteContestSkipRate)} | ${formatRate(slotMetrics.planConversionRate)} | ${slotMetrics.strategicNoProgressRatePer100Decisions} | ${slotMetrics.clearlyDominatedPlanChoiceRatePer100Decisions} | ${slotMetrics.actionLimitGames} |`;
  });
  const comparisonRows = comparison?.comparable
    ? Object.entries(comparison.aggregateDelta ?? {}).map(
        ([metric, delta]) => `| ${metric} | ${formatDelta(delta)} |`,
      )
    : [];
  const runtimeFailureCodeRows = countRecordRows(
    metrics.runtimeFailureCodeCounts,
  );
  const runtimeFailureOwnerRows = countRecordRows(
    metrics.runtimeFailureOwnerCounts,
  );
  const actionLimitRows = result.slots.flatMap((slot) =>
    slot.games.flatMap((game) => {
      const diagnosis = game.actionLimitDiagnosis;
      if (!diagnosis) return [];
      return [
        `| ${slot.slotId} | ${game.seed} | ${diagnosis.classified ? "yes" : "no"} | ${diagnosis.owner} | ${diagnosis.planInstanceId} | ${diagnosis.stepId} | ${diagnosis.noProgressCluster} | ${diagnosis.noProgressSubcluster} |`,
      ];
    }),
  );
  return [
    "# AI Behavior Baseline v1",
    "",
    `Status: ${result.gate.accepted ? "complete" : "attention_required"}`,
    `Git head: ${result.gitHead}`,
    `Generated: ${result.generatedAt}`,
    "",
    "## Contract",
    "",
    `- Slots: ${result.config.slotIds.join(", ")}`,
    `- Seeds: ${result.config.seeds.join(", ")}`,
    `- Games: ${metrics.games}`,
    `- Max actions: ${result.config.maxActions}`,
    "- Controllers: Runner and Corp both current_candidate.",
    "- This report is diagnostic-only. Hard technical failures are automatic gates; behavioural deltas remain review evidence until thresholds are calibrated from repeated runs.",
    "",
    "## Hard gates",
    "",
    `Accepted: ${result.gate.accepted ? "yes" : "no"}`,
    `Hard failures: ${result.gate.hardFailures.length > 0 ? result.gate.hardFailures.join(", ") : "none"}`,
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    ...hardRows.map(([metric, value]) => `| ${metric} | ${value} |`),
    "",
    "### Runtime failure classifications",
    "",
    "| Code | Count |",
    "| --- | ---: |",
    ...(runtimeFailureCodeRows.length > 0
      ? runtimeFailureCodeRows
      : ["| none | 0 |"]),
    "",
    "| Owner | Count |",
    "| --- | ---: |",
    ...(runtimeFailureOwnerRows.length > 0
      ? runtimeFailureOwnerRows
      : ["| none | 0 |"]),
    "",
    "### Action-limit classifications",
    "",
    "| Slot | Seed | Classified | Last owner | Last plan | Last step | No-progress cluster | No-progress subcluster |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...(actionLimitRows.length > 0
      ? actionLimitRows
      : ["| none | none | yes | none | none | none | none | none |"]),
    "",
    "## Behavioural metrics",
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    ...metricRows.map(([metric, value]) => `| ${metric} | ${value} |`),
    "",
    "## Deck slots",
    "",
    "| Slot | Runner | Corp | Games | Decisions | Missed score rate | Remote contest skip rate | Plan conversion rate | No-progress / 100 | Dominated / 100 | Limits |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...slotRows,
    "",
    "## Outcome context",
    "",
    `- Runner agenda points: ${metrics.runnerAgendaPoints}`,
    `- Corp agenda points: ${metrics.corpAgendaPoints}`,
    `- Runner steals: ${metrics.runnerSteals}`,
    `- Corp scores: ${metrics.corpScores}`,
    `- Score or steal actions: ${metrics.scoreOrStealActions}`,
    `- Action-capacity opportunities: ${metrics.actionCapacityOpportunities}`,
    `- Action-capacity uses: ${metrics.actionCapacityUses}`,
    `- Action-capacity plan conversions: ${metrics.actionCapacityPlanConversions}`,
    `- Action-capacity follow-up conversions: ${metrics.actionCapacityFollowupConversions}`,
    `- Action-capacity expired uses: ${metrics.actionCapacityExpiredUses}`,
    `- Action-capacity misconversions: ${metrics.actionCapacityMisconversions}`,
    `- Runner end turns with clicks: ${metrics.runnerEndTurnsWithClicks}`,
    `- Deterministic Corp-deckout end turns with clicks: ${metrics.runnerInevitableCorpDeckoutEndTurnsWithClicks}`,
    `- Premature Runner end turns with clicks: ${metrics.runnerPrematureEndTurnsWithClicks}`,
    `- Runner persistent install selections: ${metrics.runnerPersistentInstallSelections}`,
    `- Redundant low-value Runner persistent install selections: ${metrics.runnerRedundantPersistentInstallSelections}`,
    `- Average actions: ${metrics.averageActions}`,
    `- Average turns: ${metrics.averageTurns}`,
    "",
    ...(comparison
      ? [
          "## Comparison",
          "",
          `Comparable: ${comparison.comparable ? "yes" : "no"}`,
          `Baseline git head: ${comparison.baselineGitHead}`,
          `Candidate git head: ${comparison.candidateGitHead}`,
          `Incompatibilities: ${comparison.incompatibilities.length > 0 ? comparison.incompatibilities.join(", ") : "none"}`,
          ...(comparison.comparable
            ? [
                "",
                "| Metric | Candidate minus baseline |",
                "| --- | ---: |",
                ...comparisonRows,
              ]
            : []),
          "",
        ]
      : [
          "## Comparison",
          "",
          "No prior baseline was supplied. This result is the frozen v1 reference for future paired runs.",
          "",
        ]),
    "## Metric interpretation",
    "",
    "- Missed score windows are direct Corp conversion misses.",
    "- Remote contest skips are normalised by detected affordable advanced-remote opportunities and remain a diagnostic signal, not a standalone failure.",
    "- Plan conversion uses plans settled by conversion, expiry, or abandonment; no-progress and dominated-choice rates are independent review signals.",
    "- Premature Runner end turns exclude zero-click turns, decisions without an actionable legal alternative, and the explicit deterministic Corp-deckout closeout.",
    "- Redundant low-value persistent installs require structured persistent-install evaluation, `redundant_duplicate` classification, and negative final fit. Useful backups and other positively valued second copies remain permitted.",
    "- Win rate is deliberately outcome context rather than the acceptance criterion.",
  ].join("\n");
}

function createMetrics(
  input: AiBehaviorBaselineSlotInput,
): AiBehaviorBaselineMetrics {
  const progression = input.progression;
  const settledPlanIntents =
    progression.planIntentConvertedWithin3OwnDecisions +
    progression.planIntentExpired +
    progression.planIntentAbandoned;
  const clearlyDominatedPlanChoices =
    input.findingsByDetector.clearly_dominated_plan_choice ?? 0;
  const hiddenInfoFindings = input.findingsByDetector.hidden_info_marker ?? 0;
  const noLegalActionFailures =
    input.findingsByDetector.no_legal_action_failure ?? 0;
  const actionCapacity = input.actionCapacity ?? {
    actionCapacityOpportunities: 0,
    actionCapacityUses: 0,
    actionCapacityPlanConversions: 0,
    actionCapacityFollowupConversions: 0,
    actionCapacityExpiredUses: 0,
    actionCapacityMisconversions: 0,
  };
  const runnerActionValuation = input.runnerActionValuation ?? {
    runnerEndTurnsWithClicks: 0,
    runnerInevitableCorpDeckoutEndTurnsWithClicks: 0,
    runnerPrematureEndTurnsWithClicks: 0,
    runnerPersistentInstallSelections: 0,
    runnerRedundantPersistentInstallSelections: 0,
  };
  const runtimeFailureEvidence = summarizeRuntimeFailureEvidence(input.games);
  const actionLimitEvidence = summarizeActionLimitEvidence(input.games);
  return {
    games: progression.games,
    decisions: input.decisions,
    averageActions: progression.averageActions,
    averageTurns: progression.averageTurns,
    runnerAgendaPoints: progression.runnerAgendaPoints,
    corpAgendaPoints: progression.corpAgendaPoints,
    runnerSteals: progression.runnerSteals,
    corpScores: progression.corpScores,
    scoreOrStealActions: progression.scoreOrStealActions,
    scoreOpportunities: progression.scoreActionsAvailable,
    missedScoreWindows: progression.missedScoreWindows,
    missedScoreWindowRate: rate(
      progression.missedScoreWindows,
      progression.scoreActionsAvailable,
    ),
    advancedRemoteContestOpportunities:
      progression.remoteRunOpportunitiesAgainstAdvancedRemote,
    advancedRemoteContestsTaken: progression.remoteRunsAgainstAdvancedRemote,
    skippedAdvancedRemoteContests: progression.skippedAdvancedRemoteContest,
    advancedRemoteContestSkipRate: rate(
      progression.skippedAdvancedRemoteContest,
      progression.remoteRunOpportunitiesAgainstAdvancedRemote,
    ),
    settledPlanIntents,
    planIntentsConvertedWithin3:
      progression.planIntentConvertedWithin3OwnDecisions,
    expiredPlanIntents: progression.planIntentExpired,
    abandonedPlanIntents: progression.planIntentAbandoned,
    planConversionRate: rate(
      progression.planIntentConvertedWithin3OwnDecisions,
      settledPlanIntents,
    ),
    strategicNoProgressRepeats:
      progression.sameStrategicPlanRepeatedWithoutProgress,
    strategicNoProgressRatePer100Decisions: per100(
      progression.sameStrategicPlanRepeatedWithoutProgress,
      input.decisions,
    ),
    clearlyDominatedPlanChoices,
    clearlyDominatedPlanChoiceRatePer100Decisions: per100(
      clearlyDominatedPlanChoices,
      input.decisions,
    ),
    ...actionCapacity,
    actionCapacityUseRate: rate(
      actionCapacity.actionCapacityUses,
      actionCapacity.actionCapacityOpportunities,
    ),
    actionCapacityPlanConversionRate: rate(
      actionCapacity.actionCapacityPlanConversions,
      actionCapacity.actionCapacityUses,
    ),
    actionCapacityExpirationRate: rate(
      actionCapacity.actionCapacityExpiredUses,
      actionCapacity.actionCapacityUses,
    ),
    actionCapacityMisconversionRate: rate(
      actionCapacity.actionCapacityMisconversions,
      actionCapacity.actionCapacityUses,
    ),
    ...runnerActionValuation,
    runnerPrematureEndTurnRatePer100Decisions: per100(
      runnerActionValuation.runnerPrematureEndTurnsWithClicks,
      input.decisions,
    ),
    runnerRedundantPersistentInstallRate: rate(
      runnerActionValuation.runnerRedundantPersistentInstallSelections,
      runnerActionValuation.runnerPersistentInstallSelections,
    ),
    findings: input.findings,
    findingRatePer100Decisions: per100(input.findings, input.decisions),
    illegalActions: input.illegalActions,
    replayFailures: input.replayFailures,
    actionLimitGames: input.actionLimitGames,
    fallbackActions: input.fallbackActions,
    timeoutActions: input.timeoutActions,
    runtimeErrors: input.runtimeErrors,
    ...runtimeFailureEvidence,
    ...actionLimitEvidence,
    hiddenInfoFindings,
    noLegalActionFailures,
    redactionSafe: input.redactionSafe,
  };
}

function combineMetrics(
  metrics: AiBehaviorBaselineMetrics[],
): AiBehaviorBaselineMetrics {
  const summed = {
    games: sum(metrics, "games"),
    decisions: sum(metrics, "decisions"),
    runnerAgendaPoints: sum(metrics, "runnerAgendaPoints"),
    corpAgendaPoints: sum(metrics, "corpAgendaPoints"),
    runnerSteals: sum(metrics, "runnerSteals"),
    corpScores: sum(metrics, "corpScores"),
    scoreOrStealActions: sum(metrics, "scoreOrStealActions"),
    scoreOpportunities: sum(metrics, "scoreOpportunities"),
    missedScoreWindows: sum(metrics, "missedScoreWindows"),
    advancedRemoteContestOpportunities: sum(
      metrics,
      "advancedRemoteContestOpportunities",
    ),
    advancedRemoteContestsTaken: sum(metrics, "advancedRemoteContestsTaken"),
    skippedAdvancedRemoteContests: sum(
      metrics,
      "skippedAdvancedRemoteContests",
    ),
    settledPlanIntents: sum(metrics, "settledPlanIntents"),
    planIntentsConvertedWithin3: sum(metrics, "planIntentsConvertedWithin3"),
    expiredPlanIntents: sum(metrics, "expiredPlanIntents"),
    abandonedPlanIntents: sum(metrics, "abandonedPlanIntents"),
    strategicNoProgressRepeats: sum(metrics, "strategicNoProgressRepeats"),
    clearlyDominatedPlanChoices: sum(metrics, "clearlyDominatedPlanChoices"),
    actionCapacityOpportunities: sum(metrics, "actionCapacityOpportunities"),
    actionCapacityUses: sum(metrics, "actionCapacityUses"),
    actionCapacityPlanConversions: sum(
      metrics,
      "actionCapacityPlanConversions",
    ),
    actionCapacityFollowupConversions: sum(
      metrics,
      "actionCapacityFollowupConversions",
    ),
    actionCapacityExpiredUses: sum(metrics, "actionCapacityExpiredUses"),
    actionCapacityMisconversions: sum(metrics, "actionCapacityMisconversions"),
    runnerEndTurnsWithClicks: sum(metrics, "runnerEndTurnsWithClicks"),
    runnerInevitableCorpDeckoutEndTurnsWithClicks: sum(
      metrics,
      "runnerInevitableCorpDeckoutEndTurnsWithClicks",
    ),
    runnerPrematureEndTurnsWithClicks: sum(
      metrics,
      "runnerPrematureEndTurnsWithClicks",
    ),
    runnerPersistentInstallSelections: sum(
      metrics,
      "runnerPersistentInstallSelections",
    ),
    runnerRedundantPersistentInstallSelections: sum(
      metrics,
      "runnerRedundantPersistentInstallSelections",
    ),
    findings: sum(metrics, "findings"),
    illegalActions: sum(metrics, "illegalActions"),
    replayFailures: sum(metrics, "replayFailures"),
    actionLimitGames: sum(metrics, "actionLimitGames"),
    fallbackActions: sum(metrics, "fallbackActions"),
    timeoutActions: sum(metrics, "timeoutActions"),
    runtimeErrors: sum(metrics, "runtimeErrors"),
    classifiedRuntimeFailures: sum(metrics, "classifiedRuntimeFailures"),
    unclassifiedRuntimeFailures: sum(metrics, "unclassifiedRuntimeFailures"),
    classifiedActionLimitGames: sum(metrics, "classifiedActionLimitGames"),
    unclassifiedActionLimitGames: sum(metrics, "unclassifiedActionLimitGames"),
    hiddenInfoFindings: sum(metrics, "hiddenInfoFindings"),
    noLegalActionFailures: sum(metrics, "noLegalActionFailures"),
  };
  const runtimeFailureCodeCounts = combineCountRecords(
    metrics.map((entry) => entry.runtimeFailureCodeCounts),
  );
  const runtimeFailureOwnerCounts = combineCountRecords(
    metrics.map((entry) => entry.runtimeFailureOwnerCounts),
  );
  return {
    ...summed,
    runtimeFailureCodeCounts,
    runtimeFailureOwnerCounts,
    repeatedRuntimeFailureOwners: repeatedRuntimeFailureOwners(
      runtimeFailureOwnerCounts,
    ),
    averageActions: weightedAverage(metrics, "averageActions"),
    averageTurns: weightedAverage(metrics, "averageTurns"),
    missedScoreWindowRate: rate(
      summed.missedScoreWindows,
      summed.scoreOpportunities,
    ),
    advancedRemoteContestSkipRate: rate(
      summed.skippedAdvancedRemoteContests,
      summed.advancedRemoteContestOpportunities,
    ),
    planConversionRate: rate(
      summed.planIntentsConvertedWithin3,
      summed.settledPlanIntents,
    ),
    strategicNoProgressRatePer100Decisions: per100(
      summed.strategicNoProgressRepeats,
      summed.decisions,
    ),
    clearlyDominatedPlanChoiceRatePer100Decisions: per100(
      summed.clearlyDominatedPlanChoices,
      summed.decisions,
    ),
    actionCapacityUseRate: rate(
      summed.actionCapacityUses,
      summed.actionCapacityOpportunities,
    ),
    actionCapacityPlanConversionRate: rate(
      summed.actionCapacityPlanConversions,
      summed.actionCapacityUses,
    ),
    actionCapacityExpirationRate: rate(
      summed.actionCapacityExpiredUses,
      summed.actionCapacityUses,
    ),
    actionCapacityMisconversionRate: rate(
      summed.actionCapacityMisconversions,
      summed.actionCapacityUses,
    ),
    runnerPrematureEndTurnRatePer100Decisions: per100(
      summed.runnerPrematureEndTurnsWithClicks,
      summed.decisions,
    ),
    runnerRedundantPersistentInstallRate: rate(
      summed.runnerRedundantPersistentInstallSelections,
      summed.runnerPersistentInstallSelections,
    ),
    findingRatePer100Decisions: per100(summed.findings, summed.decisions),
    redactionSafe: metrics.every((entry) => entry.redactionSafe),
  };
}

function summarizeRuntimeFailureEvidence(
  games: readonly AiBehaviorBaselineGame[],
): Pick<
  AiBehaviorBaselineMetrics,
  | "classifiedRuntimeFailures"
  | "unclassifiedRuntimeFailures"
  | "runtimeFailureCodeCounts"
  | "runtimeFailureOwnerCounts"
  | "repeatedRuntimeFailureOwners"
> {
  const runtimeFailureCodeCounts: Record<string, number> = {};
  const runtimeFailureOwnerCounts: Record<string, number> = {};
  let classifiedRuntimeFailures = 0;
  let unclassifiedRuntimeFailures = 0;
  for (const game of games) {
    const runtimeFailures = game.runtimeFailures ?? [];
    for (const failure of runtimeFailures) {
      incrementCount(runtimeFailureCodeCounts, failure.code);
      if (failure.classified && failure.owner) {
        classifiedRuntimeFailures += 1;
        incrementCount(runtimeFailureOwnerCounts, failure.owner);
      } else {
        unclassifiedRuntimeFailures += 1;
      }
    }
    const unclassifiedRemainder = Math.max(
      0,
      game.errorCount - runtimeFailures.length,
    );
    unclassifiedRuntimeFailures += unclassifiedRemainder;
    if (unclassifiedRemainder > 0) {
      incrementCount(
        runtimeFailureCodeCounts,
        "unclassified_runtime_failure",
        unclassifiedRemainder,
      );
    }
  }
  return {
    classifiedRuntimeFailures,
    unclassifiedRuntimeFailures,
    runtimeFailureCodeCounts,
    runtimeFailureOwnerCounts,
    repeatedRuntimeFailureOwners: repeatedRuntimeFailureOwners(
      runtimeFailureOwnerCounts,
    ),
  };
}

function summarizeActionLimitEvidence(
  games: readonly AiBehaviorBaselineGame[],
): Pick<
  AiBehaviorBaselineMetrics,
  "classifiedActionLimitGames" | "unclassifiedActionLimitGames"
> {
  let classifiedActionLimitGames = 0;
  let unclassifiedActionLimitGames = 0;
  for (const game of games) {
    if (game.terminationKind !== "action_limit") continue;
    if (game.actionLimitDiagnosis?.classified === true) {
      classifiedActionLimitGames += 1;
    } else {
      unclassifiedActionLimitGames += 1;
    }
  }
  return { classifiedActionLimitGames, unclassifiedActionLimitGames };
}

function combineCountRecords(
  records: readonly Record<string, number>[],
): Record<string, number> {
  const combined: Record<string, number> = {};
  for (const record of records) {
    for (const [key, count] of Object.entries(record)) {
      if (count > 0) incrementCount(combined, key, count);
    }
  }
  return Object.fromEntries(
    Object.entries(combined).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

function repeatedRuntimeFailureOwners(
  counts: Readonly<Record<string, number>>,
): string[] {
  return Object.entries(counts)
    .filter(([, count]) => count > 1)
    .map(([owner]) => owner)
    .sort();
}

function incrementCount(
  counts: Record<string, number>,
  key: string,
  amount = 1,
): void {
  counts[key] = (counts[key] ?? 0) + amount;
}

function countRecordRows(counts: Readonly<Record<string, number>>): string[] {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, count]) => `| ${key} | ${count} |`);
}

function baselineCompatibilityIssues(
  baseline: AiBehaviorBaselineResult,
  candidate: AiBehaviorBaselineResult,
): string[] {
  const issues = [
    ...(baseline.version !== candidate.version
      ? [`version:${baseline.version}->${candidate.version}`]
      : []),
    ...(baseline.config.maxActions !== candidate.config.maxActions
      ? [
          `max_actions:${baseline.config.maxActions}->${candidate.config.maxActions}`,
        ]
      : []),
    ...(!sameValues(baseline.config.seeds, candidate.config.seeds)
      ? ["seeds"]
      : []),
    ...(!sameValues(baseline.config.slotIds, candidate.config.slotIds)
      ? ["slot_ids"]
      : []),
  ];
  const baselineSlots = new Map(
    baseline.slots.map((slot) => [slot.slotId, slot]),
  );
  for (const slot of candidate.slots) {
    const expected = baselineSlots.get(slot.slotId);
    if (!expected) continue;
    if (expected.runnerDeckFingerprint !== slot.runnerDeckFingerprint)
      issues.push(`runner_deck:${slot.slotId}`);
    if (expected.corpDeckFingerprint !== slot.corpDeckFingerprint)
      issues.push(`corp_deck:${slot.slotId}`);
  }
  return [...new Set(issues)].sort();
}

function sum<Key extends keyof AiBehaviorBaselineMetrics>(
  values: AiBehaviorBaselineMetrics[],
  key: Key,
): number {
  return values.reduce((total, entry) => {
    const value = entry[key];
    return total + (typeof value === "number" ? value : 0);
  }, 0);
}

function weightedAverage(
  values: AiBehaviorBaselineMetrics[],
  key: "averageActions" | "averageTurns",
): number {
  const games = sum(values, "games");
  if (games === 0) return 0;
  return round(
    values.reduce((total, entry) => total + entry[key] * entry.games, 0) /
      games,
  );
}

function rate(numerator: number, denominator: number): number | null {
  return denominator > 0 ? round(numerator / denominator) : null;
}

function per100(numerator: number, denominator: number): number {
  return denominator > 0 ? round((numerator * 100) / denominator) : 0;
}

function difference(
  candidate: number | null,
  baseline: number | null,
): number | null {
  if (candidate === null || baseline === null) return null;
  return round(candidate - baseline);
}

function sameValues(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function formatRate(value: number | null): string {
  return value === null ? "n/a" : value.toFixed(3);
}

function formatDelta(value: number | null): string {
  if (value === null) return "n/a";
  return value > 0 ? `+${value}` : String(value);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
