import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory, residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function fixture(key: string, adjust?: (input: AiDecisionInputWithDeckCapabilities) => void) {
  const cp = JSON.parse(readFileSync(new URL(`../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-505-${key}.json`, import.meta.url), "utf8"));
  expect(Object.values(cp.validation).every(value => value === true)).toBe(true);
  const input: AiDecisionInputWithDeckCapabilities = structuredClone(cp.input);
  adjust?.(input);
  Object.assign(input, buildAiDecisionInputDto(input));
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, cp.runtime);
  return input;
}

it.each([
  ["g11d289", "end_turn", "runner.defense_and_recovery"],
  ["g13d53", "gain_credit", "runner.defense_and_recovery"],
  ["g14d74", "draw_card", "runner.defense_and_recovery"],
  ["g18d93", "draw_card", "runner.defense_and_recovery"],
  ["g33d55", "draw_card", "runner.defense_and_recovery"],
  ["g36d60", "draw_card", "runner.defense_and_recovery"],
  ["g17d363", "pump_breaker", "runner.convert_run_window"],
  ["g35d445", "play_event", "runner.contest_remote"],
])("keeps exact native %s owned and executable", (key, type, owner) => {
  const input = fixture(key);
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(a => a.actionId === decision.actionId);
  expect(action?.type).toBe(type);
  expect(action?.expiresAtStateVersion).toBe(input.playerView.stateVersion);
  expect(decision.fallbackUsed).toBe(false);
  const plan = decision.decisionDebug?.planFirstDecision;
  expect(plan?.selectedPlan?.moduleId).toBe(owner);
  expect(plan?.route?.actionId).toBe(action?.actionId);
  expect(plan?.route?.stateVersion).toBe(input.playerView.stateVersion);
  expect(plan?.route?.planInstanceId).toBe(plan?.leafExecutorInstanceId);
  expect(plan?.route?.stepId).toBe(plan?.selectedStep?.stepId);
});

it("does not create a preparation binding for the sole known damage ambush", () => {
  const input = fixture("g11d289");
  chooseAiAction(input);
  const contests = residentPlanPortfolioSnapshot(input)?.instances.filter(i => i.moduleId === "runner.contest_remote") ?? [];
  expect(contests).toHaveLength(1);
  expect(JSON.stringify(contests[0]?.moduleState)).not.toContain("targetedIceTrashCommitment");
});

it("still clears all payable tags before building an ordinary hand buffer", () => {
  const input = fixture("g14d74", input => { input.playerView.own.tags = 1; });
  const decision = chooseAiAction(input);
  expect(input.legalActions.find(a => a.actionId === decision.actionId)?.type).toBe("remove_tag");
  expect(decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe("runner.defense_and_recovery");
});

it("rejects the cumulative mitigation when the full current break is unaffordable", () => {
  const input = fixture("g17d363", input => { input.playerView.own.credits = 7; });
  const decision = chooseAiAction(input);
  expect(input.legalActions.find(a => a.actionId === decision.actionId)?.type).toBe("continue_run");
  expect(decision.fallbackUsed).toBe(false);
});
