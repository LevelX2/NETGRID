import { expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  DEMO_DECKS,
  getPlayerView,
  hashState,
  replayEvents,
  validateGameState,
} from "../../index";
import {
  apply,
  applyChoice,
  installRunnerProgramForTest,
  moveCorpCardToHq,
  mustAction,
  putCorpIceOnServer,
  sourceDefinition,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";

it("offers identical positional views and exposure choices for different concealed ICE", () => {
  const base = toRunnerTurn(
    createGameAfterSetup({
      seed: "independent-hidden-positions",
      runnerDeck: {
        ...DEMO_DECKS.demo_runner_001,
        cards: [...DEMO_DECKS.demo_runner_001.cards, { id: 270, quantity: 1 }],
      },
      corpDeck: DEMO_DECKS.demo_corp_001,
    }),
  );
  installRunnerProgramForTest(base, 270);
  moveCorpCardToHq(base, 589);
  moveCorpCardToHq(base, 590);
  const alternatives = [589, 590].map((definitionId) => {
    const state = structuredClone(base);
    const privateId = putCorpIceOnServer(state, "rd", definitionId);
    putCorpIceOnServer(state, "rd", definitionId === 589 ? 590 : 589);
    expect(validateGameState(state).ok).toBe(true);
    return { state, privateId, definitionId };
  });
  const [first, second] = alternatives;
  expect(first!.privateId).not.toBe(second!.privateId);
  expect(getPlayerView(first!.state, "runner")).toEqual(
    getPlayerView(second!.state, "runner"),
  );
  const choices = alternatives.map(({ state }) => {
    const expose = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === 270,
    );
    return apply(
      state,
      "runner",
      (action) => action.actionId === expose.actionId,
    );
  });
  expect(getPlayerView(choices[0]!, "runner").pendingChoice).toEqual(
    getPlayerView(choices[1]!, "runner").pendingChoice,
  );
  expect(getPlayerView(choices[0]!, "runner").pendingChoice?.options).toEqual([
    { id: "card_hrd.i0", label: "R&D ICE 1" },
    { id: "card_hrd.i1", label: "R&D ICE 2" },
  ]);
  for (const [index, initial] of choices.entries()) {
    const choiceAction = mustAction(
      initial,
      "runner",
      (action) => action.type === "resolve_choice",
    );
    const resolved = applyChoice(initial, "runner", "card_hrd.i0");
    expect(resolved.pendingChoice?.source).toContain(
      alternatives[index]!.privateId,
    );
    expect(resolved.eventLog.at(-1)?.publicPayload).toMatchObject({
      publicRevealDefinitionId: alternatives[index]!.definitionId,
    });
    expect(
      applyAction(resolved, {
        matchId: initial.matchId,
        side: "runner",
        actionId: choiceAction.actionId,
        clientKnownStateVersion: initial.stateVersion,
      }),
    ).toMatchObject({ ok: false, error: { code: "ERR_STALE_STATE" } });
    const replay = replayEvents(
      initial,
      resolved.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(resolved));
  }
});
