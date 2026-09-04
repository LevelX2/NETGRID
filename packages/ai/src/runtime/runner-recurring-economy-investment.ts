import type { RunnerRunTargetEvaluation } from "../run-analysis/runner-run-target-types";

export type RunnerRecurringEconomyRunDecision = Readonly<{
  decision: "wait" | "allow_run" | "preempt_for_urgent_run";
  bestVisibleRunPayoff: number;
  evidenceCodes: string[];
}>;

export type RunnerRestrictedRunEconomyInvestmentDecision = Readonly<{
  decision: "install" | "hold";
  priorityClass: "P4" | "P5";
  value: number;
  projectedBreakEvenRuns: number;
  evidenceCodes: string[];
}>;

export function assessRunnerRestrictedRunEconomyInvestment(params: {
  engineLineActive: boolean;
  providerMatches: boolean;
  installedCompatibleBreakerCount: number;
  installCost: number;
  recurringCredits: number;
  clicksRemaining: number;
  runnerDeckCount: number;
  urgentRunAvailable: boolean;
}): RunnerRestrictedRunEconomyInvestmentDecision {
  const projectedBreakEvenRuns =
    params.recurringCredits > 0
      ? Math.ceil(params.installCost / params.recurringCredits)
      : Number.POSITIVE_INFINITY;
  const evidenceCodes = [
    `runner_restricted_run_economy_engine_line_active:${params.engineLineActive}`,
    `runner_restricted_run_economy_provider_matches:${params.providerMatches}`,
    `runner_restricted_run_economy_compatible_breakers:${params.installedCompatibleBreakerCount}`,
    `runner_restricted_run_economy_install_cost:${params.installCost}`,
    `runner_restricted_run_economy_recurring_credits:${params.recurringCredits}`,
    `runner_restricted_run_economy_break_even_runs:${Number.isFinite(projectedBreakEvenRuns) ? projectedBreakEvenRuns : "unknown"}`,
  ];
  const install =
    params.engineLineActive &&
    params.providerMatches &&
    params.installedCompatibleBreakerCount > 0 &&
    params.installCost >= 0 &&
    params.recurringCredits > 0 &&
    projectedBreakEvenRuns <= 3 &&
    params.clicksRemaining >= 2 &&
    params.runnerDeckCount > projectedBreakEvenRuns &&
    !params.urgentRunAvailable;
  if (!install) {
    return {
      decision: "hold",
      priorityClass: "P5",
      value: 0,
      projectedBreakEvenRuns,
      evidenceCodes: [
        "runner_restricted_run_economy_install_deferred",
        ...evidenceCodes,
        ...(params.installedCompatibleBreakerCount === 0
          ? [
              "runner_restricted_run_economy_requires_installed_compatible_breaker",
            ]
          : []),
        ...(params.urgentRunAvailable
          ? ["runner_restricted_run_economy_yields_to_urgent_run"]
          : []),
      ],
    };
  }
  return {
    decision: "install",
    priorityClass: "P4",
    value:
      200 +
      params.recurringCredits * 60 +
      Math.min(2, params.installedCompatibleBreakerCount) * 20 -
      params.installCost * 10,
    projectedBreakEvenRuns,
    evidenceCodes: [
      "runner_restricted_run_economy_install_ready",
      ...evidenceCodes,
    ],
  };
}

export function assessRunnerRecurringEconomyRunHorizon(params: {
  runTargets: readonly RunnerRunTargetEvaluation[];
  legalRunActionIds: ReadonlySet<string>;
  runnerAgendaPoints: number;
  opponentAgendaPoints: number;
  agendaPointsToWin: number;
  installCost: number;
  futureValueAtRisk: number;
  realizedValue: number;
  payoutStillUnrealized: boolean;
}): RunnerRecurringEconomyRunDecision {
  const reachable = params.runTargets.filter(
    (target) =>
      target.pathPassability === "reachable" &&
      params.legalRunActionIds.has(target.actionId),
  );
  const best = [...reachable].sort(
    (left, right) =>
      right.score - left.score || left.actionId.localeCompare(right.actionId),
  )[0];
  const bestVisibleRunPayoff = best?.score ?? 0;
  const opponentMatchpointRunPressure =
    params.opponentAgendaPoints >= params.agendaPointsToWin - 2 &&
    params.legalRunActionIds.size > 0;
  const urgent =
    opponentMatchpointRunPressure ||
    (best !== undefined &&
      (best.scoreThreat ||
        best.accessPayoff === "agenda" ||
        best.accessPayoff === "score_threat" ||
        (params.runnerAgendaPoints >= params.agendaPointsToWin - 2 &&
          best.recommendation === "run_now")));
  if (urgent) {
    return {
      decision: "preempt_for_urgent_run",
      bestVisibleRunPayoff,
      evidenceCodes: [
        `runner_recurring_economy_preempting_run_action:${best?.actionId ?? "legal_run_surface"}`,
        `runner_recurring_economy_preempting_run_payoff:${best?.accessPayoff ?? "unknown"}`,
        ...(opponentMatchpointRunPressure
          ? ["runner_recurring_economy_preempting_opponent_matchpoint"]
          : []),
      ],
    };
  }
  const valuableAfterPayout =
    !params.payoutStillUnrealized &&
    best !== undefined &&
    best.recommendation === "run_now" &&
    best.score > params.futureValueAtRisk * 100;
  if (valuableAfterPayout) {
    return {
      decision: "allow_run",
      bestVisibleRunPayoff,
      evidenceCodes: [
        `runner_recurring_economy_allowed_run_action:${best.actionId}`,
        `runner_recurring_economy_run_value_exceeds_future_value:${best.score}:${params.futureValueAtRisk * 100}`,
      ],
    };
  }
  const finiteInvestmentHorizonRecouped =
    best !== undefined &&
    params.realizedValue >= params.installCost + params.futureValueAtRisk * 2;
  if (finiteInvestmentHorizonRecouped) {
    return {
      decision: "allow_run",
      bestVisibleRunPayoff,
      evidenceCodes: [
        `runner_recurring_economy_allowed_run_action:${best.actionId}`,
        `runner_recurring_economy_investment_horizon_recouped:${params.realizedValue}:${params.installCost + params.futureValueAtRisk * 2}`,
      ],
    };
  }
  return {
    decision: "wait",
    bestVisibleRunPayoff,
    evidenceCodes: [
      params.payoutStillUnrealized
        ? "runner_recurring_economy_first_payout_not_realized"
        : "runner_recurring_economy_future_payout_beats_visible_run",
    ],
  };
}
