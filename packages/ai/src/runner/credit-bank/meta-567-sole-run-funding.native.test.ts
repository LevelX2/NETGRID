import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
function decide(name: string) {
  const fixture = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/" + name,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(fixture.validation)).toEqual(Array(9).fill(true));
  const { input, runtime } = fixture;
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const before = JSON.stringify(input),
    result = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(result).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  const action = input.legalActions.find((a) => a.actionId === result.actionId);
  expect(action).toBeDefined();
  return {
    input,
    result,
    action,
    portfolio: residentPlanPortfolioSnapshot(input)!,
  };
}
afterEach(resetResidentPlanPortfolioMemory);
it("funds the admitted same-turn HQ run from a mature bank when basic income cannot fit", () => {
  const { input, result, action, portfolio } = decide(
    "cp-meta567-broker-sole-run-funding.json",
  );
  expect(input.playerView.own).toMatchObject({ credits: 6, clicks: 2 });
  expect(action).toMatchObject({
    type: "activated_card_ability",
    source: "runner_onr_v1_154_broker_1",
    payload: { cardImplementationAbilityKey: "withdraw_credits" },
  });
  expect(result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "runner.credit_bank",
  );
  expect(
    portfolio.instances.find((p) => p.moduleId === "runner.credit_bank")
      ?.moduleState,
  ).toMatchObject({
    phase: "cash_out",
    signal: {
      estimatedPayout: 9,
      priorityClass: "P4",
      runFunding: {
        parentPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
        needId: "run-support:central:hq",
        runActionId: "runner.start_run.hq",
        stateVersion: 90,
        gap: 8,
        routeAssessment: {
          totalClickCost: 1,
          status: "covered_guaranteed",
          firstStepActionId: result.actionId,
        },
      },
    },
  });
});
it("keeps the last remaining action for the admitted run instead of inserting a payout", () => {
  const { result, action } = decide("cp-meta567-broker-last-action-run.json");
  expect(action).toMatchObject({
    type: "play_event",
    payload: { serverId: "hq" },
  });
  expect(result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "runner.pressure_central",
  );
});
