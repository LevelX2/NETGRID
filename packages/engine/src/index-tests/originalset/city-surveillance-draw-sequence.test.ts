import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "../../index";
import {
  apply,
  applyChoice,
  installRunnerResourceForTest,
  moveRunnerCardToGrip,
  ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
  ONR_V1_RUNNER_DECK,
  putCorpRootInRemote,
  removeEverywhere,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import type { CardInstanceId, GameState } from "@netgrid/shared";

const CITY_SURVEILLANCE_ID = "onr_v1_313_city-surveillance";
const JACK_N_JOE_ID = "onr_v1_095_jack-n-joe";
const BODYWEIGHT_ID = "onr_v1_079_bodyweight-synthetic-blood";
const CRASH_EVERETT_ID = "onr_v1_157_crash-everett-inventive-fixer";
const FALL_GUY_ID = "onr_v1_161_fall-guy";

describe("City Surveillance per-draw decisions", () => {
  it("lets Jack 'n' Joe resolve three independent pay-or-tag decisions", () => {
    let state = cityGame("city-surveillance-jack-combinations");
    const cityId = putCorpRootInRemote(state, CITY_SURVEILLANCE_ID);
    rezForTest(state, cityId);
    state.runner.credits = 3;
    state.runner.tags = 0;
    const jackId = moveRunnerCardToGrip(state, JACK_N_JOE_ID);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const stackBefore = state.runner.stack.length;
    const firstDrawnCardId = state.runner.stack[0];
    if (!firstDrawnCardId) throw new Error("Missing Runner stack card");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === jackId,
    );
    expect(state.runner.stack).toHaveLength(stackBefore - 1);
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("runner_draw.draw_tax"),
    });
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual([
      "pay_credit",
      "take_tag",
    ]);
    const runnerView = getPlayerView(state, "runner");
    const corpView = getPlayerView(state, "corp");
    expect(runnerView.pendingChoice?.choiceId).toBe(
      state.pendingChoice?.choiceId,
    );
    expect(
      runnerView.legalActions.find((action) => action.type === "resolve_choice")
        ?.choiceRequirements?.[0]?.optionIds,
    ).toEqual(["pay_credit", "take_tag"]);
    expect(corpView.pendingChoice).toBeUndefined();
    expect(JSON.stringify(corpView)).not.toContain(firstDrawnCardId);
    expect(JSON.stringify(runnerView)).not.toContain("runnerDrawSequence");
    expect(JSON.stringify(corpView)).not.toContain("runnerDrawSequence");

    state = applyChoice(state, "runner", "pay_credit");
    expect(state.runner.stack).toHaveLength(stackBefore - 2);
    expect(state.runner.credits).toBe(2);
    expect(state.runner.tags).toBe(0);
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual([
      "pay_credit",
      "take_tag",
    ]);

    state = applyChoice(state, "runner", "take_tag");
    expect(state.runner.stack).toHaveLength(stackBefore - 3);
    expect(state.runner.credits).toBe(2);
    expect(state.runner.tags).toBe(1);
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual([
      "pay_credit",
      "take_tag",
    ]);

    state = applyChoice(state, "runner", "pay_credit");
    expect(state.runner.credits).toBe(1);
    expect(state.runner.tags).toBe(1);
    expect(state.pendingChoice).toBeUndefined();

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("resolves every rezzed City Surveillance copy separately", () => {
    let state = cityGame("city-surveillance-two-sources");
    const firstCityId = putCorpRootInRemote(state, CITY_SURVEILLANCE_ID);
    rezForTest(state, firstCityId);
    const secondCityId = addSecondRezzedCityForTest(state, firstCityId);
    state.runner.credits = 2;
    state.runner.tags = 0;
    const stackBefore = state.runner.stack.length;

    state = apply(state, "runner", (action) => action.type === "draw_card");

    expect(state.runner.stack).toHaveLength(stackBefore - 1);
    expect(state.pendingChoice?.source).toContain(firstCityId);
    state = applyChoice(state, "runner", "take_tag");
    expect(state.pendingChoice?.source).toContain(secondCityId);
    state = applyChoice(state, "runner", "pay_credit");

    expect(state.runner.credits).toBe(1);
    expect(state.runner.tags).toBe(1);
    expect(state.pendingChoice).toBeUndefined();
  });

  it("suspends the draw sequence for tag avoidance and resumes once after avoid or pass", () => {
    let state = cityGameWithFallGuy("city-surveillance-tag-continuation");
    const fallGuyId = installRunnerResourceForTest(state, FALL_GUY_ID);
    const cityId = putCorpRootInRemote(state, CITY_SURVEILLANCE_ID);
    rezForTest(state, cityId);
    state.runner.credits = 0;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const stackBefore = state.runner.stack.length;

    state = apply(state, "runner", (action) => action.type === "draw_card");
    expect(state.runner.stack).toHaveLength(stackBefore - 1);
    state = applyChoice(state, "runner", "take_tag");

    expect(state.runner.tags).toBe(0);
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("event_modification"),
    });
    expect(state.pendingAddTagContinuation).toMatchObject({
      kind: "runner_draw_tax",
      sourceCardId: cityId,
    });
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "pendingAddTagContinuation",
    );

    const passState = applyChoice(structuredClone(state), "runner", "pass");
    expect(passState.runner.tags).toBe(1);
    expect(passState.runner.rig.resources).toContain(fallGuyId);
    expect(passState.runnerDrawSequence).toBeUndefined();
    expect(passState.pendingAddTagContinuation).toBeUndefined();

    const fallGuyOption = state.pendingChoice?.options.find((option) =>
      option.id.includes(String(fallGuyId)),
    )?.id;
    const avoidState = applyChoice(state, "runner", String(fallGuyOption));
    expect(avoidState.runner.tags).toBe(0);
    expect(avoidState.runner.heap).toContain(fallGuyId);
    expect(avoidState.runnerDrawSequence).toBeUndefined();
    expect(avoidState.pendingAddTagContinuation).toBeUndefined();

    for (const branch of [passState, avoidState]) {
      const replay = replayEvents(initial, branch.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(branch));
    }
  });

  it("pauses a five-card Bodyweight draw once per card", () => {
    let state = cityGame("city-surveillance-bodyweight-five");
    const cityId = putCorpRootInRemote(state, CITY_SURVEILLANCE_ID);
    rezForTest(state, cityId);
    state.runner.credits = 10;
    state.runner.tags = 0;
    const bodyweightId = moveRunnerCardToGrip(state, BODYWEIGHT_ID);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const stackBefore = state.runner.stack.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === bodyweightId,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      drawCardsAmount: 5,
      drawnCount: 1,
      drawTaxSourceCount: 1,
    });
    const creditsAfterPlay = state.runner.credits;

    const decisions = [
      "pay_credit",
      "take_tag",
      "pay_credit",
      "take_tag",
      "pay_credit",
    ] as const;
    for (const [index, decision] of decisions.entries()) {
      expect(state.runner.stack).toHaveLength(stackBefore - index - 1);
      expect(state.pendingChoice?.source).toContain("runner_draw.draw_tax");
      state = applyChoice(state, "runner", decision);
    }

    expect(state.runner.stack).toHaveLength(stackBefore - 5);
    expect(state.runner.credits).toBe(creditsAfterPlay - 3);
    expect(state.runner.tags).toBe(2);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runnerDrawSequence).toBeUndefined();
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("stops a five-card draw cleanly when the stack runs out", () => {
    let state = cityGame("city-surveillance-short-stack");
    const cityId = putCorpRootInRemote(state, CITY_SURVEILLANCE_ID);
    rezForTest(state, cityId);
    state.runner.credits = 10;
    const bodyweightId = moveRunnerCardToGrip(state, BODYWEIGHT_ID);
    for (const cardId of state.runner.stack.slice(2)) {
      removeEverywhere(state, cardId);
      state.runner.heap.push(cardId);
      state.cardInstances[cardId] = {
        ...state.cardInstances[cardId]!,
        faceup: true,
        rezzed: true,
        zone: { side: "runner", zone: "heap" },
      };
    }

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === bodyweightId,
    );
    let decisions = 0;
    while (state.pendingChoice?.source.startsWith("runner_draw.draw_tax:")) {
      decisions += 1;
      state = applyChoice(state, "runner", "take_tag");
    }

    expect(decisions).toBe(2);
    expect(state.runner.stack).toHaveLength(0);
    expect(state.runner.tags).toBe(2);
    expect(state.runnerDrawSequence).toBeUndefined();
  });

  it("taxes the Crash Everett extra draw before opening its hidden choice", () => {
    let state = cityGameWithCrash("city-surveillance-crash-extra-draw");
    state.runner.credits = 10;
    const crashId = moveRunnerCardToGrip(state, CRASH_EVERETT_ID);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" && action.payload?.cardId === crashId,
    );
    const cityId = putCorpRootInRemote(state, CITY_SURVEILLANCE_ID);
    rezForTest(state, cityId);
    state.runner.credits = 1;
    state.runner.tags = 0;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const stackBefore = state.runner.stack.length;

    state = apply(state, "runner", (action) => action.type === "draw_card");
    state = applyChoice(state, "runner", "pay_credit");
    state = applyChoice(state, "runner", "take_tag");

    expect(state.runner.stack).toHaveLength(stackBefore - 2);
    expect(state.runner.credits).toBe(0);
    expect(state.runner.tags).toBe(1);
    expect(state.pendingChoice?.source).toContain("p3_61.crash_draw");
    expect(state.pendingChoice?.options).toHaveLength(4);
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const topOption = state.pendingChoice?.options.find((option) =>
      option.id.startsWith("top_"),
    );
    const returnedCardId = String(topOption?.value ?? "").split(":")[0];
    state = applyChoice(state, "runner", topOption?.id ?? "");
    expect(state.runner.stack[0]).toBe(returnedCardId);
    expect(
      JSON.stringify(
        state.eventLog.slice(replayStart).map((event) => event.publicPayload),
      ),
    ).not.toContain(returnedCardId);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("preserves the Crash Everett continuation after passing every pre-draw rez window", () => {
    let state = cityGameWithCrash("city-surveillance-crash-rez-pass");
    state.runner.credits = 10;
    const crashId = moveRunnerCardToGrip(state, CRASH_EVERETT_ID);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" && action.payload?.cardId === crashId,
    );
    const cityId = putCorpRootInRemote(state, CITY_SURVEILLANCE_ID);
    state.corp.credits = 1;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const stackBefore = state.runner.stack.length;

    state = apply(state, "runner", (action) => action.type === "draw_card");
    expect(state.pendingChoice?.side).toBe("corp");
    state = applyChoice(state, "corp", "pass");
    expect(state.pendingChoice?.side).toBe("corp");
    state = applyChoice(state, "corp", "pass");

    expect(state.cardInstances[cityId]?.rezzed).toBe(false);
    expect(state.runner.stack).toHaveLength(stackBefore - 2);
    expect(state.pendingChoice?.source).toContain("p3_61.crash_draw");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      crashEverettChoiceOpened: true,
      drawReplacementExtraDrawn: 1,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("offers the Corp the printed rez window before the first Jack 'n' Joe draw", () => {
    let state = cityGame("city-surveillance-pre-draw-rez");
    const cityId = putCorpRootInRemote(state, CITY_SURVEILLANCE_ID);
    state.corp.credits = 1;
    state.runner.credits = 3;
    const jackId = moveRunnerCardToGrip(state, JACK_N_JOE_ID);
    const stackBefore = state.runner.stack.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === jackId,
    );

    expect(state.runner.stack).toHaveLength(stackBefore);
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      source: expect.stringContaining("runner_draw.draw_tax_rez"),
    });
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual([
      `rez_${cityId}`,
      "pass",
    ]);
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(getPlayerView(state, "corp").pendingChoice).toMatchObject({
      choiceId: state.pendingChoice?.choiceId,
      side: "corp",
      visibility: "hidden_info_barrier",
    });

    state = applyChoice(state, "corp", `rez_${cityId}`);
    expect(state.cardInstances[cityId]?.rezzed).toBe(true);
    expect(state.corp.credits).toBe(0);
    expect(state.runner.stack).toHaveLength(stackBefore - 1);
    expect(state.pendingChoice?.side).toBe("runner");
  });

  it("offers the rez window again before every card after the Corp passes", () => {
    let state = cityGame("city-surveillance-rez-pass-each-card");
    const cityId = putCorpRootInRemote(state, CITY_SURVEILLANCE_ID);
    state.corp.credits = 1;
    const jackId = moveRunnerCardToGrip(state, JACK_N_JOE_ID);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const stackBefore = state.runner.stack.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === jackId,
    );
    for (let index = 0; index < 3; index += 1) {
      expect(state.pendingChoice).toMatchObject({
        side: "corp",
        source: expect.stringContaining("runner_draw.draw_tax_rez"),
      });
      state = applyChoice(state, "corp", "pass");
      expect(state.runner.stack).toHaveLength(stackBefore - index - 1);
    }

    expect(state.cardInstances[cityId]?.rezzed).toBe(false);
    expect(state.runner.tags).toBe(0);
    expect(state.pendingChoice).toBeUndefined();
    expect(
      JSON.stringify(
        state.eventLog.slice(replayStart).map((event) => event.publicPayload),
      ),
    ).not.toContain(cityId);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("draws without a rez window when the Corp cannot afford City Surveillance", () => {
    let state = cityGame("city-surveillance-rez-unaffordable");
    const cityId = putCorpRootInRemote(state, CITY_SURVEILLANCE_ID);
    state.corp.credits = 0;
    const jackId = moveRunnerCardToGrip(state, JACK_N_JOE_ID);
    const stackBefore = state.runner.stack.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === jackId,
    );

    expect(state.runner.stack).toHaveLength(stackBefore - 3);
    expect(state.cardInstances[cityId]?.rezzed).toBe(false);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runnerDrawSequence).toBeUndefined();
  });

  it("allows multiple City Surveillance copies to rez before the same card", () => {
    let state = cityGame("city-surveillance-rez-multiple-copies");
    const firstCityId = putCorpRootInRemote(state, CITY_SURVEILLANCE_ID);
    const secondCityId = addSecondRezzedCityForTest(state, firstCityId);
    state.corp.credits = 2;
    const jackId = moveRunnerCardToGrip(state, JACK_N_JOE_ID);
    const stackBefore = state.runner.stack.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === jackId,
    );
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual([
      `rez_${firstCityId}`,
      `rez_${secondCityId}`,
      "pass",
    ]);
    state = applyChoice(state, "corp", `rez_${firstCityId}`);
    expect(state.runner.stack).toHaveLength(stackBefore);
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual([
      `rez_${secondCityId}`,
      "pass",
    ]);
    state = applyChoice(state, "corp", `rez_${secondCityId}`);

    expect(state.runner.stack).toHaveLength(stackBefore - 1);
    expect(state.corp.credits).toBe(0);
    expect(state.pendingChoice?.side).toBe("runner");
    expect(state.pendingChoice?.source).toContain(firstCityId);
    state = applyChoice(state, "runner", "take_tag");
    expect(state.pendingChoice?.source).toContain(secondCityId);
  });

  it("rejects a stale City Surveillance rez decision", () => {
    let state = cityGame("city-surveillance-rez-stale");
    const cityId = putCorpRootInRemote(state, CITY_SURVEILLANCE_ID);
    state.corp.credits = 1;
    const jackId = moveRunnerCardToGrip(state, JACK_N_JOE_ID);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === jackId,
    );
    const choiceAction = getLegalActions(state, "corp").find(
      (action) => action.type === "resolve_choice",
    );
    if (!choiceAction || !state.pendingChoice)
      throw new Error("Missing City Surveillance rez choice");

    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: choiceAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      selectedChoices: {
        choiceId: state.pendingChoice.choiceId,
        selectedOptionIds: [`rez_${cityId}`],
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("ERR_STALE_STATE");
  });
});

function cityGame(seed: string): GameState {
  return toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: ONR_V1_RUNNER_DECK,
      corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
      agendaPointsToWin: 7,
    }),
  );
}

function cityGameWithCrash(seed: string): GameState {
  return toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: {
        ...ONR_V1_RUNNER_DECK,
        id: `${ONR_V1_RUNNER_DECK.id}_crash`,
        name: `${ONR_V1_RUNNER_DECK.name} + Crash Everett`,
        cards: [
          ...ONR_V1_RUNNER_DECK.cards,
          { id: CRASH_EVERETT_ID, quantity: 1 },
        ],
      },
      corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
      agendaPointsToWin: 7,
    }),
  );
}

function cityGameWithFallGuy(seed: string): GameState {
  return toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: {
        ...ONR_V1_RUNNER_DECK,
        id: `${ONR_V1_RUNNER_DECK.id}_fall_guy`,
        name: `${ONR_V1_RUNNER_DECK.name} + Fall Guy`,
        cards: [
          ...ONR_V1_RUNNER_DECK.cards,
          { id: FALL_GUY_ID, quantity: 1 },
        ],
      },
      corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
      agendaPointsToWin: 7,
    }),
  );
}

function rezForTest(state: GameState, cardId: CardInstanceId): void {
  state.cardInstances[cardId] = {
    ...state.cardInstances[cardId]!,
    faceup: true,
    rezzed: true,
  };
}

function addSecondRezzedCityForTest(
  state: GameState,
  sourceCardId: CardInstanceId,
): CardInstanceId {
  const source = state.cardInstances[sourceCardId];
  if (!source) throw new Error("Missing City Surveillance test source");
  const secondCardId = `${sourceCardId}_copy` as CardInstanceId;
  state.cardInstances[secondCardId] = {
    ...source,
    instanceId: secondCardId,
  };
  const server = state.corp.servers.find(
    (candidate) => candidate.id === "remote_1",
  );
  if (!server) throw new Error("Missing City Surveillance test server");
  server.root.push(secondCardId);
  return secondCardId;
}
