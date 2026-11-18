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
  moveRunnerCardToGrip,
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

it("keeps Social Engineering target offers and pending auto-pass references independent of concealed definitions", () => {
  const base = toRunnerTurn(
    createGameAfterSetup({
      seed: "independent-social-engineering-slots",
      runnerDeck: {
        ...DEMO_DECKS.demo_runner_001,
        cards: [...DEMO_DECKS.demo_runner_001.cards, { id: 323, quantity: 1 }],
      },
      corpDeck: DEMO_DECKS.demo_corp_001,
    }),
  );
  base.runner.credits = 10;
  moveRunnerCardToGrip(base, 323);
  moveCorpCardToHq(base, 589);
  moveCorpCardToHq(base, 590);
  const alternatives = [589, 590].map((definitionId) => {
    let state = structuredClone(base);
    const privateId = putCorpIceOnServer(state, "rd", definitionId);
    putCorpIceOnServer(state, "rd", definitionId === 589 ? 590 : 589);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" && sourceDefinition(state, action) === 323,
    );
    state = applyChoice(state, "runner", "hide_3");
    state = applyChoice(state, "corp", "guess_2");
    return { state, privateId };
  });
  const offers = alternatives.map(
    ({ state }) => getPlayerView(state, "runner").pendingChoice!,
  );
  expect(offers[0]).toEqual(offers[1]);
  expect(offers[0]!.options).toEqual([
    {
      id: "ice_rd.0",
      label: "R&D ICE 1",
      publicLabel: "R&D ICE 1",
      metadata: { targetServerId: "rd", targetIcePosition: 0 },
    },
    {
      id: "ice_rd.1",
      label: "R&D ICE 2",
      publicLabel: "R&D ICE 2",
      metadata: { targetServerId: "rd", targetIcePosition: 1 },
    },
  ]);
  for (const { state, privateId } of alternatives) {
    expect(
      JSON.stringify(getPlayerView(state, "runner").pendingChoice),
    ).not.toContain(privateId);
    const invalidBinding = structuredClone(state);
    invalidBinding.pendingChoice!.options[0]!.metadata!.targetIcePosition = 1;
    const action = mustAction(
      invalidBinding,
      "runner",
      (offer) => offer.type === "resolve_choice",
    );
    const invalid = applyAction(invalidBinding, {
      matchId: state.matchId,
      side: "runner",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice!.choiceId,
        selectedOptionIds: ["ice_rd.0"],
      },
    });
    expect(invalid.ok).toBe(false);
    const resolved = applyChoice(state, "runner", "ice_rd.0");
    expect(resolved.run?.secretSpendGuessRunAutoPassIceId).toBe(privateId);
    expect(getPlayerView(resolved, "runner").run?.pendingAutoPassIceId).toBe(
      "hrd.i0",
    );
    expect(getPlayerView(resolved, "corp").run?.pendingAutoPassIceId).toBe(
      privateId,
    );
    const replay = replayEvents(
      state,
      resolved.eventLog.slice(state.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(resolved));
  }
});
