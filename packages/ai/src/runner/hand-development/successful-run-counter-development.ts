import type { AiDecisionInput } from "@netgrid/shared";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { actionMatchesCurrentDecision } from "../../actions/current-legal-action";
import { actionClickCost, actionCreditCost } from "../../runtime/action-cost";
import type { RunnerHandDevelopmentEvaluation } from "./runner-hand-development-types";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import {
  strategicSupportPrograms,
  successfulRunStrengthCounter,
} from "./strategic-support-development";

/** Admission of one conditional future-run investment by the development owner.
 * This is preparedness value, never a current-run discount or guaranteed purge.
 */
export function assessSuccessfulRunCounterDevelopment(
  input: AiDecisionInput,
  evaluation: RunnerHandDevelopmentEvaluation,
  targets: readonly RunnerRunTargetEvaluation[],
  economy: RunnerEconomyPosture,
) {
  if (
    input.side !== "runner" ||
    !successfulRunStrengthCounter(evaluation.definitionId)
  )
    return undefined;
  const deferred = {
    admitted: false,
    value: 0,
    priorityClass: "P5" as const,
    evidenceCodes: [
      "runner_success_counter_deferred_no_safe_stock_opportunity",
    ],
  };
  const support = strategicSupportPrograms(
    input,
    economy.minimumCreditFloor,
    (input as AiDecisionInputWithDeckCapabilities).ownRunnerStrategicIntent,
  ).find((s) => s.card.instanceId === evaluation.cardInstanceId);
  const action = input.legalActions.find(
    (a) =>
      a.actionId === evaluation.legalActionId &&
      a.type === "install_card" &&
      a.source === evaluation.cardInstanceId &&
      actionMatchesCurrentDecision(input, a),
  );
  if (!support || !action) return deferred;
  const { memoryUsed, memoryLimit } = input.playerView.own;
  if (
    typeof memoryUsed !== "number" ||
    !Number.isSafeInteger(memoryUsed) ||
    memoryUsed < 0 ||
    typeof memoryLimit !== "number" ||
    !Number.isSafeInteger(memoryLimit) ||
    memoryLimit < 0
  ) {
    return {
      ...deferred,
      evidenceCodes: ["runner_success_counter_deferred_missing_memory_quote"],
    };
  }
  if (
    action.payload?.runnerProgramTrashBeforeInstall ||
    action.targetRequirements.length ||
    action.choiceRequirements?.length ||
    actionClickCost(action) > input.playerView.own.clicks ||
    input.playerView.own.credits - actionCreditCost(action) <
      economy.minimumCreditFloor ||
    memoryUsed + support.memoryUnits > memoryLimit ||
    targets.some(
      (t) =>
        t.scoreThreat ||
        t.accessPayoff === "agenda" ||
        t.accessPayoff === "score_threat",
    )
  )
    return deferred;
  return {
    admitted: true,
    value: support.value,
    priorityClass: "P5" as const,
    evidenceCodes: [
      "runner_success_counter_prepare_repeat_runs",
      `runner_success_counter_consumer:${support.consumerId}`,
      `runner_success_counter_strategy_bonus:${support.strategyBonus}`,
      "runner_success_counter_requires_successful_full_break",
      "runner_success_counter_future_savings_and_purge_not_guaranteed",
    ],
  };
}
