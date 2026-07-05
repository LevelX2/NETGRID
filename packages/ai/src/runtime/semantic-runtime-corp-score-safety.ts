import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type {
  CorpScorelineBlockerKind,
  CorpScorelinePathAssessment,
  CorpScorelineWindowAssessment,
} from "./corp-scoreline/semantic-runtime-corp-scoreline-assessment";

type CorpScoreTerminalWindowLike = {
  terminalWindow: boolean;
  scoreActionIds: readonly string[];
  blockedByCredits?: boolean;
  blockedByCheapContest?: boolean;
  blockedByRunnerContest?: boolean;
  blockedByHqThreat?: boolean;
  runnerAccessThreatHigh: boolean;
  protectedRemoteIds: readonly string[];
};

export type SemanticRuntimeCorpScoreSafetyGate = {
  allowed: boolean;
  evidence: string[];
};

export type SemanticRuntimeCorpScoreSafetyDependencies = {
  scoreTerminalWindow?: (input: AiDecisionInput) => CorpScoreTerminalWindowLike;
  scorelineWindowAssessment?: (
    input: AiDecisionInput,
  ) => CorpScorelineWindowAssessment;
};

const TERMINAL_OUTCOME_ALLOWED_VALUE = 100;
const TERMINAL_OUTCOME_BLOCKED_VALUE = -100;

export function semanticRuntimeCorpScoreNowSafetyGate(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreSafetyDependencies,
): SemanticRuntimeCorpScoreSafetyGate {
  if (
    input.side !== "corp" ||
    action.side !== "corp" ||
    action.type !== "score_agenda"
  ) {
    return {
      allowed: false,
      evidence: ["unsafe_score_unknown_higher_priority"],
    };
  }
  const scoreline = dependencies.scorelineWindowAssessment?.(input);
  if (scoreline) {
    return scoreNowSafetyGateFromScoreline(action, scoreline);
  }
  const terminal = dependencies.scoreTerminalWindow?.(input);
  if (!terminal) {
    return {
      allowed: false,
      evidence: [
        "unsafe_score_unknown_higher_priority",
        ...terminalOutcomeEvidence(false),
      ],
    };
  }
  const scoreActionIdSet = new Set(terminal.scoreActionIds);
  const scoreLegal = scoreActionIdSet.has(action.actionId);
  const reasons = semanticRuntimeCorpUnsafeScoreReasons(terminal, scoreLegal);
  const allowed = reasons.length === 0;
  return {
    allowed,
    evidence: allowed
      ? [
          "corp_scoreline_safety_gate_passed:true",
          `protected_remote_ready:${terminal.protectedRemoteIds.length > 0}`,
          `runner_access_threat_high:${terminal.runnerAccessThreatHigh}`,
          ...terminalOutcomeEvidence(true),
        ]
      : [...reasons, ...terminalOutcomeEvidence(false)],
  };
}

function scoreNowSafetyGateFromScoreline(
  action: LegalAction,
  scoreline: CorpScorelineWindowAssessment,
): SemanticRuntimeCorpScoreSafetyGate {
  const path = scoreline.paths.find(
    (candidate) =>
      candidate.actionId === action.actionId &&
      candidate.actionRoles.includes("score_now"),
  );
  if (!path) {
    return {
      allowed: false,
      evidence: [
        "unsafe_score_unknown_higher_priority",
        ...terminalOutcomeEvidence(false),
        ...scoreline.evidence,
      ],
    };
  }
  const reasons = scorelinePathUnsafeScoreReasons(path);
  const allowed =
    path.safe &&
    path.recommendedNextStep === "score_now" &&
    reasons.length === 0;
  return {
    allowed,
    evidence: allowed
      ? [
          "corp_scoreline_safety_gate_passed:true",
          `protected_remote_ready:${scoreline.protectedRemoteIds.length > 0}`,
          `runner_access_threat_high:${scoreline.runnerAccessThreatHigh}`,
          ...terminalOutcomeEvidence(true),
          ...path.evidence,
        ]
      : [...reasons, ...terminalOutcomeEvidence(false), ...path.evidence],
  };
}

function scorelinePathUnsafeScoreReasons(
  path: CorpScorelinePathAssessment,
): string[] {
  return sortedUnique(
    path.blockers.flatMap((blocker) => unsafeReasonForBlocker(blocker)),
  );
}

function unsafeReasonForBlocker(blocker: CorpScorelineBlockerKind): string[] {
  switch (blocker) {
    case "credits":
      return ["unsafe_score_insufficient_rez_reserve"];
    case "cheap_contest":
      return ["unsafe_score_cheap_contest_available"];
    case "runner_contest":
      return ["unsafe_score_runner_access_threat_high"];
    case "central_threat":
      return ["unsafe_score_hq_or_rnd_threat"];
    case "unsafe_remote":
      return ["unsafe_score_unprotected_remote"];
    case "no_score_path":
      return ["unsafe_score_unknown_higher_priority"];
  }
}

export function normalizedTerminalOutcomeValue(rawValue: number): number {
  return Math.max(-100, Math.min(100, Math.round(rawValue)));
}

function terminalOutcomeEvidence(allowed: boolean): string[] {
  const rawValue = allowed
    ? TERMINAL_OUTCOME_ALLOWED_VALUE
    : TERMINAL_OUTCOME_BLOCKED_VALUE;
  const normalizedValue = normalizedTerminalOutcomeValue(rawValue);
  return [
    `terminal_outcome_allowed:${allowed}`,
    `terminal_outcome_raw_value:${rawValue}`,
    `terminal_outcome_normalized_value:${normalizedValue}`,
  ];
}

function semanticRuntimeCorpUnsafeScoreReasons(
  terminal: CorpScoreTerminalWindowLike,
  scoreLegal: boolean,
): string[] {
  const reasons: string[] = [];
  if (!terminal.terminalWindow || !scoreLegal) {
    reasons.push("unsafe_score_unknown_higher_priority");
  }
  if (terminal.blockedByCredits) {
    reasons.push("unsafe_score_insufficient_rez_reserve");
  }
  if (terminal.blockedByCheapContest) {
    reasons.push("unsafe_score_cheap_contest_available");
  }
  if (terminal.blockedByRunnerContest) {
    reasons.push("unsafe_score_runner_access_threat_high");
  }
  if (terminal.blockedByHqThreat) {
    reasons.push("unsafe_score_hq_or_rnd_threat");
  }
  if (
    terminal.runnerAccessThreatHigh &&
    terminal.protectedRemoteIds.length === 0
  ) {
    reasons.push("unsafe_score_unprotected_remote");
    reasons.push("unsafe_score_missing_protected_remote_signal");
  }
  return sortedUnique(reasons);
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "de"),
  );
}
