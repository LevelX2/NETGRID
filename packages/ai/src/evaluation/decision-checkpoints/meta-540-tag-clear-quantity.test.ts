import { beforeEach, expect, it } from "vitest";
import native from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-540-r2-g26-d191-tag-clear-quantity.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { AiRuntimeCheckpointV1 } from "./runtime-checkpoint";

beforeEach(resetResidentPlanPortfolioMemory);

function currentInput() {
  expect(Object.values(native.checkpoint.validation).every(Boolean)).toBe(true);
  expect(Object.values(native.precedingCheckpoint.validation).every(Boolean)).toBe(true);
  const input = structuredClone(native.checkpoint.input) as unknown as AiDecisionInputWithDeckCapabilities;
  // The historical AI DTO omitted the quantity. Reproject the exact captured
  // Engine payloads through today's DTO; never invent a historical action.
  const actions = input.legalActions.map(action => {
    const captured = native.engineLegalActions.find(a => a.actionId === action.actionId)!;
    expect(captured.expiresAtStateVersion).toBe(input.playerView.stateVersion);
    expect(captured.costs).toEqual(action.costs);
    const current = structuredClone(action);
    if (captured.payload === undefined) delete current.payload;
    else current.payload = structuredClone(captured.payload) as NonNullable<typeof current.payload>;
    return current;
  });
  const dto = buildAiDecisionInputDto({
    ...input,
    legalActions: actions,
    playerView: { ...input.playerView, legalActions: actions },
  });
  return { ...input, ...dto };
}

it("preserves the native Engine tag-clear quantity in both actor projections", () => {
  const input = currentInput();
  for (const actions of [input.legalActions, input.playerView.legalActions]) {
    expect(actions.find(a => a.payload?.cardImplementationEffectKind === "remove_tags")?.payload).toMatchObject({
      cardImplementationTagMode: "up_to_amount",
      cardImplementationTagAmount: 2,
    });
  }
});

it("clears both native G26 tags instead of stranding one before Scorched Earth", () => {
  const input = currentInput();
  expect(input.playerView.own).toMatchObject({ credits: 2, clicks: 3, tags: 2 });
  expect(input.playerView.servers.flatMap(s => s.root).some(c => /city-surveillance/.test(c.definitionId ?? ""))).toBe(false);
  const runtime = native.precedingCheckpoint.runtime as unknown as AiRuntimeCheckpointV1;
  restoreResidentPlanPortfolioMemorySnapshot(input, runtime.residentPlanPortfolio);
  const action = input.legalActions.find(a => a.payload?.cardImplementationEffectKind === "remove_tags")!;
  expect(action.costs).toEqual([{ clicks: 2, credits: 2 }]);
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(action.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:runner.defense_and_recovery:runner",
    leafExecutorInstanceId: "plan:runner.defense_and_recovery:runner",
    turnPlanning: { coverage: { status: "pass", missingActionCount: 0, conflictingActionCount: 0 } },
  });
});
