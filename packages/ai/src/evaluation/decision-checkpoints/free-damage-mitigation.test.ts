import { afterEach, expect, it } from "vitest";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import {
  installRunnerProgramForTest,
  putCorpIceOnServer,
} from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { chooseRunnerAction } from "../../index";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { currentEncounterRequiresDamagePreservingBreak } from "../../runtime/current-encounter-damage";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";

const runnerDeck = {
  ...ORIGINALSET_DEFAULT_DECKS.runner,
  cards: [
    { id: "onr_v1_074_worm", quantity: 1 },
    ...ORIGINALSET_DEFAULT_DECKS.runner.cards.filter(
      (c) => c.id !== "onr_v1_074_worm",
    ),
  ],
};
const snapshot = {
  deckSnapshotId: "free-mitigation-fixture",
  side: "runner" as const,
  cards: runnerDeck.cards.map((c) => ({ cardId: c.id, quantity: c.quantity })),
};
afterEach(() => resetResidentPlanPortfolioMemory());

it("executes free damage mitigation at zero bank even when the inner access path is unaffordable", () => {
  let state = encounter();
  const initial = structuredClone(state),
    start = state.eventLog.length;
  let damageBreaks = 0;
  for (let step = 0; state.run && step < 18; step++) {
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      eventTail: state.eventLog,
      ownDeckSnapshot: snapshot,
    });
    if (step === 0) {
      expect(state.runner.credits).toBe(0);
      expect(currentEncounterRequiresDamagePreservingBreak(input, 0)).toBe(
        true,
      );
      expect(
        input.legalActions.filter((a) => a.type === "break_subroutine"),
      ).toHaveLength(4);
    }
    const decision = chooseRunnerAction(input);
    const action = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(action).toBeDefined();
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    if (step === 0) expect(action.type).toBe("break_subroutine");
    if (
      action.type === "break_subroutine" &&
      Number(action.payload?.subroutineIndex) < 2
    )
      damageBreaks++;
    state = applyMatching(state, (a) => a.actionId === action.actionId);
    expect(state.winner).toBeNull();
  }
  expect(state.run).toBeUndefined();
  expect(damageBreaks).toBe(1);
  expect(state.runner.grip).toHaveLength(1);
  const replay = replayEvents(initial, state.eventLog.slice(start));
  expect(replay.ok).toBe(true);
  expect(hashGameState(replay.state)).toBe(hashGameState(state));
});

it("does not count fully prevented damage as an outstanding mitigation obligation", () => {
  const state = encounter();
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    eventTail: state.eventLog,
    ownDeckSnapshot: snapshot,
  });
  input.playerView.own.freeNetOrCoreDamagePreventionRemaining = 4;
  expect(currentEncounterRequiresDamagePreservingBreak(input, 0)).toBe(false);
});

function applyMatching(
  state: GameState,
  matches: (a: LegalAction) => boolean,
): GameState {
  const action = getLegalActions(state, state.activeSide).find(matches);
  if (!action)
    throw new Error(`Missing fixture action at ${state.timingPoint}`);
  const applied = applyAction(state, {
    matchId: state.matchId,
    side: state.activeSide,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!applied.ok) throw new Error(applied.error.message);
  return applied.state;
}

function encounter(): GameState {
  let state = createGameAfterSetup({
    seed: "free-damage-mitigation",
    runnerDeck,
    corpDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        { id: "onr_v1_278_wall-of-ice", quantity: 1 },
        { id: "onr_v1_265_rock-is-strong", quantity: 1 },
        ...ORIGINALSET_DEFAULT_DECKS.corp.cards,
      ],
    },
  });
  installRunnerProgramForTest(state, "onr_v1_074_worm");
  for (const id of ["onr_v1_265_rock-is-strong", "onr_v1_278_wall-of-ice"]) {
    const instance = putCorpIceOnServer(state, "rd", id);
    state.cardInstances[instance]!.rezzed = true;
    state.cardInstances[instance]!.faceup = true;
  }
  state = applyMatching(state, (a) => a.type === "mandatory_draw");
  state = applyMatching(state, (a) => a.type === "end_turn");
  if (state.pendingChoice) throw new Error("Unexpected fixture discard");
  for (const id of state.runner.grip.splice(3)) {
    state.runner.heap.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "runner", zone: "heap" },
      faceup: true,
      rezzed: true,
    };
  }
  state.runner.credits = 12;
  state = applyMatching(
    state,
    (a) => a.type === "start_run" && a.payload?.serverId === "rd",
  );
  for (let i = 0; state.run?.phase !== "encounter_ice" && i < 10; i++)
    state = applyMatching(
      state,
      (a) => a.type === "continue_run" || a.type === "decline_rez",
    );
  for (let i = 0; i < 4; i++)
    state = applyMatching(state, (a) => a.type === "pump_breaker");
  return state;
}
