import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { applyAction, getLegalActions, hashGameState } from "@netgrid/engine";
import type { AiDecisionInput, GameState } from "@netgrid/shared";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { buildAiDecisionInput } from "./ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";

const fixture = () => JSON.parse(readFileSync(new URL("./test-fixtures/meta-528-counter-funding.json", import.meta.url), "utf8"));
afterEach(resetResidentPlanPortfolioMemory);
describe("SP-335 native counter funding", () => {
  it("banks the final click at the exact original G5 D98 checkpoint under Defense", () => {
    const { checkpoint: cp, state, provenance } = fixture();
    expect(Object.values(cp.validation).every(v => v === true)).toBe(true);
    expect(provenance.eachPrefixHashMatches).toBe(true);
    expect(provenance.checkpointHashMatches).toBe(true);
    expect(hashGameState(state)).toBe(cp.stateHash);
    const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) } as AiDecisionInput;
    expect(input.playerView.own.credits).toBe(0);
    expect(input.playerView.own.clicks).toBe(1);
    expect(input.playerView.own.gripOrHq).toHaveLength(5);
    expect(input.legalActions.some(a => a.payload?.runnerAbility === "remove_runner_trace_counter")).toBe(false);
    restoreAiRuntimeCheckpoint(input, cp.input.ownDeckSnapshot.deckSnapshotId, cp.runtime);
    const chosen = chooseAiAction(input);
    expect(chosen.actionId).toBe("runner.gain_credit");
    expect(chosen.fallbackUsed).toBe(false);
    expect(chosen.decisionDebug?.planFirstDecision?.leafExecutorInstanceId).toBe("plan:runner.defense_and_recovery:runner");
    expect(chosen.decisionDebug?.planFirstDecision?.selectedPlan?.phase).toBe("fund_persistent_hazard_counter");
    const result = applyAction(state, { matchId: state.matchId, side: "runner", actionId: chosen.actionId!, clientKnownStateVersion: state.stateVersion });
    expect(result.ok).toBe(true);
    if (!result.ok) throw Error(result.error.message);
    expect(result.state.runner.credits).toBe(1);
    expect(result.state.runner.grip).toHaveLength(5);
    expect(hashGameState(state)).toBe(cp.stateHash);
  });

  it("revalidates the original Corp segment, clears the active tag first and then funds/removes the counter", () => {
    const { checkpoint: cp, state: original, corpSegment } = fixture();
    let state = original as GameState;
    const take = (side: "runner" | "corp", actionId: string, choices?: { selectedOptionIds: string[] }) => {
      expect(getLegalActions(state, side).some(a => a.actionId === actionId)).toBe(true);
      const applied = applyAction(state, { matchId: state.matchId, side, actionId, clientKnownStateVersion: state.stateVersion,
        ...(choices ? { selectedChoices: { choiceId: state.pendingChoice!.choiceId, selectedOptionIds: choices.selectedOptionIds } } : {}) });
      if (!applied.ok) throw Error(applied.error.message);
      state = applied.state;
    };
    take("runner", "runner.gain_credit"); take("runner", "runner.end_turn");
    for (const step of corpSegment) take(step.side, step.actionId, step.selectedChoices);
    expect([state.runner.credits, state.runner.clicks, state.runner.tags, state.runner.grip.length]).toEqual([1, 4, 1, 5]);
    for (const expected of ["runner.gain_credit", "runner.remove_tag", "runner.gain_credit", "counter"] ) {
      const input = buildAiDecisionInput(state, "runner", { difficulty: "hard", ownDeckSnapshot: cp.input.ownDeckSnapshot });
      const result = chooseAiAction(input);
      expect(result.fallbackUsed).toBe(false);
      expect(result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId).toBe("plan:runner.defense_and_recovery:runner");
      const action = input.legalActions.find(a => a.actionId === result.actionId)!;
      if (expected === "counter") expect(action.payload?.runnerAbility).toBe("remove_runner_trace_counter");
      else expect(result.actionId).toBe(expected);
      take("runner", result.actionId!);
    }
    expect([state.runner.tags, state.runner.credits, state.runner.clicks, state.runner.grip.length]).toEqual([0, 0, 0, 5]);
    expect(state.cardInstances[state.runner.identity]!.counters?.trace_tag_counter ?? 0).toBe(0);
  });
});
