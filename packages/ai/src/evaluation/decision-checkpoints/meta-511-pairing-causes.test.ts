import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
  quoteCorpPunishRoute,
} from "@netgrid/engine";
import type { AiDecisionInput, GameState } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { runnerDefenseHandBufferFacts } from "../../runner/defense-recovery/defense-signals";

function load(key: string, kind: string) {
  return JSON.parse(
    readFileSync(
      new URL(
        `./fixtures/meta-511-causes/${key}-${kind}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
function decisionAt(key: string, alter?: (state: GameState) => void) {
  const cp = load(key, "native");
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const state = load(key, "engine-state") as GameState;
  expect(hashGameState(state)).toBe(cp.stateHash);
  alter?.(state);
  const current = {
    ...cp.input,
    playerView: getPlayerView(state, cp.actor),
    legalActions: getLegalActions(state, cp.actor),
  };
  const input: AiDecisionInput = {
    ...current,
    ...buildAiDecisionInputDto(current),
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    cp.input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input, {
    quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
  });
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).not.toBe(true);
  const pf = decision.decisionDebug!.planFirstDecision!;
  expect(pf.route).toMatchObject({
    actionId: decision.actionId,
    stateVersion: state.stateVersion,
    stepId: pf.selectedStep!.stepId,
    planInstanceId: pf.leafExecutorInstanceId,
  });
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  return { input, state, decision, pf };
}
function applySelected(result: ReturnType<typeof decisionAt>) {
  const action = result.input.legalActions.find(
    (a) => a.actionId === result.decision.actionId,
  )!;
  expect(action.expiresAtStateVersion).toBe(result.state.stateVersion);
  const applied = applyAction(result.state, {
    matchId: result.state.matchId,
    side: result.input.side,
    actionId: action.actionId,
    clientKnownStateVersion: result.state.stateVersion,
    ...(result.decision.selectedChoices
      ? { selectedChoices: result.decision.selectedChoices }
      : {}),
  });
  expect(applied.ok).toBe(true);
  if (!applied.ok) throw new Error("native selected Engine action rejected");
  return applied.state;
}
afterEach(resetResidentPlanPortfolioMemory);

it("SP-565 admits the original free ETR when every paid continuation is inadmissible", () => {
  const r = decisionAt("g15d170");
  expect(r.decision.actionId).toBe(
    "runner.continue_run.subroutine_end_run_unless_runner_pays_one",
  );
  expect(r.pf.selectedPlan?.moduleId).toBe("runner.convert_run_window");
  expect(r.pf.rootPlanInstanceId).toBe(
    "plan:runner.pressure_central:central%3Ahq",
  );
  expect(r.pf.leafExecutorInstanceId).toBe(
    "plan:runner.convert_run_window:run%3Arun_163",
  );
  const state = applySelected(r);
  expect(state.run).toBeUndefined();
  expect(state.runner.credits).toBe(13);
  expect(state.runner.clicks).toBe(1);
  expect(hashGameState(state)).toBe(hashGameState(applySelected(r)));
});
it("SP-565 retains access when its paid continuation is actually funded and admitted", () => {
  const r = decisionAt("g15d170", (state) => {
    state.runner.credits = 100;
  });
  expect(r.decision.actionId).toBe(
    "runner.continue_run.subroutine_end_run_unless_runner_pays_one.0.1",
  );
  expect(r.pf.selectedPlan?.moduleId).toBe("runner.convert_run_window");
  const state = applySelected(r);
  expect(state.run).toBeDefined();
  expect(state.runner.credits).toBe(99);
});
it.each(["g1d120", "g16d29"])(
  "SP-566 preserves the achieved native damage buffer at %s",
  (key) => {
    const r = decisionAt(key);
    expect(runnerDefenseHandBufferFacts(r.input, []).minimumHandBuffer).toBe(4);
    expect(r.input.playerView.own.gripOrHq).toHaveLength(4);
    expect(r.decision.actionId).toBe("runner.gain_credit");
    expect(r.pf.selectedPlan?.moduleId).toBe("runner.economy");
    expect(r.pf.route?.capabilityId).toBe("gain_general_liquid_credits");
    const state = applySelected(r);
    expect(state.runner.grip).toHaveLength(4);
    expect(state.runner.credits).toBe(r.state.runner.credits + 1);
  },
);
it("SP-566 allows cash conversion when it preserves the known buffer", () => {
  const r = decisionAt("g16d29", (state) => {
    const card = state.runner.stack.shift()!;
    state.runner.grip.push(card);
    state.cardInstances[card]!.zone = { side: "runner", zone: "grip" };
  });
  expect(r.input.playerView.own.gripOrHq).toHaveLength(5);
  expect(r.decision.actionId).toContain("livewires-contacts");
  expect(applySelected(r).runner.grip).toHaveLength(4);
});
it("SP-566 preserves the buffer after the original Stakeout draw without resetting turn memory", () => {
  const first = decisionAt("g16d28");
  expect(first.decision.actionId).toContain("stakeout");
  const state = applySelected(first);
  const cp = load("g16d29", "native");
  expect(hashGameState(state)).toBe(cp.stateHash);
  const current = {
    ...cp.input,
    playerView: getPlayerView(state, cp.actor),
    legalActions: getLegalActions(state, cp.actor),
  };
  const input: AiDecisionInput = {
    ...current,
    ...buildAiDecisionInputDto(current),
  };
  // The actual preceding decision owns the live memory; do not restore D29.
  const decision = chooseAiAction(input, {
    quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
  });
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).not.toBe(true);
  expect(decision.actionId).toBe("runner.gain_credit");
  expect(
    decision.decisionDebug!.planFirstDecision!.selectedPlan?.moduleId,
  ).toBe("runner.economy");
  expect(
    applySelected({
      input,
      state,
      decision,
      pf: decision.decisionDebug!.planFirstDecision!,
    }).runner.grip,
  ).toHaveLength(4);
});
it("SP-564 selects the native guaranteed Chance punish route above printed Trace 5", () => {
  const r = decisionAt("g12d79");
  expect(r.decision.actionId).toContain("chance-observation_3");
  expect(r.pf.selectedPlan?.moduleId).toBe("corp.execute_punish_sequence");
  const state = applySelected(r);
  expect(state.pendingChoice?.kind).toBe("bid_amount");
  expect(state.pendingChoice?.options.some((o) => o.id === "bid_7")).toBe(true);
});
