import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type {
  CorpScorelineBlockerKind,
  CorpScorelinePathAssessment,
  CorpScorelineWindowAssessment,
} from "./corp-scoreline/semantic-runtime-corp-scoreline-assessment";

export type SemanticRuntimeCorpScoreSafetyGate = {
  allowed: boolean;
  evidence: string[];
};

export type SemanticRuntimeCorpScoreSafetyDependencies = {
  scorelineWindowAssessment: (
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
    action.type !== "score_agenda" ||
    action.timingPoint !== input.playerView.timingPoint ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    !input.legalActions.some(
      (offer) =>
        offer.actionId === action.actionId &&
        offer.source === action.source &&
        offer.side === action.side &&
        offer.type === action.type &&
        offer.timingPoint === action.timingPoint &&
        offer.expiresAtStateVersion === action.expiresAtStateVersion,
    )
  ) {
    return {
      allowed: false,
      evidence: [
        "unsafe_score_unknown_higher_priority",
        ...terminalOutcomeEvidence(false),
      ],
    };
  }
  return scoreNowSafetyGateFromScoreline(
    action,
    dependencies.scorelineWindowAssessment(input),
  );
}

function scoreNowSafetyGateFromScoreline(
  action: LegalAction,
  scoreline: CorpScorelineWindowAssessment,
): SemanticRuntimeCorpScoreSafetyGate {
  const path = scoreline.paths.find(
    (candidate) =>
      candidate.actionId === action.actionId &&
      candidate.actionType === action.type &&
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
      : [
          ...(reasons.length > 0
            ? reasons
            : ["unsafe_score_unknown_higher_priority"]),
          ...terminalOutcomeEvidence(false),
          ...path.evidence,
        ],
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

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "de"),
  );
}
