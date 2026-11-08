import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
function native(file: string) {
  const cp = JSON.parse(
    readFileSync(new URL(`./fixtures/${file}.json`, import.meta.url), "utf8"),
  ).checkpoint;
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input: AiDecisionInputWithDeckCapabilities = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return input;
}
it("binds a stronger last finite bank payout to the current P6 liquidity need", () => {
  const input = native("deep662-d62-last-finite-payout");
  const action = input.legalActions.find(
    (a) =>
      a.type === "activated_card_ability" && a.actionId.includes("contract"),
  )!;
  const before = JSON.stringify({
    view: input.playerView,
    legal: input.legalActions,
  });
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(action.actionId);
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toBe(
    "plan:runner.economy:economy-liquidity-development%3Arunner%3A9",
  );
  expect(plan.leafExecutorInstanceId).toBe(
    "plan:runner.credit_bank:runner_onr_v1_178_short-term-contract_2",
  );
  expect(plan.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: 61,
  });
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(
    JSON.stringify({ view: input.playerView, legal: input.legalActions }),
  ).toBe(before);
});
it("keeps a real higher-priority run ahead of residual bank liquidation", () => {
  const input = native("deep662-d270-effective-access-priority");
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(
    "runner.play_event.runner_onr_v1_094_inside-job_1.hq.runner_onr_v1_094_inside-job_1.onr_v1_094_inside-job:abilities_on_play_make_run",
  );
  expect(decision.decisionDebug!.planFirstDecision!.rootPlanInstanceId).toBe(
    "plan:runner.pressure_central:central%3Ahq",
  );
});
