import type { AiDecisionInput } from "@netgrid/shared";

import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import type { RunnerRunPlan } from "./runner-run-plan-types";

export type RunnerRunReleaseDecision = {
  status: "released_guaranteed" | "released_conditional" | "blocked";
  acceptedRisks: string[];
  reason: string;
  evidence: string[];
};

export function runnerRunReleaseForEvaluation(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): RunnerRunReleaseDecision {
  const route = evaluation.routeQuote;
  if (!route) return legacyRunRelease(evaluation);
  const baseEvidence = [
    `run_release_route:${route.reachability}`,
    `run_release_recommendation:${evaluation.recommendation}`,
    `run_release_payoff:${evaluation.accessPayoff}`,
    `run_release_funding_gap:${route.fundingGap}`,
    ...route.conditionalReasons.map(
      (reason) => `run_release_conditional_reason:${reason}`,
    ),
  ];
  if (route.reachability === "no_access") {
    return blocked("route_no_access", baseEvidence);
  }
  if (route.reachability === "guaranteed_access") {
    if (evaluation.pathPassability !== "reachable") {
      return blocked("guaranteed_route_path_mismatch", baseEvidence);
    }
    return {
      status: "released_guaranteed",
      acceptedRisks: [],
      reason: "guaranteed_access_released",
      evidence: [...baseEvidence, "run_release_guaranteed:true"],
    };
  }

  if (route.effects.some((effect) => effect.canEndGameBeforeAccess)) {
    return blocked("flatline_risk_before_access", baseEvidence);
  }
  if (!runRecommendationReleasesNow(evaluation)) {
    return blocked(`recommendation_${evaluation.recommendation}`, baseEvidence);
  }
  const unknownOnlyProbe =
    route.unknownIceCount > 0 &&
    route.fundingGap === 0 &&
    route.conditionalReasons.length > 0 &&
    route.conditionalReasons.every(
      (reason) => reason === "unknown_ice_on_route",
    ) &&
    evaluation.knownAccessState !== "known_no_current_payoff" &&
    evaluation.unrezzedIceRiskUnderfunded !== true &&
    evaluation.creditsAfterRun >= 0;
  const agendaRisk =
    (evaluation.accessPayoff === "agenda" ||
      evaluation.accessPayoff === "score_threat" ||
      evaluation.scoreThreat) &&
    evaluation.recommendation === "run_now";
  const probabilisticBreakerRoute =
    route.conditionalReasons.length > 0 &&
    route.conditionalReasons.every(
      (reason) => reason === "probabilistic_breaker_route",
    ) &&
    evaluation.blinkRiskAssessment?.pathDependsOnBlink === true &&
    evaluation.blinkRiskAssessment.blockedByHandBuffer !== true &&
    evaluation.blinkRiskAssessment.breakWouldBeExcludedInEncounter !== true;
  if (!unknownOnlyProbe && !agendaRisk && !probabilisticBreakerRoute) {
    return blocked("conditional_route_not_accepted", baseEvidence);
  }
  const acceptedRisks = route.conditionalReasons.map(
    (reason) => `conditional:${reason}`,
  );
  return {
    status: "released_conditional",
    acceptedRisks,
    reason: unknownOnlyProbe
      ? "bounded_unknown_ice_probe"
      : "agenda_risk_explicitly_accepted",
    evidence: [
      ...baseEvidence,
      `run_release_unknown_probe:${unknownOnlyProbe}`,
      `run_release_agenda_risk:${agendaRisk}`,
      `run_release_probabilistic_breaker:${probabilisticBreakerRoute}`,
      ...acceptedRisks.map((risk) => `run_release_accepted_risk:${risk}`),
      `run_release_runner_points:${visibleRunnerAgendaPoints(input)}`,
      `run_release_points_to_win:${input.playerView.agendaPointsToWin}`,
    ],
  };
}

export function runnerRunPlanAcceptsConditionalRoute(
  plan: RunnerRunPlan,
): boolean {
  return (
    plan.commitment?.route.reachability === "conditional_access" &&
    plan.commitment.acceptedRisks.length > 0
  );
}

function legacyRunRelease(
  evaluation: RunnerRunTargetEvaluation,
): RunnerRunReleaseDecision {
  if (evaluation.pathPassability !== "reachable") {
    return blocked("legacy_evaluation_not_released", [
      `run_release_legacy_path:${evaluation.pathPassability}`,
      `run_release_legacy_recommendation:${evaluation.recommendation}`,
    ]);
  }
  return {
    status: "released_guaranteed",
    acceptedRisks: [],
    reason: "legacy_reachable_run_released",
    evidence: ["run_release_legacy_reachable:true"],
  };
}

function runRecommendationReleasesNow(
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  return (
    evaluation.recommendation === "run_now" ||
    evaluation.recommendation === "run_if_free"
  );
}

function blocked(reason: string, evidence: string[]): RunnerRunReleaseDecision {
  return {
    status: "blocked",
    acceptedRisks: [],
    reason,
    evidence: [...evidence, `run_release_blocked:${reason}`],
  };
}

function visibleRunnerAgendaPoints(input: AiDecisionInput): number {
  const value = (input.playerView.own as { agendaPoints?: unknown })
    .agendaPoints;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  return (input.playerView.own.scoreArea ?? []).reduce(
    (sum, card) => sum + Math.max(0, Math.floor(card.agendaPoints ?? 0)),
    0,
  );
}
