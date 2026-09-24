import type { AiDecisionInput } from "@netgrid/shared";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
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
  if (!successfulRunStrengthCounter(evaluation.definitionId)) return undefined;
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
      a.side === "runner" &&
      a.source === evaluation.cardInstanceId &&
      a.expiresAtStateVersion === input.playerView.stateVersion,
  );
  if (
    !support ||
    !action ||
    action.payload?.runnerProgramTrashBeforeInstall ||
    action.targetRequirements.length ||
    action.choiceRequirements?.length ||
    action.costs.reduce((n, c) => n + (c.clicks ?? 0), 0) >
      input.playerView.own.clicks ||
    input.playerView.own.credits -
      action.costs.reduce((n, c) => n + (c.credits ?? 0), 0) <
      economy.minimumCreditFloor ||
    input.playerView.own.memoryUsed! + support.memoryUnits >
      input.playerView.own.memoryLimit! ||
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
