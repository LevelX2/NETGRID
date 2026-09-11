import { describe, expect, it } from "vitest";
import lateJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-420-declined-access-g8-d222.json";
import earlyJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-420-declined-access-g33-d43.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

describe("meta 420 declined access run ownership", () => {
  it.each([
    ["late last-click decision", lateJson],
    ["early full turn", earlyJson],
  ])("classifies every declined run in the %s", (_name, json) => {
    const { input, runtime } = structuredClone(json) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const result = chooseAiAction(input);
    expect(result.fallbackUsed).toBe(false);
    expect(
      input.legalActions.some((action) => action.actionId === result.actionId),
    ).toBe(true);
    expect(result.actionId).not.toBe("runner.start_run.remote_1");
    const plan = result.decisionDebug!.planFirstDecision!;
    expect(plan.selectedStep!.planInstanceId).toBe(
      plan.selectedPlan!.instanceId,
    );
    expect(
      result.decisionDebug?.actionAlternatives
        ?.find((action) => action.actionId === "runner.start_run.remote_1")
        ?.whyNot?.join(" "),
    ).toContain("runner_remote_run_declined_trash_memory_active:remote_1");
  });
});
