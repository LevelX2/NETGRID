import { readFileSync } from "node:fs";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";

const cp = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-deep633-last-click-payoff-hand-floor-d53.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const install =
  "runner.install_card.runner_onr_v1_129_hq-interface_2.runner_onr_v1_129_hq-interface_2";
afterEach(resetResidentPlanPortfolioMemory);

function decide(variant: "native" | "surplus" | "remaining_click" = "native") {
  const source = structuredClone(cp.input);
  if (variant === "surplus")
    for (let i = 0; i < 3; i++)
      source.playerView.own.gripOrHq.push({
        ...structuredClone(source.playerView.own.gripOrHq[0]),
        instanceId: `public-fact-control-extra-temple-${i}`,
      });
  if (variant === "remaining_click") source.playerView.own.clicks = 2;
  const input: AiDecisionInputWithDeckCapabilities = {
    ...source,
    ...buildAiDecisionInputDto(source),
  };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(input.playerView);
  const result = chooseAiAction(input);
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(
    true,
  );
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  expect(JSON.stringify(input.playerView)).toBe(before);
  return result;
}

it("retains the built hand buffer below the confirmed floor instead of spending its last-click card on access payoff", () => {
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  expect(cp.input.playerView.own.gripOrHq).toHaveLength(2);
  expect(cp.input.playerView.own.clicks).toBe(1);
  const decision = decide();
  expect(decision.actionId).toBe("runner.draw_card");
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toBe(
    "plan:runner.defense_and_recovery:runner",
  );
  expect(plan.leafExecutorInstanceId).toBe(plan.rootPlanInstanceId);
  expect(plan.route).toMatchObject({
    actionId: "runner.draw_card",
    stateVersion: 52,
  });
  expect(
    plan.turnPlanning!.consideredLines!.some(
      (l) => l.firstActionId === install,
    ),
  ).toBe(false);
});

it("still installs payoff when five actual hand cards preserve the four-card floor", () => {
  const decision = decide("surplus");
  expect(decision.actionId).toBe(install);
  expect(decision.decisionDebug!.planFirstDecision!.rootPlanInstanceId).toBe(
    "plan:runner.pressure_central:central%3Ahq",
  );
});

it("retains the existing development horizon when another normal click remains", () => {
  expect(decide("remaining_click").actionId).toBe(install);
});
