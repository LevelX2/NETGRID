import { describe, expect, it } from "vitest";
import {
  createGameAfterSetup,
  getPlayerView,
  hashState,
  replayEvents,
} from "../../index";
import {
  apply,
  applyChoice,
  moveRunnerCardToGrip,
  ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
  ONR_V1_RUNNER_DECK,
  putCorpRootInRemote,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import type { CardInstanceId, GameState } from "@netgrid/shared";

const CITY_SURVEILLANCE_ID = "onr_v1_313_city-surveillance";
const JACK_N_JOE_ID = "onr_v1_095_jack-n-joe";

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

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === jackId,
    );

    expect(state.runner.stack).toHaveLength(stackBefore - 1);
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("runner_draw.city_surveillance"),
    });
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual([
      "pay_credit",
      "take_tag",
    ]);

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
      source: expect.stringContaining("runner_draw.city_surveillance_rez"),
    });
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual([
      `rez_${cityId}`,
      "pass",
    ]);
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();

    state = applyChoice(state, "corp", `rez_${cityId}`);
    expect(state.cardInstances[cityId]?.rezzed).toBe(true);
    expect(state.corp.credits).toBe(0);
    expect(state.runner.stack).toHaveLength(stackBefore - 1);
    expect(state.pendingChoice?.side).toBe("runner");
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
