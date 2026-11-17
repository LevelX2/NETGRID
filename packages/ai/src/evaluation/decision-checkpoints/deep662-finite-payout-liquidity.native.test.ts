import { readFileSync } from "node:fs";
import { canonicalCapabilityId, capabilityKey } from "@netgrid/cards";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

const payoutCapability = canonicalCapabilityId(390, capabilityKey("abilities_activated_runner_main_take_hosted_credits"));

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
      a.abilityRef?.sourceAbilityId === payoutCapability,
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
    "plan:runner.credit_bank:c2eq",
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
  expect(input.legalActions.some((a) => a.abilityRef?.sourceAbilityId === payoutCapability)).toBe(true);
  const decision = chooseAiAction(input);
  const action = input.legalActions.find((a) => a.actionId === decision.actionId);
  expect(action).toMatchObject({ type: "play_event", payload: { serverId: "hq" } });
  expect(decision.decisionDebug!.planFirstDecision!.rootPlanInstanceId).toBe(
    "plan:runner.pressure_central:central%3Ahq",
  );
  const targets = evaluateRunnerRunTargets({ input });
  expect(targets.find((target) => target.actionId === action?.actionId)).toMatchObject({
    creditsAfterRun: 14,
    fundingNeed: { reason: "none" },
  });
  const rdVariant = input.legalActions.find(
    (candidate) => candidate.source === action?.source && candidate.payload?.serverId === "rd",
  );
  expect(targets.find((target) => target.actionId === rdVariant?.actionId)).toMatchObject({
    creditsAfterRun: 11,
    fundingNeed: { reason: "none" },
  });
});
