import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type GameState,
  type LegalAction,
  type PlayerAction,
  type Side,
} from "@netgrid/shared";
import { expect, it } from "vitest";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";

function apply(
  state: GameState,
  side: Side,
  predicate: (a: LegalAction) => boolean,
  selectedChoices?: PlayerAction["selectedChoices"],
): GameState {
  const action = getLegalActions(state, side).find(predicate);
  if (!action)
    throw Error(
      JSON.stringify({
        side,
        phase: state.phase,
        timing: state.timingPoint,
        legal: getLegalActions(state, side).map((a) => a.type),
      }),
    );
  expect(action).toBeDefined();
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action!.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: "tax-order:" + state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw Error(JSON.stringify(result.error));
  return result.state;
}
it("avoids a public draw-tax tag by placing the same credit click before the draw", () => {
  const city = "onr_v1_313_city-surveillance";
  let initial = createGameAfterSetup({
    matchId: "draw-tax-order",
    seed: "draw-tax-order",
    agendaPointsToWin: 7,
    runnerDeck: DEMO_DECKS.demo_runner_001,
    corpDeck: {
      ...DEMO_DECKS.demo_corp_001,
      id: "draw-tax-order",
      cards: [...DEMO_DECKS.demo_corp_001.cards, { id: city, quantity: 1 }],
    },
  });
  initial = apply(initial, "corp", (a) => a.type === "mandatory_draw");
  RealEngineFixtureBuilder.forState(initial).withCorpHqSize(5);
  for (let i = 0; i < 3; i++)
    initial = apply(initial, "corp", (a) => a.type === "gain_credit");
  initial = apply(initial, "corp", (a) => a.type === "end_turn");
  RealEngineFixtureBuilder.forState(initial)
    .withRunnerCredits(0)
    .withRunnerGripSize(2)
    .withCorpRemoteRoot("remote_1", city, 0, { faceup: true, rezzed: true });
  initial.runner.clicks = 2;
  function branch(creditFirst: boolean) {
    let state = structuredClone(initial);
    const start = state.eventLog.length;
    if (creditFirst)
      state = apply(state, "runner", (a) => a.type === "gain_credit");
    state = apply(state, "runner", (a) => a.type === "draw_card");
    const choice = state.pendingChoice!,
      option = creditFirst ? "pay_credit" : "take_tag";
    expect(choice.options.some((o) => o.id === option)).toBe(true);
    state = apply(state, "runner", (a) => a.type === "resolve_choice", {
      choiceId: choice.choiceId,
      selectedOptionIds: [option],
    });
    if (!creditFirst)
      state = apply(state, "runner", (a) => a.type === "gain_credit");
    const replay = replayEvents(initial, state.eventLog.slice(start));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
    return state;
  }
  const before = branch(false),
    after = branch(true);
  expect(before.runner.tags).toBe(1);
  expect(after.runner.tags).toBe(0);
  expect(after.runner.grip).toEqual(before.runner.grip);
  expect(before.runner.clicks).toBe(0);
  expect(after.runner.clicks).toBe(0);
  expect(before.runner.credits).toBe(1);
  expect(after.runner.credits).toBe(0);
});
