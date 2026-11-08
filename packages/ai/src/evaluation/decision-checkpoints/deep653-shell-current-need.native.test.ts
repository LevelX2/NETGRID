import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { aiLiveRuntimeDependencies } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { createAiLiveRuntimeComposition } from "../../runtime/ai-live-runtime-composition";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function native(index: number, label: string) {
  const fixture = JSON.parse(readFileSync(new URL(
    `./fixtures/deep653-d${index}-${label}.json`, import.meta.url,
  ), "utf8"));
  expect(Object.values(fixture.checkpoint.validation)).toEqual(Array(9).fill(true));
  const cp = fixture.checkpoint;
  const input: AiDecisionInputWithDeckCapabilities = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, cp.runtime);
  return { fixture, input };
}

it.each([
  [188, "onr_v1_146_zetatech-mem-chip"],
  [356, "onr_v1_145_wutech-mem-chip"],
])("does not revive the final rejected rig demand through delayed preparation at D%s", (index, definitionId) => {
  const { fixture, input } = native(Number(index), "unused-shell-memory");
  const frames: Array<{ projected: boolean; currentNeed: string | undefined }> = [];
  const runtime = createAiLiveRuntimeComposition({
    ...aiLiveRuntimeDependencies,
    evaluateRunnerHandDevelopment: (args, prepared) => {
      const evaluations = aiLiveRuntimeDependencies.evaluateRunnerHandDevelopment(args, prepared);
      frames.push({
        projected: args.rigDemandProjection !== undefined,
        currentNeed: evaluations.find((e) => e.definitionId === definitionId)?.currentNeed,
      });
      return evaluations;
    },
  });
  const before = JSON.stringify(input);
  const decision = runtime.chooseAiAction(input, { persistTacticalPlanMemory: false });
  expect(frames.at(-1)).toEqual({ projected: true, currentNeed: "none" });
  expect(decision.actionId).not.toBe(fixture.historicalActionId);
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.dispositions).toContainEqual(expect.objectContaining({
    actionId: fixture.historicalActionId,
    ownerModuleId: "runner.shell_traders_pipeline",
    disposition: "explicitly_nonproductive",
    evidenceCode: "runner_shell_traders_rejected_no_current_target_need",
  }));
  expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(true);
  expect(plan.route).toMatchObject({ actionId: decision.actionId, stateVersion: input.playerView.stateVersion });
  expect(plan.selectedStep?.planInstanceId).toBe(plan.leafExecutorInstanceId);
  expect(JSON.stringify(input)).toBe(before);
});

it("preserves the native delayed breaker investment independently of immediate memory demand", () => {
  const { fixture, input } = native(136, "needed-shell-breaker");
  const runtime = createAiLiveRuntimeComposition(aiLiveRuntimeDependencies);
  const decision = runtime.chooseAiAction(input, { persistTacticalPlanMemory: false });
  expect(decision.actionId).toBe(fixture.historicalActionId);
  expect(decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId)
    .toBe("runner.shell_traders_pipeline");
  const line = decision.decisionDebug!.planFirstDecision!.turnPlanning!.consideredLines!
    .find((line) => line.firstActionId === decision.actionId && line.stepCount === 1)!;
  expect(line.projectedEndState).toMatchObject({ handMinimum: 3, handMaximum: 3 });
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});
