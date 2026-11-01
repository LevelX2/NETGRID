import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { applyAction, getLegalActions, hashGameState } from "@netgrid/engine";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory, restoreResidentPlanPortfolioMemorySnapshot } from "../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";

afterEach(resetResidentPlanPortfolioMemory);
describe("SP-723 persistent counter deferral during the survival hand buffer", () => {
  it.each([[2, 176, 1, 2], [25, 28, 2, 5]])(
    "keeps the exact G%i D%i survival draw with %i cards and %i tags executable",
    (game, decision, handSize, tags) => {
      const fixture = JSON.parse(readFileSync(new URL(
        "./test-fixtures/meta-577-g" + game + "-counter-hand-buffer.json", import.meta.url,
      ), "utf8"));
      const { checkpoint: cp, state, provenance } = fixture;
      expect(Object.values(cp.validation).every(v => v === true)).toBe(true);
      expect(provenance.checkedStates).toBe(decision);
      expect(provenance.eachPrefixHashMatches).toBe(true);
      expect(provenance.legalActionsEachPrefixMatch).toBe(true);
      expect(hashGameState(state)).toBe(cp.stateHash);
      const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) } as AiDecisionInputWithDeckCapabilities;
      input.planningStateIdentity = buildPlanningStateIdentity(input);
      expect(input.playerView.own.gripOrHq).toHaveLength(handSize);
      expect(input.playerView.own.tags).toBe(tags);
      expect(input.playerView.own.credits).toBe(1);
      expect(input.playerView.own.clicks).toBe(4);
      const counter = input.legalActions.find(a => a.payload?.runnerAbility === "remove_runner_trace_counter")!;
      expect(counter).toBeDefined();
      expect(getLegalActions(state, "runner").map(a => a.actionId).sort()).toEqual(input.legalActions.map(a => a.actionId).sort());
      restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, cp.runtime);
      restoreResidentPlanPortfolioMemorySnapshot(input, cp.runtime.residentPlanPortfolio);
      const chosen = chooseAiAction(input);
      expect(chosen.actionId).toBe("runner.draw_card");
      expect(chosen.fallbackUsed).toBe(false);
      const plan = chosen.decisionDebug?.planFirstDecision;
      expect(plan?.leafExecutorInstanceId).toBe("plan:runner.defense_and_recovery:runner");
      expect(plan?.selectedPlan?.phase).toBe("build_hand_buffer");
      expect(plan?.route?.actionId).toBe(chosen.actionId);
      expect(plan?.route?.stateVersion).toBe(state.stateVersion);
      expect(plan?.turnPlanning?.coverage).toMatchObject({ status: "pass", coveragePercent: 100, missingActionIds: [], conflictingActionIds: [] });
      const applied = applyAction(state, {
        matchId: state.matchId, side: "runner", actionId: chosen.actionId!,
        clientKnownStateVersion: state.stateVersion,
      });
      if (!applied.ok) throw Error(applied.error.message);
      expect(applied.state.runner.grip).toHaveLength(handSize + 1);
      expect(applied.state.runner.credits).toBe(1);
      expect(applied.state.runner.clicks).toBe(3);
      expect(applied.state.cardInstances[applied.state.runner.identity]?.counters?.trace_tag_counter).toBe(1);
      expect(hashGameState(state)).toBe(cp.stateHash);
    },
  );
});
