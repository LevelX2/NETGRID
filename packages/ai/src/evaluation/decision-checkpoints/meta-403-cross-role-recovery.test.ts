import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-cross-role-recovery.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("SP-288 installs the visible Code Gate answer that funds the whole mixed ICE path", () => {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  expect(input.playerView.stateVersion).toBe(274);
  const install = input.legalActions.find(
    (action) =>
      action.type === "install_card" &&
      action.source === "runner_onr_v1_014_codecracker_1" &&
      !action.payload?.runnerProgramTrashBeforeInstall,
  )!;
  expect(install).toBeDefined();
  expect(chooseAiAction(input)).toMatchObject({
    actionId: install.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        leafExecutorInstanceId:
          "plan:runner.rig_and_coverage:coverage%3Abreaker_code_gate%3Aefficiency%3Aremote_1",
        route: { actionId: install.actionId },
      },
    },
  });
});

it("does not bind the cheaper hand answer without a current legal installation", () => {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  input.legalActions = input.legalActions.filter(
    (action) => action.source !== "runner_onr_v1_014_codecracker_1",
  );
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const result = chooseAiAction(input);
  expect(result.actionId).toBe("runner.draw_card");
  expect(result.fallbackUsed).toBe(false);
  expect(
    input.legalActions.some((action) => action.actionId === result.actionId),
  ).toBe(true);
});
