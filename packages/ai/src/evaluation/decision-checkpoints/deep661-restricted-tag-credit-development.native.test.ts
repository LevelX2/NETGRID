import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { aiLiveRuntimeDependencies } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { createAiLiveRuntimeComposition } from "../../runtime/ai-live-runtime-composition";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

it("keeps tag-pool facts restricted through native plan and route selection", () => {
  const fixture = JSON.parse(readFileSync(new URL(
    "./fixtures/deep661-d62-tag-credit-pool.json", import.meta.url,
  ), "utf8"));
  const cp = fixture.checkpoint;
  expect(Object.keys(cp.validation)).toHaveLength(9);
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  const input: AiDecisionInputWithDeckCapabilities = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, cp.runtime);
  const frames: Array<{ projected: boolean; role: string; liquidity: string | undefined; coverage: string[] }> = [];
  const runtime = createAiLiveRuntimeComposition({
    ...aiLiveRuntimeDependencies,
    evaluateRunnerHandDevelopment: (args, prepared) => {
      const evaluations = aiLiveRuntimeDependencies.evaluateRunnerHandDevelopment(args, prepared);
      const source = evaluations.find((e) => e.definitionId === "onr_v1_120_armadillo-armored-road-home")!;
      frames.push({ projected: args.rigDemandProjection !== undefined,
        role: source.developmentRole, liquidity: source.liquidityTiming,
        coverage: source.persistentInstallEvaluation?.newFunctionalCoverage ?? [] });
      return evaluations;
    },
  });
  const before = JSON.stringify({ view: input.playerView, legal: input.legalActions });
  const result = runtime.chooseAiAction(input, { persistTacticalPlanMemory: false });
  expect(frames.at(-1)).toMatchObject({ projected: true, role: "defense_support", liquidity: "none" });
  expect(frames.at(-1)!.coverage).not.toContain("bank_tool");
  expect(frames.at(-1)!.coverage).not.toContain("economy_engine");
  expect(result.fallbackUsed || result.timeoutUsed).toBe(false);
  expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(true);
  const plan = result.decisionDebug!.planFirstDecision!;
  expect(plan.route).toMatchObject({ actionId: result.actionId, stateVersion: 61 });
  expect(plan.selectedStep?.planInstanceId).toBe(plan.leafExecutorInstanceId);
  expect(plan.route?.purpose).not.toContain("bank_tool");
  expect(JSON.stringify({ view: input.playerView, legal: input.legalActions })).toBe(before);
});
