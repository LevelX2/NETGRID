import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function native() {
  const cp = JSON.parse(readFileSync(new URL(
    "./fixtures/deep657-d55-score-effect-target.json", import.meta.url,
  ), "utf8")).checkpoint;
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input: AiDecisionInputWithDeckCapabilities = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, cp.runtime);
  return input;
}

it("uses a presently effective fort-strength variant under the native score owner", () => {
  const input = native(), before = JSON.stringify(input);
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(a => a.actionId === decision.actionId)!;
  expect(action.type).toBe("score_agenda");
  expect(action.source).toBe("corp_onr_v1_215_security-net-optimization_2");
  expect(input.playerView.servers.find(s => s.id === action.payload!.selectedServerId)!.ice.length).toBeGreaterThan(0);
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toBe("plan:corp.score_agenda:agenda%3Acorp_onr_v1_215_security-net-optimization_2%3Aremote_1");
  expect(plan.leafExecutorInstanceId).toBe(plan.rootPlanInstanceId);
  expect(plan.route).toMatchObject({ actionId: action.actionId, stateVersion: 54, capabilityId: "score_agenda" });
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(JSON.stringify(input)).toBe(before);
});

it("still scores when every fort currently has zero ICE in an explicit prospective companion", () => {
  const input = native();
  // The following altered board is a prospective control, not a new binding
  // claim for the original historical checkpoint.
  for (const server of input.playerView.servers) server.ice = [];
  const decision = chooseAiAction(input);
  expect(input.legalActions.find(a => a.actionId === decision.actionId)!.type).toBe("score_agenda");
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});

it("does not value future strength after an immediate win in an explicit terminal companion", () => {
  const input = native();
  input.playerView.own.agendaPoints = 4;
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(a => a.actionId === decision.actionId)!;
  expect(action.type).toBe("score_agenda");
  expect(action.payload!.selectedServerId).toBe("archives");
  expect(decision.decisionDebug!.planFirstDecision!.priority!.effectiveClass).toBe("P1");
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});

it("fails closed for a prospective score-strength variant with no bound selected fort", () => {
  const input = native();
  for (const action of input.legalActions) if (action.type === "score_agenda") delete action.payload!.selectedServerId;
  expect(() => chooseAiAction(input)).toThrow(/missing_action_semantics/);
});
