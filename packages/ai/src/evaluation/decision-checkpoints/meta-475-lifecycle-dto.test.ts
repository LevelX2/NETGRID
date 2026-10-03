import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function checkpoint() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-475-r6-g9-d161-lifecycle-dto.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
    engineLifecycleQuoteProof: {
      stateVersion: number;
      actionId: string;
      rawHistoricalPayload: Record<string, string | number | boolean>;
      restoredFields: string[];
    };
  };
}

function choose(cp: ReturnType<typeof checkpoint>) {
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, cp.runtime);
  return { input, result: chooseAiAction(input) };
}

it.each([11, 10])("preserves the real Engine lifecycle quote and repays at %i credits", (credits) => {
  const cp = checkpoint();
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const { actionId, rawHistoricalPayload, restoredFields } = cp.engineLifecycleQuoteProof;
  const source = cp.input.legalActions.find((a) => a.actionId === actionId)!;
  for (const key of restoredFields) expect(source.payload![key]).toBe(rawHistoricalPayload[key]);
  cp.input.playerView.own.credits = credits;
  source.payload!.privateProbe = "must-not-cross-dto";
  const first = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  const input = { ...first, ...buildAiDecisionInputDto(first) };
  for (const actions of [input.legalActions, input.playerView.legalActions]) {
    const action = actions.find((a) => a.actionId === actionId)!;
    expect(action.payload).toMatchObject({
      cardImplementationLifecycleAction: "end_of_runner_turn",
      cardImplementationLifecycleLeavePlayPaymentAmount: 10,
      cardImplementationLifecycleLeavePlayPaymentStatus: "payable",
    });
    expect(action.payload).not.toHaveProperty("privateProbe");
    expect(action.expiresAtStateVersion).toBe(160);
    expect(action.abilityRef).toEqual(source.abilityRef);
  }
  const facts = JSON.stringify({ view: input.playerView, actions: input.legalActions, events: input.eventTail });
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, cp.runtime);
  const result = chooseAiAction(input);
  expect(result.actionId).toBe(actionId);
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  const pf = result.decisionDebug!.planFirstDecision!;
  expect(pf.selectedPlan!.moduleId).toBe("runner.resource_lifecycle");
  expect(pf.leafExecutorInstanceId).toBe(pf.rootPlanInstanceId);
  expect(pf.route).toMatchObject({ actionId, stateVersion: 160, planInstanceId: pf.leafExecutorInstanceId, stepId: pf.selectedStep!.stepId });
  expect(JSON.stringify({ view: input.playerView, actions: input.legalActions, events: input.eventTail })).toBe(facts);
});

it("keeps an immediately unpayable lifecycle action out of the executable plan", () => {
  const cp = checkpoint();
  cp.input.playerView.own.credits = 9;
  for (const actions of [cp.input.legalActions, cp.input.playerView.legalActions]) {
    actions.find((a) => a.actionId === cp.engineLifecycleQuoteProof.actionId)!.payload!.cardImplementationLifecycleLeavePlayPaymentStatus = "unpayable";
  }
  const { result } = choose(cp);
  expect(result.actionId).toBe("runner.end_turn");
  expect(result.decisionDebug!.planFirstDecision!.selectedPlan!.moduleId).toBe("runner.complete_turn");
});

it("retains the loan when the visible remaining-turn ceiling does not repay the exit cost", () => {
  const cp = checkpoint();
  cp.input.playerView.opponent.deckCount = 10;
  const { result } = choose(cp);
  expect(result.actionId).toBe("runner.end_turn");
});

it.each([
  "cardImplementationLifecycleAction",
  "cardImplementationLifecycleLeavePlayPaymentAmount",
  "cardImplementationLifecycleLeavePlayPaymentStatus",
])("does not manufacture a missing Engine field: %s", (missing) => {
  const cp = checkpoint();
  for (const actions of [cp.input.legalActions, cp.input.playerView.legalActions]) {
    delete actions.find((a) => a.actionId === cp.engineLifecycleQuoteProof.actionId)!.payload![missing];
  }
  const { result } = choose(cp);
  expect(result.actionId).toBe("runner.end_turn");
});
