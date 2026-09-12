import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-g17-d80.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function inputWithCredits(credits: number) {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  input.playerView.own.credits = credits;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  return input;
}

it.each([8, 9])(
  "rejects four two-credit pumps when %i credits cannot also fund a break",
  (credits) => {
    const input = inputWithCredits(credits);
    const action = input.legalActions.find((a) => a.type === "continue_run")!;
    expect(chooseAiAction(input)).toMatchObject({
      actionId: action.actionId,
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
          leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_78",
          route: {
            actionId: action.actionId,
            stateVersion: input.playerView.stateVersion,
          },
        },
      },
    });
  },
);

it("retains a funded damage-mitigation pump under the same run owner", () => {
  const input = inputWithCredits(10);
  const action = input.legalActions.find((a) => a.type === "pump_breaker")!;
  expect(chooseAiAction(input)).toMatchObject({
    actionId: action.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
        leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_78",
        route: {
          actionId: action.actionId,
          stateVersion: input.playerView.stateVersion,
        },
      },
    },
  });
});

it("includes a spendable run credit in the complete pump and break budget", () => {
  const input = inputWithCredits(9);
  input.playerView.run!.badPublicityCredits = 1;
  const action = input.legalActions.find((a) => a.type === "pump_breaker")!;
  expect(chooseAiAction(input)).toMatchObject({
    actionId: action.actionId,
    fallbackUsed: false,
  });
});

it.each([10, 11])(
  "charges the Engine's additional break fee after pumping with %i credits",
  (credits) => {
    const input = inputWithCredits(credits);
    const encountered = input.playerView.run!.encounteredIce!;
    encountered.effectiveRunQuote!.breakSubroutineAdditionalCostPerSubroutine = 1;
    const onServer = input.playerView.servers
      .flatMap((s) => s.ice)
      .find((c) => c.instanceId === encountered.instanceId)!;
    onServer.effectiveRunQuote!.breakSubroutineAdditionalCostPerSubroutine = 1;
    const action = input.legalActions.find(
      (a) => a.type === (credits === 10 ? "continue_run" : "pump_breaker"),
    )!;
    expect(chooseAiAction(input)).toMatchObject({
      actionId: action.actionId,
      fallbackUsed: false,
    });
  },
);
