import type { LegalAction, Side } from "@netgrid/shared";
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
  };
};

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
    summary.winner === "action_limit_reached"
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
      text.includes("known_no_current_payoff") ||
      text.includes("known_low_value"))
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
    (repeatedNoProgressRun || text.includes("archives_known_no_agenda"))
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
    findings.push(
      selfplayEntryFinding(
        summary,
        summaryIndex,
        actionIndex,
        "recovery_low_value_loop",
        "medium",
        "Runner repeated a recovery-like action without visible progress.",
      ),
    );
  }
  if (
    enabled.has("bank_over_target_without_funding_need") &&
    entry.side === "runner" &&
    (text.includes("bankovertarget:true") ||
      text.includes("bankoverdesiredtarget:true") ||
      text.includes("bankconcretefundingneed:false") ||
      text.includes("bank_cashout_without_funding_need") ||
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
    text.includes("self_damage_survives:false") &&
    !text.includes("runner.self_damage.safe_alternative")
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
    (entry.actionType === "start_run" || entry.actionType === "trigger_ability") &&
    (text.includes("blocked_by_blink_hand_buffer:true") ||
      text.includes("blinkriskseverity:lethal") ||
      text.includes("blink_break_self_net_damage_risk"))
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
    entry?.stateVersionBefore ?? summary.actionSequence.at(-1)?.stateVersionBefore ?? 0;
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
      shortReason: sortedUnique([existing.shortReason, finding.shortReason]).join(
        " | ",
      ),
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
    !text.includes("funding_need:true") &&
    !text.includes("reserve") &&
    !selfplayPlanMismatchHasKnownExplanation(text)
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
    text.includes("runnerpressureready:false")
  )
    return true;
  return false;
}

function selfplaySemanticOverrideSuspicious(
  entry: AiSimulationSummary["actionSequence"][number],
  text: string,
): boolean {
  if (!text.includes("semantic_runtime_actual_differs_from_legacy_debug"))
    return false;
  if (selfplayPlanMismatchHasKnownExplanation(text)) return false;
  if (selfplayReactiveSemanticOverride(entry.actionType)) return false;
  return true;
}

function selfplayPlanMismatchHasKnownExplanation(text: string): boolean {
  return (
    text.includes("tactical_plan_mapping_overridden:true") ||
    text.includes("selected_by_plan_mapping") ||
    text.includes("runner_recent_same_server_runs") ||
    text.includes("runner_repeated_low_value_central_run") ||
    text.includes("runner_pressure_ready_false_positive:true") ||
    text.includes("runner_phase_exit_blocked_by_cost:true") ||
    text.includes("runner_phase_exit_blocked_by_target_value:true") ||
    text.includes("self_damage_guard") ||
    text.includes("program_sacrifice_penalty") ||
    text.includes("runner_loan_liability")
  );
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
      serialized.toLocaleLowerCase("en-US").includes(
        needle.toLocaleLowerCase("en-US"),
      ),
    )
  )
    return false;
  return !/\b(?:AIInput|DecisionDebug|aiDecisionDebug|decisionDebug|privatePayload|cardInstances|fullGameState|FullState|sessionToken|reconnectToken|joinToken|tokenHash|decklist)\b/i.test(
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
