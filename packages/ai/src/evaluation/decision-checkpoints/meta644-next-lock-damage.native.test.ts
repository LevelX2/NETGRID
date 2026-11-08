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
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import {
  installRunnerProgramForTest,
  putCorpIceOnServer,
} from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";

function act(state: GameState, matches: (a: LegalAction) => boolean) {
  const action = getLegalActions(state, state.activeSide).find(matches);
  if (!action) throw new Error(`Native action missing at ${state.timingPoint}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: state.activeSide,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `next-lock-damage:${state.stateVersion}`,
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
function prepare(
  innerToOuter = ["onr_v1_258_neural-blade", "onr_v1_268_shock-r"],
) {
  const sourceIds = innerToOuter;
  let state = createGameAfterSetup({
    seed: "native-next-lock-damage-lifetime",
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
          (c) => !sourceIds.includes(c.id),
        ),
        ...sourceIds.map((id) => ({ id, quantity: 1 })),
      ],
    },
  });
  state = act(state, (a) => a.type === "mandatory_draw");
  state = act(state, (a) => a.type === "end_turn");
  while (state.activeSide === "corp" && state.pendingChoice)
    state = act(state, (a) => a.type === "resolve_choice");
  expect(state.activeSide).toBe("runner");
  installRunnerProgramForTest(state, "onr_v1_039_krash");
  for (const id of innerToOuter) {
    const ice = state.cardInstances[putCorpIceOnServer(state, "hq", id)]!;
    ice.rezzed = true;
    ice.faceup = true;
  }
  state.runner.credits = 18;
  state.runner.clicks = 4;
  return state;
}
function advanceToInner(state: GameState) {
  for (let step = 0; step < 12; step++) {
    if (
      state.run?.phase === "encounter_ice" &&
      state.run.position.kind === "ice" &&
      state.run.position.iceIndex === 0
    )
      return state;
    state = act(state, (a) => a.type === "continue_run");
  }
  throw new Error("Native inner encounter not reached");
}
function advanceToAccess(state: GameState) {
  for (let step = 0; step < 12; step++) {
    if (state.run?.phase === "access") return state;
    state = act(state, (a) => a.type === "continue_run");
  }
  throw new Error("Native access not reached");
}

it("prices the complete damage-free source and next-ICE breaks using fresh Engine facts", () => {
  const state = prepare(),
    view = getPlayerView(state, "runner");
  const path = assessKnownRezzedIcePath(
    view.servers.find((s) => s.id === "hq")!.ice,
    view.own.rig!,
    18,
  );
  expect(path.canReachAccess).toBe(true);
  expect(path.visibleBreakCost).toBe(18);
  expect(path.creditsAfterPath).toBe(0);
  expect(path.paidSubroutineBreaks?.map((p) => p.iceInstanceId)).toHaveLength(
    2,
  );
});

it("consumes the restriction after a benign next encounter before pricing deeper ICE", () => {
  const state = prepare([
    "onr_v1_237_data-wall",
    "onr_v1_225_canis-major",
    "onr_v1_268_shock-r",
  ]);
  const view = getPlayerView(state, "runner");
  const path = assessKnownRezzedIcePath(
    view.servers.find((s) => s.id === "hq")!.ice,
    view.own.rig!,
    18,
  );
  expect(path.canReachAccess).toBe(true);
  // Canis fires under no-break; the expired lock permits the inner wall's
  // two strength pumps and one break, including the real +2 strength effect.
  expect(path.visibleBreakCost).toBe(6);
  expect(path.creditsAfterPath).toBe(12);
});

it("keeps the Engine lock through the next damage window and replays the fully paid contrast", () => {
  const initial = prepare(),
    eventStart = initial.eventLog.length;
  const originalHand = initial.runner.grip.length;
  let unbroken = act(
    structuredClone(initial),
    (a) => a.type === "start_run" && a.payload?.serverId === "hq",
  );
  unbroken = advanceToInner(unbroken);
  expect(
    getLegalActions(unbroken, "runner").some(
      (a) => a.type === "pump_breaker" || a.type === "break_subroutine",
    ),
  ).toBe(false);
  unbroken = act(unbroken, (a) => a.type === "continue_run");
  expect(unbroken.runner.grip).toHaveLength(originalHand - 1);
  expect(unbroken.runner.credits).toBe(18);
  const replay = replayEvents(initial, unbroken.eventLog.slice(eventStart));
  expect(replay.ok).toBe(true);
  expect(hashGameState(replay.state)).toBe(hashGameState(unbroken));

  let paid = act(
    structuredClone(initial),
    (a) => a.type === "start_run" && a.payload?.serverId === "hq",
  );
  for (let i = 0; i < 3; i++)
    paid = act(paid, (a) => a.type === "pump_breaker");
  paid = act(paid, (a) => a.type === "break_subroutine");
  paid = advanceToInner(paid);
  for (let i = 0; i < 4; i++)
    paid = act(paid, (a) => a.type === "pump_breaker");
  paid = act(
    paid,
    (a) =>
      a.type === "break_subroutine" &&
      String(a.payload?.subroutineId).includes("damage"),
  );
  paid = advanceToAccess(paid);
  expect(paid.runner.credits).toBe(0);
  expect(paid.runner.grip).toHaveLength(originalHand);
  const paidReplay = replayEvents(initial, paid.eventLog.slice(eventStart));
  expect(paidReplay.ok).toBe(true);
  expect(hashGameState(paidReplay.state)).toBe(hashGameState(paid));
});
