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
  const missingCredits = creditBase?.topBlockedHandCandidate?.missingCredits;
  const nearTermFundingTarget =
    creditBase?.fundingNeed === true &&
    missingCredits !== undefined &&
    missingCredits <= 2;
  if (
    runnerMeaningfulRunOpportunityAvailable(context) &&
    !nearTermFundingTarget
  ) {
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
  const basicDrawActionAvailable = context.input.legalActions.some(
    (action) => action.type === "draw_card",
  );
  const longBasicCreditFundingHorizon =
    creditBase?.fundingNeed === true &&
    creditBase.usefulHandCardsBlockedByCredits > 0 &&
    missingCredits !== undefined &&
    missingCredits >= 4 &&
    (context.runnerEconomyPosture?.preferredEconomyRoute ===
      "basic_credit_fallback" ||
      context.runnerEconomyPosture?.preferredEconomyRoute ===
        "draw_for_economy") &&
    basicDrawActionAvailable &&
    !drawOverflowCreditPressure;
  return [
    createTacticalPlan({
      planId: "runner.build_credit_base",
      side: "runner",
      type: "runner.build_credit_base",
      status: "active",
      priority,
      horizonTurns: longBasicCreditFundingHorizon ? 2 : 1,
      target: { kind: "capability", id: "runner_credit_base" },
      currentStep: createPlanStep({
        stepId: longBasicCreditFundingHorizon
          ? "draw_for_answer:runner_credit_base"
          : "gain_credits:runner_credit_base",
        kind: longBasicCreditFundingHorizon
          ? "draw_for_answer"
          : "gain_credits",
        desiredActionSemantics: longBasicCreditFundingHorizon
          ? ["draw.card"]
          : ["economy.gain_credit"],
        rationale: [
          creditBase
            ? `creditbase recommends ${creditBase.recommendation}`
            : "hand limit pressure makes credits safer than another draw",
          creditBase
            ? `desired reserve ${creditBase.desiredCreditReserve}`
            : "draw overflow pressure is high",
          ...(longBasicCreditFundingHorizon
            ? [
                `basic credit fallback is ${missingCredits} clicks from the funding target`,
                "draw for a more efficient economy route",
              ]
            : []),
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
              `credit_base_top_missing_credits:${missingCredits ?? 0}`,
              `credit_base_long_basic_credit_horizon:${longBasicCreditFundingHorizon}`,
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
