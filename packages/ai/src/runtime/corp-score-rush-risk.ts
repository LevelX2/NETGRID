import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { scoringWindowAccessAssessment } from "./corp-scoreline/semantic-runtime-corp-scoring-window-runner-pressure";

export type CorpScoreRushRiskAssessment = Readonly<{
  admission: "accepted" | "rejected" | "unknown";
  reason:
    | "runner_cannot_reach_before_score"
    | "bounded_one_point_economic_pressure"
    | "unmodeled_access_path"
    | "terminal_steal_risk"
    | "multi_point_steal_risk"
    | "score_horizon_too_slow"
    | "insufficient_path_pressure";
  runnerContestCreditsBeforeScore: number;
  visibleBreakCost?: number;
  remainingAdvancementClicks: number;
  evidence: readonly string[];
}>;

/**
 * Evaluates an intentional remote-score risk from public, action-independent
 * facts. corp.score_agenda owns this admission; corp.defend_servers may only
 * supply the projected server/ICE facts and later execute a selected support
 * step. The four extra credits model the Runner's ordinary next-turn action
 * capacity; public run-credit pools and bank withdrawals are added by the
 * shared scoring-window access projection.
 */
export function assessCorpScoreRushRisk(params: {
  input: AiDecisionInput;
  server: Readonly<{
    id: string;
    ice: readonly VisibleCard[];
    root: readonly VisibleCard[];
  }>;
  agendaPoints: number;
  remainingAdvancementClicks: number;
}): CorpScoreRushRiskAssessment {
  const { input, server, agendaPoints, remainingAdvancementClicks } = params;
  const beforeScore = scoringWindowAccessAssessment(input, server, 4);
  const terminalSteal =
    input.playerView.opponent.agendaPoints + agendaPoints >=
    input.playerView.agendaPointsToWin;
  const evidence = [
    "corp_score_rush_risk_budget:v1",
    `rush_agenda_points:${agendaPoints}`,
    `rush_terminal_steal:${terminalSteal}`,
    `rush_remaining_advancement_clicks:${remainingAdvancementClicks}`,
    `rush_runner_contest_credits_before_score:${beforeScore.visibleRunnerContestCredits}`,
    `rush_runner_can_reach_before_score:${beforeScore.runnerCanReachAccessNow}`,
    `rush_agenda_steal_relevant_before_score:${beforeScore.agendaStealRelevantNow}`,
    ...(beforeScore.visibleBreakCost === undefined
      ? []
      : [`rush_visible_break_cost:${beforeScore.visibleBreakCost}`]),
    ...beforeScore.evidence,
  ];
  const result = (
    admission: CorpScoreRushRiskAssessment["admission"],
    reason: CorpScoreRushRiskAssessment["reason"],
  ): CorpScoreRushRiskAssessment => ({
    admission,
    reason,
    runnerContestCreditsBeforeScore: beforeScore.visibleRunnerContestCredits,
    ...(beforeScore.visibleBreakCost !== undefined
      ? { visibleBreakCost: beforeScore.visibleBreakCost }
      : {}),
    remainingAdvancementClicks,
    evidence: [...evidence, `rush_admission:${admission}:${reason}`],
  });

  if (beforeScore.unmodeledIceCount > 0) {
    return result("unknown", "unmodeled_access_path");
  }
  if (
    !beforeScore.runnerCanReachAccessNow ||
    !beforeScore.agendaStealRelevantNow
  ) {
    return result("accepted", "runner_cannot_reach_before_score");
  }
  if (terminalSteal) return result("rejected", "terminal_steal_risk");
  if (agendaPoints > 1) return result("rejected", "multi_point_steal_risk");
  // A one-point rush remains an explicit option only when it can be scored on
  // the next Corp turn and the projected path consumes at least half of the
  // Runner's visible contest budget. This is an economic pressure comparison,
  // not an ICE-count or card-identity rule.
  if (remainingAdvancementClicks > 3) {
    return result("rejected", "score_horizon_too_slow");
  }
  if (
    beforeScore.visibleBreakCost !== undefined &&
    beforeScore.visibleBreakCost > 0 &&
    beforeScore.visibleBreakCost * 2 >=
      beforeScore.visibleRunnerContestCredits
  ) {
    return result("accepted", "bounded_one_point_economic_pressure");
  }
  return result("rejected", "insufficient_path_pressure");
}
