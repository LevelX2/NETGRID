import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { ORIGINALSET_DEFAULT_DECKS, type GameState, type LegalAction } from "@netgrid/shared";
import { applyAction, createGameAfterSetup, getLegalActions, hashGameState, replayEvents } from "@netgrid/engine";
import { installRunnerProgramForTest, putCorpIceOnServer } from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { chooseRunnerAction } from "../../index";
import { buildAiDecisionInput, type AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint, type AiRuntimeCheckpointV1 } from "./runtime-checkpoint";
import { currentEncounteredIceCard } from "../../runtime/current-encounter";
import { currentEncounterMitigationForBreaker } from "../../runtime/runner-encounter-mitigation";
import { runnerEncounterCreditBudgetForInput, spendRunnerEncounterBreakerCost } from "../../runtime/runner-encounter-credit-budget";

type Capture = { input: AiDecisionInputWithDeckCapabilities; runtime: AiRuntimeCheckpointV1 };
const capture = (decision: number): Capture => JSON.parse(readFileSync(new URL(`../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-475-r14-g19-d${decision}-mitigation.json`, import.meta.url), "utf8"));

describe("SP-135: the paid mitigation pump keeps its exact break purpose", () => {
  afterEach(() => resetResidentPlanPortfolioMemory());

  it.each([353, 354])("preserves the original run owner at decision %s", (index) => {
    const { input, runtime } = capture(index);
    restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, runtime);
    const decision = chooseRunnerAction(input);
    const action = input.legalActions.find(a => a.actionId === decision.actionId)!;
    expect(action.type).toBe(index === 353 ? "pump_breaker" : "break_subroutine");
    if (index === 354) expect(action.payload?.subroutineIndex).toBe(0);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    expect(action.expiresAtStateVersion).toBe(input.playerView.stateVersion);
    const plan = decision.decisionDebug!.planFirstDecision!;
    expect(plan.rootPlanInstanceId).toBe("plan:runner.contest_remote:remote%3Aremote_1");
    expect(plan.selectedPlan?.moduleId).toBe("runner.convert_run_window");
    expect(plan.leafExecutorInstanceId).toBe("plan:runner.convert_run_window:run%3Arun_348");
    expect(plan.route?.actionId).toBe(action.actionId);
    expect(plan.route?.stateVersion).toBe(input.playerView.stateVersion);
    expect(plan.selectedStep?.planInstanceId).toBe(plan.leafExecutorInstanceId);
    expect(JSON.stringify(decision.decisionDebug)).toContain("mitigation_target_indexes:0");
  });

  it("executes the complete paid damage, trace, ETR and inner program protection", () => {
    let state = encounter();
    const initial = structuredClone(state), start = state.eventLog.length;
    const grip = [...state.runner.grip];
    let pumps = 0, breaks = 0;
    for (let step = 0; state.run && step < 35; step++) {
      if (state.activeSide === "corp") {
        state = applyMatching(state, a => a.type === "decline_rez" || a.type === "continue_run");
        continue;
      }
      const input = buildAiDecisionInput(state, "runner", { difficulty: "hard", eventTail: state.eventLog, ownDeckSnapshot: capture(354).input.ownDeckSnapshot!, decisionId: `${state.matchId}:${state.stateVersion}`, actionNumber: state.stateVersion });
      const decision = chooseRunnerAction(input);
      const action = input.legalActions.find(a => a.actionId === decision.actionId)!;
      expect(action).toBeDefined();
      expect(decision.fallbackUsed).toBe(false);
      expect(decision.timeoutUsed).toBe(false);
      if (action.type === "pump_breaker") pumps++;
      if (action.type === "break_subroutine") breaks++;
      if (["pump_breaker", "break_subroutine"].includes(action.type)) {
        const plan = decision.decisionDebug!.planFirstDecision!;
        expect(plan.selectedPlan?.moduleId).toBe("runner.convert_run_window");
        expect(plan.route?.actionId).toBe(action.actionId);
        expect(plan.route?.stateVersion).toBe(state.stateVersion);
        expect(plan.selectedStep?.planInstanceId).toBe(plan.leafExecutorInstanceId);
      }
      state = applyMatching(state, a => a.actionId === action.actionId);
    }
    expect(state.run).toBeUndefined();
    expect({ pumps, breaks }).toEqual({ pumps: 4, breaks: 5 });
    expect(state.runner.credits).toBe(1);
    expect(state.runner.grip).toEqual(grip);
    expect(state.runner.rig.programs).toEqual(initial.runner.rig.programs);
    expect(state.eventLog.slice(start).some(e => e.type === "trace_started")).toBe(false);
    const replay = replayEvents(initial, state.eventLog.slice(start));
    expect(replay.ok).toBe(true);
    expect(hashGameState(replay.state)).toBe(hashGameState(state));
  });

  it.each([10, 9])("requires the complete mitigation payment after four real pumps from %s credits", (credits) => {
    let state = encounter(credits);
    for (let i = 0; i < 4; i++) state = applyMatching(state, a => a.type === "pump_breaker");
    const input = buildAiDecisionInput(state, "runner", { difficulty: "hard", eventTail: state.eventLog, ownDeckSnapshot: capture(354).input.ownDeckSnapshot! });
    const ice = currentEncounteredIceCard(input)!;
    const breaker = input.playerView.own.rig!.find(c => c.definitionId === "onr_v1_039_krash")!;
    const mitigation = currentEncounterMitigationForBreaker(input, breaker, breaker.strength!, cost => spendRunnerEncounterBreakerCost({ input, breakerId: breaker.instanceId, budget: runnerEncounterCreditBudgetForInput(input), cost }).affordable, 3);
    expect(ice.definitionId).toBe("onr_classic_005_baskerville");
    expect(state.runner.credits).toBe(credits - 8);
    if (credits === 10) {
      expect(mitigation?.subroutineIndexes).toEqual([0]);
      expect(mitigation?.breakCost).toBe(2);
      expect(input.legalActions.some(a => a.type === "break_subroutine" && a.payload?.subroutineIndex === 0)).toBe(true);
    } else {
      expect(mitigation).toBeUndefined();
      expect(input.legalActions.some(a => a.type === "break_subroutine")).toBe(false);
    }
  });
});

function applyMatching(state: GameState, matches: (action: LegalAction) => boolean): GameState {
  const action = getLegalActions(state, state.activeSide).find(matches);
  if (!action) throw new Error(`Missing mechanism action at ${state.timingPoint}`);
  const result = applyAction(state, { matchId: state.matchId, side: state.activeSide, actionId: action.actionId, clientKnownStateVersion: state.stateVersion, idempotencyKey: `mitigation-continuation:${state.stateVersion}` });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function encounter(credits = 19): GameState {
  const snapshot = capture(354).input.ownDeckSnapshot!;
  let state = createGameAfterSetup({
    seed: "mitigation-continuation",
    runnerDeck: { ...ORIGINALSET_DEFAULT_DECKS.runner, cards: snapshot.cards.map(c => ({ id: c.cardId, quantity: c.quantity })) },
    corpDeck: { ...ORIGINALSET_DEFAULT_DECKS.corp, cards: [{ id: "onr_classic_008_deadeye", quantity: 1 }, { id: "onr_classic_005_baskerville", quantity: 1 }, ...ORIGINALSET_DEFAULT_DECKS.corp.cards] },
  });
  installRunnerProgramForTest(state, "onr_v1_039_krash");
  for (const definitionId of ["onr_classic_008_deadeye", "onr_classic_005_baskerville"]) {
    const id = putCorpIceOnServer(state, "rd", definitionId);
    state.cardInstances[id]!.rezzed = true;
    state.cardInstances[id]!.faceup = true;
  }
  state = applyMatching(state, a => a.type === "mandatory_draw");
  state = applyMatching(state, a => a.type === "end_turn");
  if (state.pendingChoice) throw new Error("Unexpected setup discard in the mechanism fixture");
  state.runner.credits = credits;
  for (const id of state.runner.grip.splice(4)) {
    state.runner.heap.push(id);
    state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "runner", zone: "heap" }, faceup: true, rezzed: true };
  }
  state = applyMatching(state, a => a.type === "start_run" && a.payload?.serverId === "rd");
  for (let step = 0; state.run?.phase !== "encounter_ice" && step < 10; step++) state = applyMatching(state, a => a.type === "continue_run" || a.type === "decline_rez");
  expect(state.run?.phase).toBe("encounter_ice");
  return state;
}
