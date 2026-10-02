import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";

afterEach(resetResidentPlanPortfolioMemory);

it("funds terminal HQ protection before ordinary progress on an already protected agenda", () => {
  const cp = JSON.parse(readFileSync(new URL(
    "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-473-g13-d531.json",
    import.meta.url,
  ), "utf8"));
  expect(Object.values(cp.validation).every(value => value === true)).toBe(true);
  const input: AiDecisionInput = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  expect(input.playerView.own.credits).toBe(3);
  expect(input.playerView.own.clicks).toBe(3);
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot.deckSnapshotId, cp.runtime);
  const funding = input.legalActions.find(a => a.type === "gain_credit")!;
  const result = chooseAiAction(input);
  expect(result.fallbackUsed).toBe(false);
  expect(result.actionId).toBe(funding.actionId);
  expect(result.reasonCode).toBe("plan_first.corp.economy");
  const plan = result.decisionDebug?.planFirstDecision;
  expect(plan?.rootPlanInstanceId).toMatch(/^plan:corp\.defend_servers:/);
  expect(plan?.leafExecutorInstanceId).toMatch(/^plan:corp\.economy:/);
  expect(plan?.route).toMatchObject({ actionId: funding.actionId, stateVersion: input.playerView.stateVersion });
  expect(result.evidence!.some(e => e.startsWith("plan_step_id:"))).toBe(true);
});
