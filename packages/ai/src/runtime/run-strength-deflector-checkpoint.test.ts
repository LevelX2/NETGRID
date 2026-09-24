import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../evaluation/decision-checkpoints/runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

it("keeps the admitted run-strength ability in the bound deflector break route", () => {
  const { input, runtime } = JSON.parse(
    readFileSync(
      new URL(
        "../../../../data/scenarios/ai-decision-checkpoints/cp-meta-467-r1-g2-d257.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const boost = input.legalActions.find(
    (action) => action.payload?.runnerAbility === "boost_icebreaker_for_run",
  )!;
  expect(boost).toBeDefined();
  expect(
    input.legalActions.some((action) => action.type === "pump_breaker"),
  ).toBe(true);
  const result = chooseAiAction(input);
  expect(result.actionId).toBe(boost.actionId);
  expect(result.fallbackUsed).toBe(false);
  expect(result.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
    selectedPlan: { moduleId: "runner.convert_run_window" },
    route: {
      actionId: boost.actionId,
      stateVersion: input.playerView.stateVersion,
      semanticActionType: "breaker.boost_strength",
    },
    executionOrigin: {
      rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
      leafPlanInstanceId: "plan:runner.convert_run_window:run%3Arun_255",
      stateVersion: input.playerView.stateVersion,
    },
  });
});
