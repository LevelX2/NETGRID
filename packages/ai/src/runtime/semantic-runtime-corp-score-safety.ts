import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

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
  scoreTerminalWindow: (
    input: AiDecisionInput,
  ) => CorpScoreTerminalWindowLike;
};

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
  const terminal = dependencies.scoreTerminalWindow(input);
  const scoreLegal = terminal.scoreActionIds.includes(action.actionId);
  const reasons = semanticRuntimeCorpUnsafeScoreReasons(terminal, scoreLegal);
  return {
    allowed: reasons.length === 0,
    evidence:
      reasons.length === 0
        ? [
            "corp_scoreline_safety_gate_passed:true",
            `protected_remote_ready:${terminal.protectedRemoteIds.length > 0}`,
            `runner_access_threat_high:${terminal.runnerAccessThreatHigh}`,
          ]
        : reasons,
  };
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
