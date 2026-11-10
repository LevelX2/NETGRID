import { afterEach, expect, it } from "vitest";
import original from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p719-r03-g26-d349-hazard-bank.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

it("funds the terminal remote's quoted visible hazard despite its run_now recommendation", () => {
  const cp = structuredClone(original) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const bank = cp.input.legalActions.find((action) =>
    action.actionId.endsWith(":withdraw_credits"),
  )!;
  expect(bank).toBeDefined();
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(cp.input);
  const decision = chooseAiAction(cp.input);
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(decision.actionId).toBe(bank.actionId);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
    selectedPlan: {
      moduleId: "runner.credit_bank",
      parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      parentNeedId: "run-support:remote:remote_1",
    },
    route: {
      actionId: bank.actionId,
      stateVersion: cp.input.playerView.stateVersion,
    },
  });
  expect(JSON.stringify(cp.input)).toBe(before);
});
