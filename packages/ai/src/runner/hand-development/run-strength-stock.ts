import type { AiDecisionInput } from "@netgrid/shared";
import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import {
  breakerCardBlocksAccessReachability,
  getStructuredBreakerProfileForCard,
} from "../../breaker-ontology-consumer";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import type { RunnerHandDevelopmentEvaluation } from "./runner-hand-development-types";

/** A bounded inventory option owned by development, not a current run quote.
 * Installation buys readiness for one later run; no future saving is cash.
 */
export function assessRunStrengthStock(
  input: AiDecisionInput,
  evaluation: RunnerHandDevelopmentEvaluation,
  targets: readonly RunnerRunTargetEvaluation[],
  economy: RunnerEconomyPosture,
) {
  const mechanic = evaluation.definitionId
    ? cardSpecPlanningCardByDefinitionId(evaluation.definitionId)?.planning
        .engine.runnerRunStrengthBoost
    : undefined;
  if (!mechanic) return undefined;
  const defer = (reason: string) => ({
    admitted: false,
    priorityClass: "P5" as const,
    value: 0,
    evidenceCodes: [`runner_run_strength_stock_deferred:${reason}`],
  });
  const own = input.playerView.own;
  if (input.playerView.timingPoint !== "runner_action.main")
    return defer("not_ordinary_development_window");
  const action = input.legalActions.find(
    (a) =>
      a.actionId === evaluation.legalActionId &&
      a.type === "install_card" &&
      a.side === "runner" &&
      a.source === evaluation.cardInstanceId &&
      a.expiresAtStateVersion === input.playerView.stateVersion,
  );
  const card = own.gripOrHq.find(
    (c) => c.known && c.instanceId === evaluation.cardInstanceId,
  );
  if (
    !action ||
    !card ||
    action.payload?.runnerProgramTrashBeforeInstall === true ||
    action.targetRequirements.length > 0 ||
    (action.choiceRequirements?.length ?? 0) > 0 ||
    !Number.isSafeInteger(card.memoryCost) ||
    !Number.isSafeInteger(own.memoryUsed) ||
    !Number.isSafeInteger(own.memoryLimit) ||
    own.memoryUsed! + card.memoryCost! > own.memoryLimit!
  )
    return defer("no_direct_install_capacity");
  const credits = action.costs.reduce((n, c) => n + (c.credits ?? 0), 0);
  const clicks = action.costs.reduce((n, c) => n + (c.clicks ?? 0), 0);
  if (clicks > own.clicks || own.credits - credits < economy.minimumCreditFloor)
    return defer("preserve_resources");
  if (
    own.tags > 0 ||
    own.stackOrRdCount < 2 ||
    input.playerView.opponent.deckCount < 2 ||
    targets.some(
      (t) =>
        t.scoreThreat ||
        t.accessPayoff === "agenda" ||
        t.accessPayoff === "score_threat",
    )
  )
    return defer("urgent_or_short_horizon");
  if (
    mechanic.cost.trashSelf !== true ||
    mechanic.cost.tap === true ||
    mechanic.amount <= 0 ||
    mechanic.target !== "installed_runner_icebreaker" ||
    mechanic.timing !== "during_ice_encounter" ||
    mechanic.duration !== "current_run"
  )
    return defer("unsupported_stock_cost");
  const rig = own.rig ?? [];
  // One unspent consumable is inventory already. Reassess after it is used;
  // do not consume the rest of the rig's MU with speculative extra copies.
  if (
    rig.some(
      (c) =>
        c.known &&
        c.definitionId &&
        cardSpecPlanningCardByDefinitionId(c.definitionId)?.planning.engine
          .runnerRunStrengthBoost,
    )
  )
    return defer("stock_already_installed");
  const consumer = rig.find((c) => {
    const profile = getStructuredBreakerProfileForCard(c.definitionId);
    return (
      c.known &&
      c.type === "program" &&
      !breakerCardBlocksAccessReachability(c.definitionId) &&
      (profile?.coverage?.length ?? 0) > 0 &&
      (profile?.pumpCost ?? 0) > 0
    );
  });
  if (!consumer) return defer("no_installed_pumping_consumer");
  // Policy value of keeping a useful consumable ready. No invented ICE,
  // guaranteed number of encounters, or summed mutually exclusive savings.
  const value = Math.min(
    80,
    Math.round(mechanic.amount * 30 - credits * 10 - clicks * 10),
  );
  if (value <= 0) return defer("investment_too_expensive");
  return {
    admitted: true,
    priorityClass: "P5" as const,
    value,
    evidenceCodes: [
      "runner_run_strength_stock_option",
      `runner_run_strength_stock_consumer:${consumer.instanceId}`,
      `runner_run_strength_stock_amount:${mechanic.amount}`,
      "runner_run_strength_stock_horizon:one_conditional_future_run",
      "runner_run_strength_stock_future_savings_not_spendable",
    ],
  };
}
