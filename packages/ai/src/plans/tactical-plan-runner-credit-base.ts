import {
  assessRunnerDrawOverflow,
  runnerDrawOverflowCreditPriorityBoost,
  runnerDrawOverflowEvidence,
  runnerDrawOverflowRationale,
  runnerDrawOverflowSupportsCreditPlan,
} from "./runner-draw-overflow";
import {
  legalActionCreditGainForPlan,
  type TacticalPlanCreditValueDependencies,
} from "./tactical-plan-action-values";
import {
  createPlanStep,
  createTacticalPlan,
} from "./tactical-plan-builders";
import { runnerMeaningfulRunOpportunityAvailable } from "./tactical-plan-runner-support-actions";
import type {
  TacticalPlan,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";

export function runnerCreditBasePlans(
  context: TacticalPlanBuildContext,
  stateVersion: number,
  runnerGoalEvidence: readonly string[],
  dependencies: TacticalPlanCreditValueDependencies,
): TacticalPlan[] {
  const creditBase = context.runnerEconomyPosture?.creditBasePlan;
  if (
    !context.input.legalActions.some(
      (action) =>
        legalActionCreditGainForPlan(context.input, action, dependencies) > 0,
    )
  ) {
    return [];
  }
  const drawOverflow = assessRunnerDrawOverflow(context);
  const drawOverflowCreditPressure =
    drawOverflow && runnerDrawOverflowSupportsCreditPlan(drawOverflow);
  if (runnerMeaningfulRunOpportunityAvailable(context)) {
    return [];
  }
  if (
    (!creditBase || creditBase.economyPriority === "low") &&
    !drawOverflowCreditPressure
  ) {
    return [];
  }
  const basePriority = creditBase
    ? creditBase.economyPriority === "high" ? 930 :
      creditBase.economyPriority === "medium" ? 820 :
      650
    : 650;
  const overflowBoost = drawOverflowCreditPressure
    ? runnerDrawOverflowCreditPriorityBoost(drawOverflow)
    : 0;
  const priority = Math.min(940, basePriority + overflowBoost);
  return [
    createTacticalPlan({
      planId: "runner.build_credit_base",
      side: "runner",
      type: "runner.build_credit_base",
      status: "active",
      priority,
      horizonTurns: 1,
      target: { kind: "capability", id: "runner_credit_base" },
      currentStep: createPlanStep({
        stepId: "gain_credits:runner_credit_base",
        kind: "gain_credits",
        desiredActionSemantics: ["economy.gain_credit"],
        rationale: [
          creditBase
            ? `creditbase recommends ${creditBase.recommendation}`
            : "hand limit pressure makes credits safer than another draw",
          creditBase
            ? `desired reserve ${creditBase.desiredCreditReserve}`
            : "draw overflow pressure is high",
          ...(drawOverflowCreditPressure
            ? runnerDrawOverflowRationale(drawOverflow)
            : []),
        ],
      }),
      evidence: [
        ...(creditBase
          ? [
              `credit_base_recommendation:${creditBase.recommendation}`,
              `credit_base_priority:${creditBase.economyPriority}`,
              `credit_base_funding_need:${creditBase.fundingNeed}`,
              `credit_base_desired_reserve:${creditBase.desiredCreditReserve}`,
              `credit_reserve_remote_score_threat:${creditBase.creditReservePolicy.remoteScoreThreat}`,
              `credit_reserve_contest:${creditBase.creditReservePolicy.contestReserve}`,
              `credit_reserve_below_now:${creditBase.creditReservePolicy.belowReserveNow}`,
              `credit_base_blocked_hand_cards:${creditBase.usefulHandCardsBlockedByCredits}`,
              `economy_route:${context.runnerEconomyPosture?.preferredEconomyRoute ?? "unknown"}`,
            ]
          : ["credit_base_recommendation:avoid_overdraw"]),
        ...(drawOverflowCreditPressure
          ? runnerDrawOverflowEvidence(drawOverflow)
          : []),
        ...runnerGoalEvidence,
      ],
      scoreBreakdown: [
        {
          key: "runner_credit_base",
          label: "Runner creditbase",
          value: priority,
          reason: creditBase?.recommendation ?? "avoid_overdraw",
        },
      ],
      stateVersion,
    }),
  ];
}
