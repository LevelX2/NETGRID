import type { GameState, LegalAction, PlayerAction, Side } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { applyAction, createGame, getLegalActions, getPlayerView, hashState, replayEvents } from "../index";

describe.each(["real-flow-11", "real-flow-29", "real-flow-47"])("real Engine game flow (%s)", (seed) => {
  it("keeps live LegalActions, applyAction, hidden views and replay aligned", () => {
    const initial = createGame({ seed, setupMode: "completed" });
    let state = initial;

    state = applyType(state, "corp", "mandatory_draw");
    const corpMainActions = getLegalActions(state, "corp");
    expect(corpMainActions.map((action) => action.type)).toEqual(
      expect.arrayContaining(["gain_credit", "draw_card", "install_card", "end_turn"]),
    );

    const firstCreditAction = playerActionFor(state, actionOfType(corpMainActions, "gain_credit"));
    const creditsBefore = state.corp.credits;
    state = applyPlayerAction(state, firstCreditAction);
    expect(state.corp).toMatchObject({ credits: creditsBefore + 1, clicks: 2 });

    state = applyType(state, "corp", "gain_credit");
    const staleRetry = applyAction(state, firstCreditAction);
    expect(staleRetry).toMatchObject({ ok: false, error: { code: "ERR_STALE_STATE" } });

    state = applyType(state, "corp", "gain_credit");
    expect(getLegalActions(state, "corp").map((action) => action.type)).toEqual(["end_turn"]);
    state = applyType(state, "corp", "end_turn");

    const choice = state.pendingChoice;
    expect(choice).toMatchObject({ side: "corp", kind: "select_cards", minSelections: 1, maxSelections: 1 });
    if (!choice) throw new Error("Expected the live Corp discard choice.");
    const resolveDiscard = actionOfType(getLegalActions(state, "corp"), "resolve_choice");
    state = applyPlayerAction(state, {
      ...playerActionFor(state, resolveDiscard),
      selectedChoices: {
        choiceId: choice.choiceId,
        selectedOptionIds: [choice.options[0]?.id],
      },
    });

    expect(state).toMatchObject({ activeSide: "runner", timingPoint: "runner_action.main" });
    const runnerMainActions = getLegalActions(state, "runner");
    expect(runnerMainActions.some((action) => action.type === "gain_credit")).toBe(true);
    expect(runnerMainActions.some((action) => action.type !== "gain_credit")).toBe(true);
    state = applyType(state, "runner", "gain_credit");

    const runnerSurface = JSON.stringify(getPlayerView(state, "runner"));
    for (const hiddenCorpCardId of state.corp.hq) expect(runnerSurface).not.toContain(hiddenCorpCardId);
    const corpSurface = JSON.stringify(getPlayerView(state, "corp"));
    for (const hiddenRunnerCardId of state.runner.grip) expect(corpSurface).not.toContain(hiddenRunnerCardId);

    const replay = replayEvents(initial, state.eventLog.slice(initial.eventLog.length));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

function actionOfType(actions: LegalAction[], type: LegalAction["type"]): LegalAction {
  const action = actions.find((candidate) => candidate.type === type);
  if (!action) throw new Error(`Expected legal action ${type}; received ${actions.map((candidate) => candidate.type).join(", ")}.`);
  return action;
}

function playerActionFor(state: GameState, legalAction: LegalAction): PlayerAction {
  return {
    matchId: state.matchId,
    side: legalAction.side,
    actionId: legalAction.actionId,
    clientKnownStateVersion: state.stateVersion,
  };
}

function applyType(state: GameState, side: Side, type: LegalAction["type"]): GameState {
  return applyPlayerAction(state, playerActionFor(state, actionOfType(getLegalActions(state, side), type)));
}

function applyPlayerAction(state: GameState, playerAction: PlayerAction): GameState {
  const result = applyAction(state, playerAction);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.state;
}
