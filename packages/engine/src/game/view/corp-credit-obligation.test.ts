import { expect, it } from "vitest";
import {
  createGameAfterSetup,
  getPlayerView,
  hashState,
  getLegalActions,
  applyAction,
} from "../../index";
import {
  apply,
  ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK,
  ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK,
} from "../../test-fixtures/mechanic-smoke-fixtures";

function prepare(count: number, credits: number) {
  const state = apply(
    createGameAfterSetup({
      seed: "current-credit-obligation",
      corpDeck: ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK,
      runnerDeck: ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK,
    }),
    "corp",
    (a) => a.type === "mandatory_draw",
  );
  state.activeObligationDebtCount = count;
  state.corp.credits = credits;
  return state;
}

it("removing one obligation requotes the remaining payment at the new state version", () => {
  const state = prepare(2, 13);
  const action = getLegalActions(state, "corp").find(
    (a) => a.payload?.obligationDebtAbility === "remove_obligation",
  )!;
  expect(action).toBeDefined();
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw Error(result.error.code);
  const view = getPlayerView(result.state, "corp");
  expect(view.own.credits).toBe(1);
  expect(view.own.corpEndTurnCreditObligation).toMatchObject({
    creditsDue: 1,
    expiresAtStateVersion: result.state.stateVersion,
  });
});

it.each([0, 1, 2])(
  "projects %s current obligations privately without changing state",
  (count) => {
    const state = prepare(count, 3),
      hash = hashState(state);
    const quote = getPlayerView(state, "corp").own.corpEndTurnCreditObligation;
    if (count)
      expect(quote).toEqual({
        creditsDue: count,
        expiresAtStateVersion: state.stateVersion,
        deadline: "end_of_corp_turn",
        consequence: "lose_game",
      });
    else expect(quote).toBeUndefined();
    const runner = getPlayerView(state, "runner");
    expect(runner.own).not.toHaveProperty("corpEndTurnCreditObligation");
    expect(runner.opponent).not.toHaveProperty("corpEndTurnCreditObligation");
    expect(hashState(state)).toBe(hash);
  },
);

it.each([
  [1, 1, null],
  [2, 1, "runner"],
] as const)(
  "quoted payment %s with %s credits agrees with the terminal rule",
  (count, credits, winner) => {
    const state = prepare(count, credits);
    const end = getLegalActions(state, "corp").find(
      (a) => a.type === "end_turn",
    )!;
    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: end.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw Error(result.error.code);
    expect(result.state.winner).toBe(winner);
  },
);
