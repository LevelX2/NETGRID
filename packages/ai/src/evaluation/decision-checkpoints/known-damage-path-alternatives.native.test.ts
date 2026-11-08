import { expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type AiDecisionInput,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import {
  installRunnerProgramForTest,
  putCorpIceCopyOnServer,
} from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";

function act(state: GameState, matches: (a: LegalAction) => boolean) {
  const action = getLegalActions(state, state.activeSide).find(matches);
  if (!action)
    throw new Error(
      `Native damage-path action missing at ${state.timingPoint}`,
    );
  const result = applyAction(state, {
    matchId: state.matchId,
    side: state.activeSide,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `damage-path:${state.stateVersion}`,
    ...(action.type === "resolve_choice"
      ? {
          selectedChoices: {
            choiceId: state.pendingChoice!.choiceId,
            selectedOptionIds: [state.pendingChoice!.options[0]!.id],
          },
        }
      : {}),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
function prepare(handCount = 3, credits = 13) {
  let state = createGameAfterSetup({
    seed: "native-known-damage-path-alternatives",
    runnerDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.runner,
      cards: [
        ...ORIGINALSET_DEFAULT_DECKS.runner.cards.filter(
          (c) => c.id !== "onr_v1_039_krash",
        ),
        { id: "onr_v1_039_krash", quantity: 1 },
      ],
    },
    corpDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
          (c) => c.id !== "onr_v1_258_neural-blade",
        ),
        { id: "onr_v1_258_neural-blade", quantity: 2 },
      ],
    },
  });
  state = act(state, (a) => a.type === "mandatory_draw");
  state = act(state, (a) => a.type === "end_turn");
  while (state.activeSide === "corp" && state.pendingChoice)
    state = act(state, (a) => a.type === "resolve_choice");
  expect(state.activeSide).toBe("runner");
  installRunnerProgramForTest(state, "onr_v1_039_krash");
  for (let n = 0; n < 2; n++) {
    const ice =
      state.cardInstances[
        putCorpIceCopyOnServer(state, "hq", "onr_v1_258_neural-blade")
      ]!;
    ice.rezzed = true;
    ice.faceup = true;
  }
  expect(new Set(state.corp.servers.find((s) => s.id === "hq")!.ice).size).toBe(
    2,
  );
  while (state.runner.grip.length > handCount) {
    const id = state.runner.grip.pop()!;
    state.runner.heap.push(id);
    state.cardInstances[id]!.zone = { side: "runner", zone: "heap" };
  }
  state.runner.credits = credits;
  state.runner.clicks = 4;
  return state;
}
function target(state: GameState) {
  const playerView = getPlayerView(state, "runner");
  const input: AiDecisionInput = {
    matchId: state.matchId,
    side: "runner",
    playerView,
    legalActions: getLegalActions(state, "runner"),
    eventTail: playerView.publicEvents,
    difficulty: "hard",
    seed: "native-damage-path-evaluation",
    decisionId: "native-damage-path",
    actionNumber: state.stateVersion,
    profileId: "native-damage-path",
  };
  return evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.hq",
  )!;
}

it("retains the affordable twelve-credit path that preserves the actual access hand buffer", () => {
  const quote = target(prepare());
  expect(quote.pathPassability).toBe("reachable");
  expect(quote.pathCost).toBe(12);
});

it("retains the cheaper damage path when its actual hand budget already suffices", () => {
  const quote = target(prepare(4));
  expect(quote.pathPassability).toBe("reachable");
  expect(quote.pathCost).toBe(10);
});

it("does not admit the hand-preserving path without the credits to pay it", () => {
  const quote = target(prepare(3, 10));
  expect(quote.pathPassability).toBe("blocked_by_visible_damage_hand_buffer");
});

it("executes the fully paid outer break and accepts only the inner damage with deterministic replay", () => {
  const initial = prepare(),
    eventStart = initial.eventLog.length;
  let state = act(
    structuredClone(initial),
    (a) => a.type === "start_run" && a.payload?.serverId === "hq",
  );
  for (let n = 0; n < 4; n++)
    state = act(state, (a) => a.type === "pump_breaker");
  for (let n = 0; n < 2; n++)
    state = act(state, (a) => a.type === "break_subroutine");
  for (let n = 0; n < 16 && state.run?.phase !== "access"; n++)
    state = act(state, (a) => a.type === "continue_run");
  expect(state.run?.phase).toBe("access");
  expect(state.runner.credits).toBe(1);
  expect(state.runner.grip).toHaveLength(2);
  const replay = replayEvents(initial, state.eventLog.slice(eventStart));
  expect(replay.ok).toBe(true);
  expect(hashGameState(replay.state)).toBe(hashGameState(state));
});
