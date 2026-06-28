import type { AiDecisionActionAlternative, LegalAction, Side } from "@netgrid/shared";
import { FORBIDDEN_AI_INPUT_FIELDS } from "../runtime/ai-decision-input";
import type {
  AiSimulationConfig,
  AiSimulationSummary,
  SimulationControllerMode,
} from "../index";

export type AiSelfplayTraceMiningDetectorId =
  | "illegal_action"
  | "replay_failure"
  | "hidden_info_marker"
  | "no_legal_action_failure"
  | "action_limit_reached"
  | "repeated_no_progress_run"
  | "repeated_known_no_payoff_remote"
  | "repeated_low_value_archives"
  | "recovery_low_value_loop"
  | "bank_over_target_without_funding_need"
  | "risky_self_damage_action"
  | "blink_low_hand_buffer_run"
  | "duplicate_low_delta_install"
  | "overdraw_without_urgency"
  | "plan_step_action_mismatch"
  | "semantic_override_suspicious"
  | "corp_never_scores_long_game"
  | "runner_never_accesses_long_game";

export type AiSelfplaySuspicionSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type AiSelfplayActionLimitClusterId =
  | "action_limit_runner_repeated_no_progress_run"
  | "action_limit_runner_remote_contest_blocked"
  | "action_limit_corp_scoreline_stall"
  | "action_limit_setup_economy_loop"
  | "action_limit_low_value_repeat"
  | "action_limit_mixed_or_unknown";

export type AiSelfplayActionLimitSubclusterId =
  | "late_gain_credit_without_funding_need"
  | "runner_late_gain_credit_without_funding_need"
  | "runner_late_gain_credit_real_reserve"
  | "runner_late_gain_credit_no_safe_alternative"
  | "corp_late_gain_credit_without_rez_score_protection_need"
  | "corp_late_gain_credit_real_rez_or_protection_reserve"
  | "corp_late_gain_credit_no_safe_alternative"
  | "late_draw_for_coverage_or_hand_goal"
  | "late_draw_without_coverage_or_hand_goal"
  | "late_ability_reuse_low_delta"
  | "late_install_low_delta"
  | "late_run_step_stall"
  | "run_microstep_required"
  | "continue_chain_to_access"
  | "break_pump_required"
  | "jackout_loop"
  | "continue_without_progress"
  | "access_pending"
  | "breach_pending"
  | "mixed_unknown";

export type AiSelfplaySuspiciousDecision = {
  matchId: string;
  seed: string;
  summaryIndex: number;
  actionIndex: number;
  side: Side | "unknown";
  stateVersion: number;
  selectedActionId: string;
  selectedActionType: LegalAction["type"] | "none";
  planKind?: string;
  detectorIds: AiSelfplayTraceMiningDetectorId[];
  severity: AiSelfplaySuspicionSeverity;
  shortReason: string;
  relevantDebugFacts: string[];
  suggestedFixtureName: string;
  replaySafeReference: {
    seed: string;
    stateVersion: number;
    fromActionIndex: number;
    toActionIndex: number;
  };
};

export type AiSelfplayDecisionPointActionAlternative = {
  rank: number;
  actionId: string;
  actionType: string;
  selected: boolean;
  excluded?: boolean;
  priority?: number;
  label?: string;
  source?: string;
  whyChosen: string[];
  whyNot: string[];
};

export type AiSelfplayDecisionPoint = {
  matchId: string;
  seed: string;
  summaryIndex: number;
  actionIndex: number;
  side: Side;
  stateVersion: number;
  selectedActionId: string;
  selectedActionType: LegalAction["type"];
  planKind?: string;
  targetServerId?: string;
  reasonCode: string;
  redactionSafe: boolean;
  replaySafeReference: {
    seed: string;
    stateVersion: number;
    fromActionIndex: number;
    toActionIndex: number;
  };
  facts: string[];
  actionAlternatives: AiSelfplayDecisionPointActionAlternative[];
};

export type AiSelfplayTraceMiningDetectorOptions = {
  detectorIds?: AiSelfplayTraceMiningDetectorId[];
  maxFindings?: number;
  longGameActionThreshold?: number;
};

export type AiSelfplayTraceMiningConfig = Partial<AiSimulationConfig> &
  AiSelfplayTraceMiningDetectorOptions & {
    seeds?: string[];
  };

export type AiSelfplayTraceMiningResult = {
  version: "ai-selfplay-trace-mining-v1";
  diagnosticOnly: true;
  noTraining: true;
  noAutofix: true;
  config: {
    seeds: string[];
    maxActions: number;
    runnerDeckId: string;
    corpDeckId: string;
    runnerControllerMode: SimulationControllerMode;
    corpControllerMode: SimulationControllerMode;
    enabledDetectors: AiSelfplayTraceMiningDetectorId[];
    includeActionAlternativesForFindings: boolean;
    maxAlternativesPerFinding: number;
  };
  summaries: AiSimulationSummary[];
  findings: AiSelfplaySuspiciousDecision[];
  topFindings: AiSelfplaySuspiciousDecision[];
  aggregate: {
    games: number;
    decisions: number;
    findings: number;
    findingsBySeverity: Record<AiSelfplaySuspicionSeverity, number>;
    findingsByDetector: Record<AiSelfplayTraceMiningDetectorId, number>;
    illegalActions: number;
    replayFailures: number;
    actionLimitReached: number;
    allRedactionSafe: boolean;
    redactionSafe: boolean;
    averageGameLength: number;
    corpAgendaScores: number;
    runnerAgendaSteals: number;
    corpFlatlines: number;
    scoreWindowMissed: number;
    unsafeScoreChosen: number;
    passiveActionWithScoreLineAvailable: number;
    actionLimitClusters: Record<AiSelfplayActionLimitClusterId, number>;
    actionLimitSubclusters: Record<AiSelfplayActionLimitSubclusterId, number>;
  };
};

export const SELFPLAY_ACTION_LIMIT_CLUSTER_IDS: AiSelfplayActionLimitClusterId[] =
  [
    "action_limit_runner_repeated_no_progress_run",
    "action_limit_runner_remote_contest_blocked",
    "action_limit_corp_scoreline_stall",
    "action_limit_setup_economy_loop",
    "action_limit_low_value_repeat",
    "action_limit_mixed_or_unknown",
  ];

export const SELFPLAY_ACTION_LIMIT_SUBCLUSTER_IDS: AiSelfplayActionLimitSubclusterId[] =
  [
    "late_gain_credit_without_funding_need",
    "runner_late_gain_credit_without_funding_need",
    "runner_late_gain_credit_real_reserve",
    "runner_late_gain_credit_no_safe_alternative",
    "corp_late_gain_credit_without_rez_score_protection_need",
    "corp_late_gain_credit_real_rez_or_protection_reserve",
    "corp_late_gain_credit_no_safe_alternative",
    "late_draw_for_coverage_or_hand_goal",
    "late_draw_without_coverage_or_hand_goal",
    "late_ability_reuse_low_delta",
    "late_install_low_delta",
    "late_run_step_stall",
    "run_microstep_required",
    "continue_chain_to_access",
    "break_pump_required",
    "jackout_loop",
    "continue_without_progress",
    "access_pending",
    "breach_pending",
    "mixed_unknown",
  ];

export const DEFAULT_SELFPLAY_TRACE_MINING_DETECTORS: AiSelfplayTraceMiningDetectorId[] =
  [
    "illegal_action",
    "replay_failure",
    "hidden_info_marker",
    "no_legal_action_failure",
    "action_limit_reached",
    "repeated_no_progress_run",
    "repeated_known_no_payoff_remote",
    "repeated_low_value_archives",
    "recovery_low_value_loop",
    "bank_over_target_without_funding_need",
    "risky_self_damage_action",
    "blink_low_hand_buffer_run",
    "duplicate_low_delta_install",
    "overdraw_without_urgency",
    "plan_step_action_mismatch",
    "semantic_override_suspicious",
    "corp_never_scores_long_game",
    "runner_never_accesses_long_game",
  ];

const SELFPLAY_SEVERITY_RANK: Record<AiSelfplaySuspicionSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function detectAiSelfplaySuspiciousDecisions(
  summaries: AiSimulationSummary[],
  options: AiSelfplayTraceMiningDetectorOptions = {},
): AiSelfplaySuspiciousDecision[] {
  const enabled = new Set(
    options.detectorIds && options.detectorIds.length > 0
      ? options.detectorIds
      : DEFAULT_SELFPLAY_TRACE_MINING_DETECTORS,
  );
  const longGameActionThreshold = options.longGameActionThreshold ?? 60;
  const findings = summaries.flatMap((summary, summaryIndex) =>
    collectSelfplayFindingsForSummary(
      summary,
      summaryIndex,
      enabled,
      longGameActionThreshold,
    ),
  );
  return sortSelfplayFindings(groupSelfplayFindings(findings));
}

export function extractAiSelfplayDecisionPoints(
  summaries: readonly AiSimulationSummary[],
): AiSelfplayDecisionPoint[] {
  return summaries.flatMap((summary, summaryIndex) =>
    summary.actionSequence.map((entry, actionIndex) => {
      const selectedActionId =
        entry.selectedActionId ??
        `${entry.actionType}:${entry.stateVersionBefore}`;
      const point: AiSelfplayDecisionPoint = {
        matchId: `selfplay:${summary.seed}`,
        seed: sanitizeSelfplayText(summary.seed) ?? "[redacted]",
        summaryIndex,
        actionIndex,
        side: entry.side,
        stateVersion: entry.stateVersionBefore,
        selectedActionId: sanitizeSelfplayText(selectedActionId) ?? "[redacted]",
        selectedActionType: entry.actionType,
        ...(entry.planKind
          ? { planKind: sanitizeSelfplayText(entry.planKind) ?? "[redacted]" }
          : {}),
        ...(entry.targetServerId
          ? {
              targetServerId:
                sanitizeSelfplayText(entry.targetServerId) ?? "[redacted]",
            }
          : {}),
        reasonCode: sanitizeSelfplayText(entry.reasonCode) ?? "[redacted]",
        redactionSafe: isSelfplayTraceRedactionSafe(entry),
        replaySafeReference: {
          seed: sanitizeSelfplayText(summary.seed) ?? "[redacted]",
          stateVersion: entry.stateVersionBefore,
          fromActionIndex: Math.max(0, actionIndex - 2),
          toActionIndex: Math.max(0, actionIndex + 1),
        },
        facts: safeSelfplayFacts([
          entry.explanation,
          ...(entry.evidence ?? []),
          ...(entry.debugFacts ?? []),
          ...(entry.qualityTags ?? []),
        ]).slice(0, 16),
        actionAlternatives: safeSelfplayActionAlternatives(
          entry.actionAlternatives ?? [],
        ),
      };
      return {
        ...point,
        redactionSafe: point.redactionSafe && isSelfplayTraceRedactionSafe(point),
      };
    }),
  );
}

export function sortedUniqueSelfplayDetectors(
  detectors: AiSelfplayTraceMiningDetectorId[],
): AiSelfplayTraceMiningDetectorId[] {
  return DEFAULT_SELFPLAY_TRACE_MINING_DETECTORS.filter((detector) =>
    detectors.includes(detector),
  );
}

export function countSelfplayFindingsBySeverity(
  findings: AiSelfplaySuspiciousDecision[],
): Record<AiSelfplaySuspicionSeverity, number> {
  const counts: Record<AiSelfplaySuspicionSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const finding of findings) counts[finding.severity] += 1;
  return counts;
}

export function countSelfplayFindingsByDetector(
  findings: AiSelfplaySuspiciousDecision[],
): Record<AiSelfplayTraceMiningDetectorId, number> {
  const counts = Object.fromEntries(
    DEFAULT_SELFPLAY_TRACE_MINING_DETECTORS.map((detector) => [detector, 0]),
  ) as Record<AiSelfplayTraceMiningDetectorId, number>;
  for (const finding of findings) {
    for (const detector of finding.detectorIds) counts[detector] += 1;
  }
  return counts;
}

export function summarizeSelfplayActionLimitClusters(
  summaries: readonly AiSimulationSummary[],
): Record<AiSelfplayActionLimitClusterId, number> {
  const counts = Object.fromEntries(
    SELFPLAY_ACTION_LIMIT_CLUSTER_IDS.map((cluster) => [cluster, 0]),
  ) as Record<AiSelfplayActionLimitClusterId, number>;
  for (const summary of summaries) {
    if (summary.winner !== "action_limit_reached" || summary.errors.length > 0)
      continue;
    counts[classifySelfplayActionLimitCluster(summary)] += 1;
  }
  return counts;
}

export function summarizeSelfplayActionLimitSubclusters(
  summaries: readonly AiSimulationSummary[],
): Record<AiSelfplayActionLimitSubclusterId, number> {
  const counts = Object.fromEntries(
    SELFPLAY_ACTION_LIMIT_SUBCLUSTER_IDS.map((subcluster) => [subcluster, 0]),
  ) as Record<AiSelfplayActionLimitSubclusterId, number>;
  for (const summary of summaries) {
    if (summary.winner !== "action_limit_reached" || summary.errors.length > 0)
      continue;
    counts[classifySelfplayActionLimitSubcluster(summary)] += 1;
  }
  return counts;
}

function classifySelfplayActionLimitCluster(
  summary: AiSimulationSummary,
): AiSelfplayActionLimitClusterId {
  const window = summary.actionSequence.slice(-30);
  const repeatedRuns = window.filter((entry, index) => {
    if (entry.side !== "runner" || entry.actionType !== "start_run")
      return false;
    const globalIndex = summary.actionSequence.length - window.length + index;
    const previous = previousRunnerRunOnSameServer(
      summary.actionSequence,
      globalIndex,
      entry,
    );
    return (
      previous !== undefined &&
      !hasMeaningfulProgressBetween(
        summary.actionSequence,
        previous + 1,
        globalIndex,
      )
    );
  }).length;
  const remoteContestBlocked = window.filter(
    (entry) =>
      entry.runnerSkippedAdvancedRemoteContest === true ||
      entry.runnerRemoteContestBlockedByCredits === true ||
      entry.runnerRemoteContestBlockedByPostRunReserve === true ||
      entry.runnerRemoteContestBlockedByBreakerCoverage === true ||
      entry.runnerRemoteContestBlockedByKnownIceCost === true ||
      entry.runnerCentralRunInsteadOfContestableAdvancedRemote === true,
  ).length;
  const corpScorelineStall = window.filter(
    (entry) =>
      entry.side === "corp" &&
      (entry.corpScoreTerminalSkipped === true ||
        ((entry.scoreActionsAvailable ?? 0) > 0 &&
          entry.actionType !== "score_agenda")),
  ).length;
  const setupEconomy = window.filter(actionLimitSetupOrEconomyEntry).length;
  const lowValueRepeat =
    window.filter(actionLimitLowValueRepeatEntry).length +
    countRepeatedActionReasonsWithoutProgress(window);

  const scored = (
    [
      {
        cluster: "action_limit_corp_scoreline_stall",
        score: corpScorelineStall * 3,
      },
      {
        cluster: "action_limit_runner_repeated_no_progress_run",
        score: repeatedRuns * 3,
      },
      {
        cluster: "action_limit_runner_remote_contest_blocked",
        score: remoteContestBlocked * 3,
      },
      {
        cluster: "action_limit_low_value_repeat",
        score: lowValueRepeat * 2,
      },
      {
        cluster: "action_limit_setup_economy_loop",
        score: setupEconomy,
      },
    ] satisfies Array<{
      cluster: AiSelfplayActionLimitClusterId;
      score: number;
    }>
  ).sort(
    (left, right) =>
      right.score - left.score || left.cluster.localeCompare(right.cluster),
  );
  const [best, second] = scored;
  if (!best || best.score <= 0) return "action_limit_mixed_or_unknown";
  if (second && second.score > 0 && best.score - second.score <= 2) {
    return "action_limit_mixed_or_unknown";
  }
  return best.cluster;
}

function classifySelfplayActionLimitSubcluster(
  summary: AiSimulationSummary,
): AiSelfplayActionLimitSubclusterId {
  const window = summary.actionSequence.slice(-40);
  const counts = Object.fromEntries(
    SELFPLAY_ACTION_LIMIT_SUBCLUSTER_IDS.map((subcluster) => [subcluster, 0]),
  ) as Record<AiSelfplayActionLimitSubclusterId, number>;
  const latestIndex = Object.fromEntries(
    SELFPLAY_ACTION_LIMIT_SUBCLUSTER_IDS.map((subcluster) => [subcluster, -1]),
  ) as Record<AiSelfplayActionLimitSubclusterId, number>;
  for (const [index, entry] of window.entries()) {
    const subcluster = classifySelfplayActionLimitSubclusterEntry(
      entry,
      window,
      index,
    );
    if (subcluster) {
      counts[subcluster] += 1;
      latestIndex[subcluster] = index;
    }
  }
  const ranked = SELFPLAY_ACTION_LIMIT_SUBCLUSTER_IDS.filter(
    (subcluster) => subcluster !== "mixed_unknown",
  )
    .map((subcluster) => ({ subcluster, count: counts[subcluster] }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        left.subcluster.localeCompare(right.subcluster),
  );
  const [best, second] = ranked;
  if (!best || best.count <= 0) return "mixed_unknown";
  if (second && second.count > 0 && best.count === second.count) {
    // In v2 ties prefer the latest matching end-window signal: the terminal
    // cause is a stronger residual hint than an older equal-count signal.
    return ranked
      .filter((entry) => entry.count === best.count)
      .sort(
        (left, right) =>
          latestIndex[right.subcluster] - latestIndex[left.subcluster] ||
          left.subcluster.localeCompare(right.subcluster),
      )[0]!.subcluster;
  }
  return best.subcluster;
}

function classifySelfplayActionLimitSubclusterEntry(
  entry: AiSimulationSummary["actionSequence"][number],
  window: readonly AiSimulationSummary["actionSequence"][number][],
  windowIndex: number,
): AiSelfplayActionLimitSubclusterId | undefined {
  const text = selfplayEntryText(entry);
  if (entry.actionType === "gain_credit" && !entryHasFundingNeedSignal(text)) {
    return classifyLateGainCreditSubclusterEntry(entry, text);
  }
  if (entry.actionType === "draw_card") {
    // AI109 showed coverage gaps may only appear as structured trace flags, so
    // those draws are separated from true no-goal late draws.
    return entryHasDrawOrCoverageNeed(entry, text)
      ? "late_draw_for_coverage_or_hand_goal"
      : "late_draw_without_coverage_or_hand_goal";
  }
  if (
    entry.actionType === "activated_card_ability" &&
    entryHasLowDeltaSignal(text)
  ) {
    return "late_ability_reuse_low_delta";
  }
  if (
    (entry.actionType === "install_card" ||
      entry.actionType === "play_event") &&
      entryHasLowDeltaSignal(text)
  ) {
    return "late_install_low_delta";
  }
  const runStepSubcluster = classifyLateRunStepSubclusterEntry(
    entry,
    window,
    windowIndex,
    text,
  );
  if (runStepSubcluster) return runStepSubcluster;
  return undefined;
}

function classifyLateRunStepSubclusterEntry(
  entry: AiSimulationSummary["actionSequence"][number],
  window: readonly AiSimulationSummary["actionSequence"][number][],
  windowIndex: number,
  text: string,
): AiSelfplayActionLimitSubclusterId | undefined {
  if (entry.actionType === "break_subroutine" || entry.actionType === "pump_breaker") {
    return "break_pump_required";
  }
  if (entry.actionType === "jack_out") {
    return "jackout_loop";
  }
  if (entry.actionType === "access_card") {
    return /breach|remainingcount|access_queue/.test(text)
      ? "breach_pending"
      : "access_pending";
  }
  if (entry.actionType === "continue_run") {
    if (runWindowHasAccessOrBreachAfter(window, windowIndex)) {
      return "continue_chain_to_access";
    }
    if (
      /simple_run_choice|simple_hq_or_rnd_pressure|opportunistic_central_run|remote_contest/.test(
        text,
      )
    ) {
      return "continue_without_progress";
    }
  }
  if (
    entry.actionType === "start_run" &&
    /simple_hq_or_rnd_pressure|opportunistic_central_run|remote_contest|simple_run_choice/.test(
      text,
    )
  ) {
    return "run_microstep_required";
  }
  return undefined;
}

function runWindowHasAccessOrBreachAfter(
  window: readonly AiSimulationSummary["actionSequence"][number][],
  windowIndex: number,
): boolean {
  // A continue action followed by access is required run microflow, not a
  // no-progress loop, so the lookahead is intentionally narrow and positive.
  return window.slice(windowIndex + 1, windowIndex + 5).some(
    (entry) =>
      entry.side === "runner" &&
      (entry.actionType === "access_card" ||
        entry.actionType === "steal_agenda" ||
        entry.actionType === "trash_accessed_card" ||
        entry.actionType === "decline_trash" ||
        /breach/.test(selfplayEntryText(entry))),
  );
}

function classifyLateGainCreditSubclusterEntry(
  entry: AiSimulationSummary["actionSequence"][number],
  text: string,
): AiSelfplayActionLimitSubclusterId {
  if (entry.side === "runner") {
    if (runnerLateGainCreditHasReserveOrSafetyNeed(entry, text)) {
      return "runner_late_gain_credit_real_reserve";
    }
    if (!runnerLateGainCreditHasSafeProgressAlternative(entry)) {
      return "runner_late_gain_credit_no_safe_alternative";
    }
    return "runner_late_gain_credit_without_funding_need";
  }
  if (entry.side === "corp") {
    if (corpLateGainCreditHasRezScoreOrProtectionNeed(entry)) {
      return "corp_late_gain_credit_real_rez_or_protection_reserve";
    }
    if (!corpLateGainCreditHasSafeProgressAlternative(entry)) {
      return "corp_late_gain_credit_no_safe_alternative";
    }
    return "corp_late_gain_credit_without_rez_score_protection_need";
  }
  return "late_gain_credit_without_funding_need";
}

function runnerLateGainCreditHasReserveOrSafetyNeed(
  entry: AiSimulationSummary["actionSequence"][number],
  text: string,
): boolean {
  // These trace-only flags preserve legitimate reserve and safety credits from
  // being collapsed into the "no funding need" residual bucket.
  return (
    entry.runnerEconomyTakenToReachRunReserve === true ||
    entry.runnerReservePreservingEconomy === true ||
    entry.runnerBelowReserveBefore === true ||
    entry.runnerCreditStarvedWithLegalEconomy === true ||
    (entry.runnerSetupMissingCoverageTypes?.length ?? 0) > 0 ||
    /known_unaffordable_path:true|missing_breaker_coverage:true|debtrepaymentrisk:high|encounter_survival/.test(
      text,
    )
  );
}

function runnerLateGainCreditHasSafeProgressAlternative(
  entry: AiSimulationSummary["actionSequence"][number],
): boolean {
  return (
    entry.runnerPressureReadyTrue === true &&
    (entry.runnerPressureReadyByTargetRemote === true ||
      entry.runnerPressureReadyByTargetRnd === true ||
      entry.runnerPressureReadyByTargetHq === true ||
      entry.runnerPressureReadyByTargetArchives === true)
  );
}

function corpLateGainCreditHasRezScoreOrProtectionNeed(
  entry: AiSimulationSummary["actionSequence"][number],
): boolean {
  // Corp credit gains remain plausible when public diagnostics show rez,
  // score-conversion, or protection reserve pressure.
  return (
    entry.corpCreditsBelowCheapestRelevantRez === true ||
    entry.corpCreditsBelowEstimatedCentralRezNeed === true ||
    entry.corpCannotRezAnyNewlyInstalledIce === true ||
    entry.corpScoreConversionFixGateBlockedByCredits === true ||
    entry.corpEconomyBeforeScorePlausibleRezOrAdvanceReserve === true ||
    selfplayEntryHasStructuredSignal(entry, [
      "rez_reserve",
      "corpRezReserve",
      "creditsBelow",
      "blockedByCredits",
      "protection",
      "install_ice",
    ])
  );
}

function corpLateGainCreditHasSafeProgressAlternative(
  entry: AiSimulationSummary["actionSequence"][number],
): boolean {
  // AI110 keeps economy-only and opaque ability references out of "safe
  // progress"; this bucket needs a scoreline action that was actually legal.
  return (
    entry.corpScoreTerminalWindowScoreLegal === true ||
    entry.corpScoreTerminalWindowAdvanceToScoreLegal === true ||
    entry.corpScoreTerminalWindowAgendaInstallLegal === true
  );
}

function entryHasFundingNeedSignal(text: string): boolean {
  return /activefundingneed:true|funding_need:true|fundingneed:true|credit_base_funding_need:true|runner_economy_funding_need:true/.test(
    text,
  );
}

function entryHasDrawOrCoverageNeed(
  entry: AiSimulationSummary["actionSequence"][number],
  text: string,
): boolean {
  return (
    (entry.runnerSetupMissingCoverageTypes?.length ?? 0) > 0 ||
    /coverage|hand_goal|draw_for_answer|search_or_draw|supportsdraworsearchneed:true|answer/.test(
      text,
    )
  );
}

function entryHasLowDeltaSignal(text: string): boolean {
  return /known_low_value|low_value|low_delta|no_current_payoff|stale|repeat/.test(
    text,
  );
}

function selfplayEntryHasStructuredSignal(
  entry: AiSimulationSummary["actionSequence"][number],
  needles: readonly string[],
): boolean {
  const normalizedNeedles = new Set(
    needles.map((needle) => needle.toLocaleLowerCase("en-US")),
  );
  return [
    entry.reasonCode,
    ...(entry.evidence ?? []),
    ...(entry.debugFacts ?? []),
    ...(entry.qualityTags ?? []),
  ].some((rawValue) => {
    const value = rawValue.toLocaleLowerCase("en-US");
    if (normalizedNeedles.has(value)) return true;
    return value.split(":").some((segment) => normalizedNeedles.has(segment));
  });
}

function actionLimitSetupOrEconomyEntry(
  entry: AiSimulationSummary["actionSequence"][number],
): boolean {
  if (
    entry.runnerEconomyActionTaken === true ||
    entry.runnerSearchTaken === true ||
    entry.runnerRecoveryTaken === true ||
    entry.runnerDrawAction === true ||
    entry.runnerSetupContinuedAfterPressureReady === true ||
    entry.runnerSetupLoopAfterPressureReady === true
  ) {
    return true;
  }
  const text = selfplayEntryText(entry);
  return /economy|recover|setup|draw_for_answers|search|coverage/.test(text);
}

function actionLimitLowValueRepeatEntry(
  entry: AiSimulationSummary["actionSequence"][number],
): boolean {
  if (
    entry.runnerRepeatedLowValueCentralRun === true ||
    entry.runnerRepeatedCentralRunWithoutFreshValue === true ||
    entry.runnerLowValueDuplicateInstallAction === true ||
    entry.runnerJunkyardBbsDuplicateInstall === true ||
    entry.remoteRunSuppressedByKnownLowValueRemote === true ||
    entry.runnerRemoteContestDeclinedAsBaitOrLowValue === true
  ) {
    return true;
  }
  const text = selfplayEntryText(entry);
  return /known_low_value|no_current_payoff|low_value|stale/.test(text);
}

function countRepeatedActionReasonsWithoutProgress(
  entries: readonly AiSimulationSummary["actionSequence"][number][],
): number {
  let repeats = 0;
  const lastSeen = new Map<string, number>();
  for (const [index, entry] of entries.entries()) {
    if (selfplayEntryIsMeaningfulProgress(entry)) {
      lastSeen.clear();
      continue;
    }
    const key = `${entry.side}:${entry.actionType}:${entry.reasonCode}:${entry.targetServerId ?? "none"}`;
    if (lastSeen.has(key)) repeats += 1;
    lastSeen.set(key, index);
  }
  return repeats;
}

function collectSelfplayFindingsForSummary(
  summary: AiSimulationSummary,
  summaryIndex: number,
  enabled: Set<AiSelfplayTraceMiningDetectorId>,
  longGameActionThreshold: number,
): AiSelfplaySuspiciousDecision[] {
  const findings: AiSelfplaySuspiciousDecision[] = [];
  const entries = summary.actionSequence;
  if (
    enabled.has("hidden_info_marker") &&
    !isSelfplayTraceRedactionSafe(entries)
  ) {
    findings.push(
      selfplaySummaryFinding(
        summary,
        summaryIndex,
        "hidden_info_marker",
        "critical",
        "Redaction check found a forbidden marker in the simulation trace.",
      ),
    );
  }
  if (enabled.has("replay_failure") && !summary.replayOk) {
    findings.push(
      selfplaySummaryFinding(
        summary,
        summaryIndex,
        "replay_failure",
        "critical",
        "Replay did not reproduce the simulated game state.",
        summary.replayErrors,
      ),
    );
  }
  for (const error of summary.errors) {
    const noLegal = /no legal action|no legal actions|no_legal/i.test(error);
    if (enabled.has("no_legal_action_failure") && noLegal) {
      findings.push(
        selfplaySummaryFinding(
          summary,
          summaryIndex,
          "no_legal_action_failure",
          "critical",
          "Simulation reached a non-terminal state without a legal AI action.",
          [error],
        ),
      );
      continue;
    }
    if (enabled.has("illegal_action")) {
      findings.push(
        selfplaySummaryFinding(
          summary,
          summaryIndex,
          "illegal_action",
          "critical",
          "Simulation stopped with an AI action or input error.",
          [error],
        ),
      );
    }
  }
  if (
    enabled.has("action_limit_reached") &&
    summary.winner === "action_limit_reached" &&
    summary.errors.length === 0
  ) {
    findings.push(
      selfplaySummaryFinding(
        summary,
        summaryIndex,
        "action_limit_reached",
        "medium",
        "Selfplay game reached the configured action limit before a result.",
      ),
    );
  }
  if (summary.actions >= longGameActionThreshold) {
    if (
      enabled.has("corp_never_scores_long_game") &&
      !entries.some(
        (entry) => entry.side === "corp" && entry.actionType === "score_agenda",
      )
    ) {
      findings.push(
        selfplayFindingForLastSideAction(
          summary,
          summaryIndex,
          "corp",
          "corp_never_scores_long_game",
          "high",
          "Long selfplay game ended without a Corp score.",
        ),
      );
    }
    if (
      enabled.has("runner_never_accesses_long_game") &&
      !entries.some(
        (entry) =>
          entry.side === "runner" &&
          [
            "access_card",
            "steal_agenda",
            "trash_accessed_card",
            "decline_trash",
          ].includes(entry.actionType),
      )
    ) {
      findings.push(
        selfplayFindingForLastSideAction(
          summary,
          summaryIndex,
          "runner",
          "runner_never_accesses_long_game",
          "high",
          "Long selfplay game ended without a Runner access or access payoff.",
        ),
      );
    }
  }

  for (const [actionIndex, entry] of entries.entries()) {
    findings.push(
      ...selfplayEntryDetectorFindings(
        summary,
        summaryIndex,
        actionIndex,
        entry,
        enabled,
      ),
    );
  }
  return findings;
}

function selfplayEntryDetectorFindings(
  summary: AiSimulationSummary,
  summaryIndex: number,
  actionIndex: number,
  entry: AiSimulationSummary["actionSequence"][number],
  enabled: Set<AiSelfplayTraceMiningDetectorId>,
): AiSelfplaySuspiciousDecision[] {
  const findings: AiSelfplaySuspiciousDecision[] = [];
  const text = selfplayEntryText(entry);
  const previousSameRun = previousRunnerRunOnSameServer(
    summary.actionSequence,
    actionIndex,
    entry,
  );
  const repeatedNoProgressRun =
    previousSameRun !== undefined &&
    !hasMeaningfulProgressBetween(
      summary.actionSequence,
      previousSameRun + 1,
      actionIndex,
    );
  if (
    enabled.has("repeated_no_progress_run") &&
    entry.side === "runner" &&
    entry.actionType === "start_run" &&
    repeatedNoProgressRun
  ) {
    findings.push(
      selfplayEntryFinding(
        summary,
        summaryIndex,
        actionIndex,
        "repeated_no_progress_run",
        "medium",
        `Runner repeated ${entry.targetServerId ?? "unknown"} without intervening progress.`,
      ),
    );
  }
  if (
    enabled.has("repeated_known_no_payoff_remote") &&
    entry.side === "runner" &&
    entry.actionType === "start_run" &&
    isRemoteServerTarget(entry.targetServerId) &&
    (entry.runnerRepeatRunOnKnownUnpayableRemotePath === true ||
      entry.runnerRunPenalizedAsKnownNoAccess === true ||
      entry.remoteRunSuppressedByKnownLowValueRemote === true ||
      selfplayEntryHasStructuredSignal(entry, [
        "known_no_current_payoff",
        "known_low_value",
      ]))
  ) {
    findings.push(
      selfplayEntryFinding(
        summary,
        summaryIndex,
        actionIndex,
        "repeated_known_no_payoff_remote",
        "high",
        "Runner selected a remote run despite known low or unavailable payoff signals.",
      ),
    );
  }
  if (
    enabled.has("repeated_low_value_archives") &&
    entry.side === "runner" &&
    entry.actionType === "start_run" &&
    entry.targetServerId === "archives" &&
    (repeatedNoProgressRun ||
      selfplayEntryHasStructuredSignal(entry, ["archives_known_no_agenda"]))
  ) {
    findings.push(
      selfplayEntryFinding(
        summary,
        summaryIndex,
        actionIndex,
        "repeated_low_value_archives",
        "medium",
        "Runner repeated Archives pressure without a fresh payoff signal.",
      ),
    );
  }
  if (
    enabled.has("recovery_low_value_loop") &&
    entry.side === "runner" &&
    /recover|recovery|junkyard|heap/.test(text) &&
    repeatedReasonWithoutProgress(summary.actionSequence, actionIndex, entry)
  ) {
    const recoveryContext = recoveryLowValueLoopContext(entry, text);
    if (
      recoveryContext.category === "funding_need_recovery" ||
      recoveryContext.category === "coverage_recovery" ||
      recoveryContext.category === "search_or_draw_recovery"
    ) {
      // Funding and capability recovery are not low-value recovery loops.
    } else {
      findings.push(
        selfplayEntryFinding(
          summary,
          summaryIndex,
          actionIndex,
          "recovery_low_value_loop",
          "medium",
          `Runner repeated a recovery-like action without visible progress (${recoveryContext.category}).`,
          recoveryContext.facts,
        ),
      );
    }
  }
  if (
    enabled.has("bank_over_target_without_funding_need") &&
    entry.side === "runner" &&
    (selfplayEntryHasStructuredSignal(entry, [
      "bankovertarget:true",
      "bankoverdesiredtarget:true",
      "bankconcretefundingneed:false",
      "bank_cashout_without_funding_need",
    ]) ||
      entry.runnerDebtEconomyTakenWithoutNeed === true)
  ) {
    findings.push(
      selfplayEntryFinding(
        summary,
        summaryIndex,
        actionIndex,
        "bank_over_target_without_funding_need",
        "medium",
        "Runner bank or debt economy was used without a concrete funding need.",
      ),
    );
  }
  if (
    enabled.has("risky_self_damage_action") &&
    entry.side === "runner" &&
    selfplayEntryHasStructuredSignal(entry, ["self_damage_survives:false"]) &&
    !selfplayEntryHasStructuredSignal(entry, [
      "runner.self_damage.safe_alternative",
    ])
  ) {
    findings.push(
      selfplayEntryFinding(
        summary,
        summaryIndex,
        actionIndex,
        "risky_self_damage_action",
        "critical",
        "Runner selected a self-damage action that the debug facts classify as non-survivable.",
      ),
    );
  }
  if (
    enabled.has("blink_low_hand_buffer_run") &&
    entry.side === "runner" &&
    (entry.actionType === "start_run" ||
      entry.actionType === "trigger_ability") &&
    selfplayEntryHasStructuredSignal(entry, [
      "blocked_by_blink_hand_buffer:true",
      "blinkriskseverity:lethal",
      "blink_break_self_net_damage_risk",
    ])
  ) {
    findings.push(
      selfplayEntryFinding(
        summary,
        summaryIndex,
        actionIndex,
        "blink_low_hand_buffer_run",
        "high",
        "Runner selected a Blink-dependent action with low hand-buffer risk signals.",
      ),
    );
  }
  if (
    enabled.has("duplicate_low_delta_install") &&
    entry.side === "runner" &&
    (entry.runnerLowValueDuplicateInstallAction === true ||
      entry.runnerJunkyardBbsDuplicateInstall === true)
  ) {
    findings.push(
      selfplayEntryFinding(
        summary,
        summaryIndex,
        actionIndex,
        "duplicate_low_delta_install",
        "medium",
        "Runner installed a duplicate or low-delta setup card.",
      ),
    );
  }
  if (
    enabled.has("overdraw_without_urgency") &&
    entry.side === "runner" &&
    entry.runnerDiscardChoice === true &&
    (entry.runnerDiscardedPlayableEconomy === true ||
      entry.runnerDiscardedInstallableBreaker === true ||
      entry.runnerDiscardedRunPressureCard === true) &&
    recentRunnerDrawBefore(summary.actionSequence, actionIndex)
  ) {
    findings.push(
      selfplayEntryFinding(
        summary,
        summaryIndex,
        actionIndex,
        "overdraw_without_urgency",
        "medium",
        "Runner discarded useful cards shortly after draw pressure.",
      ),
    );
  }
  if (
    enabled.has("plan_step_action_mismatch") &&
    selfplayPlanActionMismatch(entry, text)
  ) {
    findings.push(
      selfplayEntryFinding(
        summary,
        summaryIndex,
        actionIndex,
        "plan_step_action_mismatch",
        "medium",
        "Selected action appears to mismatch the current plan category.",
      ),
    );
  }
  if (
    enabled.has("semantic_override_suspicious") &&
    selfplaySemanticOverrideSuspicious(entry, text)
  ) {
    findings.push(
      selfplayEntryFinding(
        summary,
        summaryIndex,
        actionIndex,
        "semantic_override_suspicious",
        "low",
        "Semantic runtime selected a different actual action than the legacy debug winner.",
      ),
    );
  }
  return findings;
}

function selfplaySummaryFinding(
  summary: AiSimulationSummary,
  summaryIndex: number,
  detectorId: AiSelfplayTraceMiningDetectorId,
  severity: AiSelfplaySuspicionSeverity,
  shortReason: string,
  facts: string[] = [],
): AiSelfplaySuspiciousDecision {
  const actionIndex = Math.max(0, summary.actionSequence.length - 1);
  return selfplayEntryFinding(
    summary,
    summaryIndex,
    actionIndex,
    detectorId,
    severity,
    shortReason,
    facts,
  );
}

function selfplayFindingForLastSideAction(
  summary: AiSimulationSummary,
  summaryIndex: number,
  side: Side,
  detectorId: AiSelfplayTraceMiningDetectorId,
  severity: AiSelfplaySuspicionSeverity,
  shortReason: string,
): AiSelfplaySuspiciousDecision {
  const actionIndex = Math.max(0, lastSelfplayEntryIndex(summary, side));
  return selfplayEntryFinding(
    summary,
    summaryIndex,
    actionIndex,
    detectorId,
    severity,
    shortReason,
  );
}

function selfplayEntryFinding(
  summary: AiSimulationSummary,
  summaryIndex: number,
  actionIndex: number,
  detectorId: AiSelfplayTraceMiningDetectorId,
  severity: AiSelfplaySuspicionSeverity,
  shortReason: string,
  extraFacts: string[] = [],
): AiSelfplaySuspiciousDecision {
  const entry = summary.actionSequence[actionIndex];
  const stateVersion =
    entry?.stateVersionBefore ??
    summary.actionSequence.at(-1)?.stateVersionBefore ??
    0;
  const selectedActionType = entry?.actionType ?? "none";
  const selectedActionId =
    entry?.selectedActionId ?? `${selectedActionType}:${stateVersion}`;
  return {
    matchId: `selfplay:${summary.seed}`,
    seed: summary.seed,
    summaryIndex,
    actionIndex,
    side: entry?.side ?? "unknown",
    stateVersion,
    selectedActionId,
    selectedActionType,
    ...(entry?.planKind ? { planKind: entry.planKind } : {}),
    detectorIds: [detectorId],
    severity,
    shortReason: sanitizeSelfplayText(shortReason) ?? "Suspicious decision.",
    relevantDebugFacts: safeSelfplayFacts([
      ...(entry?.debugFacts ?? []),
      ...(entry?.evidence ?? []),
      ...(entry?.qualityTags ?? []),
      ...extraFacts,
    ]).slice(0, 16),
    suggestedFixtureName: selfplayFixtureName(
      summary.seed,
      detectorId,
      stateVersion,
    ),
    replaySafeReference: {
      seed: summary.seed,
      stateVersion,
      fromActionIndex: Math.max(0, actionIndex - 2),
      toActionIndex: Math.max(0, actionIndex + 1),
    },
  };
}

function groupSelfplayFindings(
  findings: AiSelfplaySuspiciousDecision[],
): AiSelfplaySuspiciousDecision[] {
  const grouped = new Map<string, AiSelfplaySuspiciousDecision>();
  for (const finding of findings) {
    const key = [
      finding.summaryIndex,
      finding.actionIndex,
      finding.side,
      finding.stateVersion,
      finding.selectedActionId,
    ].join(":");
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, finding);
      continue;
    }
    const severity =
      SELFPLAY_SEVERITY_RANK[finding.severity] <
      SELFPLAY_SEVERITY_RANK[existing.severity]
        ? finding.severity
        : existing.severity;
    grouped.set(key, {
      ...existing,
      severity,
      detectorIds: sortedUniqueSelfplayDetectors([
        ...existing.detectorIds,
        ...finding.detectorIds,
      ]),
      shortReason: sortedUnique([
        existing.shortReason,
        finding.shortReason,
      ]).join(" | "),
      relevantDebugFacts: safeSelfplayFacts([
        ...existing.relevantDebugFacts,
        ...finding.relevantDebugFacts,
      ]).slice(0, 16),
    });
  }
  return [...grouped.values()];
}

function sortSelfplayFindings(
  findings: AiSelfplaySuspiciousDecision[],
): AiSelfplaySuspiciousDecision[] {
  return findings.slice().sort((left, right) => {
    return (
      SELFPLAY_SEVERITY_RANK[left.severity] -
        SELFPLAY_SEVERITY_RANK[right.severity] ||
      left.seed.localeCompare(right.seed) ||
      left.actionIndex - right.actionIndex ||
      left.detectorIds.join(",").localeCompare(right.detectorIds.join(","))
    );
  });
}

function previousRunnerRunOnSameServer(
  entries: AiSimulationSummary["actionSequence"],
  actionIndex: number,
  entry: AiSimulationSummary["actionSequence"][number],
): number | undefined {
  if (entry.side !== "runner" || entry.actionType !== "start_run")
    return undefined;
  for (let index = actionIndex - 1; index >= 0; index -= 1) {
    const previous = entries[index];
    if (
      previous?.side === "runner" &&
      previous.actionType === "start_run" &&
      previous.targetServerId === entry.targetServerId
    ) {
      return index;
    }
  }
  return undefined;
}

function hasMeaningfulProgressBetween(
  entries: AiSimulationSummary["actionSequence"],
  fromIndex: number,
  toIndex: number,
): boolean {
  return entries
    .slice(Math.max(0, fromIndex), Math.max(0, toIndex))
    .some(selfplayEntryIsMeaningfulProgress);
}

function selfplayEntryIsMeaningfulProgress(
  entry: AiSimulationSummary["actionSequence"][number],
): boolean {
  return (
    entry.actionType === "steal_agenda" ||
    entry.actionType === "score_agenda" ||
    entry.actionType === "trash_accessed_card" ||
    entry.actionType === "advance_card" ||
    entry.advancedAgendaStolen === true ||
    entry.runnerCoverageImproved === true ||
    entry.runnerRemoteTrashTaken === true ||
    entry.corpScoreTerminalScoreTaken === true ||
    entry.corpScoreTerminalAdvanceTaken === true ||
    entry.protectBeforeAdvance === true
  );
}

function recoveryLowValueLoopContext(
  entry: AiSimulationSummary["actionSequence"][number],
  text: string,
): { category: string; facts: string[] } {
  const coverageRecovery =
    entry.runnerRecoveryTakenForBreakerCoverage === true ||
    selfplayEntryHasStructuredSignal(entry, [
      "supportsactivecapabilityneed:true",
      "coverageanswerrole:recovery_answer",
    ]);
  const fundingNeed =
    selfplayEntryHasStructuredSignal(entry, [
      "fundingneedreducesrecoverylooppenalty:true",
      "runner_economy_funding_need:true",
      "credit_base_funding_need:true",
      "runner_credit_base_recommendation:fund_useful_hand_card",
    ]) ||
    entry.runnerEconomyTakenToReachRunReserve === true ||
    entry.runnerEconomyChoicePlausible === true;
  const searchOrDrawNeed =
    entry.runnerSearchTakenForBreakerCoverage === true ||
    selfplayEntryHasStructuredSignal(entry, [
      "supportsdraworsearchneed:true",
      "coverageanswerrole:program_search",
      "coverageanswerrole:draw_for_answer",
    ]);
  const pressureSkipped =
    entry.runnerSearchRecoveryChosenOverPressure === true ||
    entry.runnerEconomyChosenWhilePressureReady === true;
  const category = coverageRecovery
    ? "coverage_recovery"
    : fundingNeed
      ? "funding_need_recovery"
      : searchOrDrawNeed
        ? "search_or_draw_recovery"
        : pressureSkipped
          ? "recovery_over_pressure"
          : "low_value_repeat_no_funding_need";
  return {
    category,
    facts: [
      `recovery_loop_category:${category}`,
      `recovery_loop_funding_need:${fundingNeed}`,
      `recovery_loop_coverage_need:${coverageRecovery}`,
      `recovery_loop_search_or_draw_need:${searchOrDrawNeed}`,
      `recovery_loop_pressure_skipped:${pressureSkipped}`,
    ],
  };
}

function repeatedReasonWithoutProgress(
  entries: AiSimulationSummary["actionSequence"],
  actionIndex: number,
  entry: AiSimulationSummary["actionSequence"][number],
): boolean {
  const start = Math.max(0, actionIndex - 6);
  let absolutePreviousIndex = -1;
  for (let index = actionIndex - 1; index >= start; index -= 1) {
    const candidate = entries[index];
    if (
      candidate?.side === entry.side &&
      candidate.reasonCode === entry.reasonCode &&
      candidate.actionType === entry.actionType
    ) {
      absolutePreviousIndex = index;
      break;
    }
  }
  if (absolutePreviousIndex < 0) return false;
  return !hasMeaningfulProgressBetween(
    entries,
    absolutePreviousIndex + 1,
    actionIndex,
  );
}

function lastSelfplayEntryIndex(
  summary: AiSimulationSummary,
  side: Side,
): number {
  for (let index = summary.actionSequence.length - 1; index >= 0; index -= 1) {
    if (summary.actionSequence[index]?.side === side) return index;
  }
  return summary.actionSequence.length - 1;
}

function recentRunnerDrawBefore(
  entries: AiSimulationSummary["actionSequence"],
  actionIndex: number,
): boolean {
  return entries
    .slice(Math.max(0, actionIndex - 3), actionIndex)
    .some(
      (entry) =>
        entry.side === "runner" &&
        (entry.runnerDrawAction === true || entry.actionType === "draw_card"),
    );
}

function selfplayPlanActionMismatch(
  entry: AiSimulationSummary["actionSequence"][number],
  text: string,
): boolean {
  const planKind = entry.planKind?.toLocaleLowerCase("en-US");
  if (!planKind) return false;
  if (
    /(run|pressure|contest|access)/.test(planKind) &&
    entry.actionType !== "start_run" &&
    entry.actionType !== "access_card" &&
    entry.actionType !== "trash_accessed_card" &&
    entry.actionType !== "steal_agenda" &&
    !selfplayEntryHasFundingOrReserveExplanation(entry) &&
    !selfplayPlanMismatchHasKnownExplanation(entry)
  )
    return true;
  if (
    /(score|advance)/.test(planKind) &&
    entry.side === "corp" &&
    entry.scoreActionsAvailable &&
    entry.actionType !== "score_agenda" &&
    entry.actionType !== "advance_card"
  )
    return true;
  if (
    /(install|rig|setup)/.test(planKind) &&
    entry.side === "runner" &&
    entry.actionType === "start_run" &&
    selfplayEntryHasStructuredSignal(entry, ["runnerpressureready:false"])
  )
    return true;
  return false;
}

function selfplayEntryHasFundingOrReserveExplanation(
  entry: AiSimulationSummary["actionSequence"][number],
): boolean {
  return selfplayEntryHasStructuredSignal(entry, [
    "activeFundingNeed:true",
    "funding_need:true",
    "fundingNeed:true",
    "credit_base_funding_need:true",
    "runner_economy_funding_need:true",
    "reserve",
  ]);
}

function selfplaySemanticOverrideSuspicious(
  entry: AiSimulationSummary["actionSequence"][number],
  text: string,
): boolean {
  if (
    !selfplayEntryHasStructuredSignal(entry, [
      "semantic_runtime_actual_differs_from_legacy_debug",
    ])
  )
    return false;
  if (selfplayPlanMismatchHasKnownExplanation(entry)) return false;
  if (selfplayReactiveSemanticOverride(entry.actionType)) return false;
  return true;
}

function selfplayPlanMismatchHasKnownExplanation(
  entry: AiSimulationSummary["actionSequence"][number],
): boolean {
  return selfplayEntryHasStructuredSignal(entry, [
    "tactical_plan_mapping_outcome:semantic_choice_selected",
    "selected_by_plan_mapping",
    "runner_recent_same_server_runs",
    "runner_repeated_low_value_central_run",
    "runner_pressure_ready_false_positive:true",
    "runner_phase_exit_blocked_by_cost:true",
    "runner_phase_exit_blocked_by_target_value:true",
    "self_damage_guard",
    "program_sacrifice_penalty",
    "runner_loan_liability",
  ]);
}

function selfplayReactiveSemanticOverride(
  actionType: AiSimulationSummary["actionSequence"][number]["actionType"],
): boolean {
  return (
    actionType === "resolve_choice" ||
    actionType === "access_card" ||
    actionType === "steal_agenda" ||
    actionType === "trash_accessed_card" ||
    actionType === "decline_trash" ||
    actionType === "break_subroutine" ||
    actionType === "pump_breaker" ||
    actionType === "continue_run" ||
    actionType === "jack_out"
  );
}

function selfplayEntryText(
  entry: AiSimulationSummary["actionSequence"][number],
): string {
  return [
    entry.reasonCode,
    entry.explanation,
    entry.planKind ?? "",
    ...(entry.evidence ?? []),
    ...(entry.debugFacts ?? []),
    ...(entry.qualityTags ?? []),
  ]
    .join("|")
    .toLocaleLowerCase("en-US");
}

function safeSelfplayActionAlternatives(
  alternatives: readonly AiDecisionActionAlternative[],
): AiSelfplayDecisionPointActionAlternative[] {
  return alternatives
    .map(safeSelfplayActionAlternative)
    .filter(
      (
        alternative,
      ): alternative is AiSelfplayDecisionPointActionAlternative =>
        alternative !== undefined,
    );
}

function safeSelfplayActionAlternative(
  alternative: AiDecisionActionAlternative,
): AiSelfplayDecisionPointActionAlternative | undefined {
  const actionId = sanitizeSelfplayText(alternative.actionId);
  const actionType = sanitizeSelfplayText(alternative.actionType);
  if (!actionId || !actionType) return undefined;
  const result: AiSelfplayDecisionPointActionAlternative = {
    rank: alternative.rank,
    actionId,
    actionType,
    selected: alternative.selected,
    whyChosen: safeSelfplayFacts(alternative.whyChosen ?? []),
    whyNot: safeSelfplayFacts(alternative.whyNot ?? []),
  };
  if (alternative.excluded !== undefined) result.excluded = alternative.excluded;
  if (alternative.priority !== undefined) result.priority = alternative.priority;
  const label = sanitizeSelfplayText(alternative.label);
  if (label) result.label = label;
  const source = sanitizeSelfplayText(alternative.source);
  if (source) result.source = source;
  return result;
}

export function safeSelfplayFacts(values: unknown[]): string[] {
  return sortedUnique(
    values
      .map(sanitizeSelfplayText)
      .filter((value): value is string => Boolean(value)),
  );
}

function sanitizeSelfplayText(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const text = String(value).replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  if (!isSelfplayTraceRedactionSafe(text)) return undefined;
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

export function isSelfplayTraceRedactionSafe(value: unknown): boolean {
  const serialized = JSON.stringify(value);
  if (!serialized) return true;
  if (
    FORBIDDEN_AI_INPUT_FIELDS.some((needle) =>
      serialized
        .toLocaleLowerCase("en-US")
        .includes(needle.toLocaleLowerCase("en-US")),
    )
  )
    return false;
  return !/\b(?:AIInput|DecisionDebug|aiDecisionDebug|decisionDebug|privatePayload|cardInstances|fullGameState|FullState|sessionToken|reconnectToken|joinToken|tokenHash|decklist|deckOrder)\b/i.test(
    serialized,
  );
}

function selfplayFixtureName(
  seed: string,
  detectorId: AiSelfplayTraceMiningDetectorId,
  stateVersion: number,
): string {
  return `${detectorId}-${fnv1a(`${seed}:${detectorId}:${stateVersion}`).slice(0, 8)}.fixture.json`;
}

function isRemoteServerTarget(serverId: string | undefined): boolean {
  return serverId === "new_remote" || serverId?.startsWith("remote_") === true;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
