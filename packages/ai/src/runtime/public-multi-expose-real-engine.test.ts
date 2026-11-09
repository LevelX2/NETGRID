import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type DeckDefinition,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import { reconstructBeliefState } from "../belief-state";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { publicInstalledExposures } from "../public-installed-exposure";
import { runnerExposeInstalledOpportunity } from "../runner/expose-information/expose-installed-card-choice";
import { buildAiDecisionInput } from "./ai-decision-input";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";

afterEach(resetResidentPlanPortfolioMemory);

const HUNT = "onr_v1_091_hunt-club-bbs";
const GUIDE = "onr_v1_092_ice-and-datas-guide-to-the-net";
const REPORT = "onr_proteus_111_ice-and-data-special-report";
const BLOCKS = "onr_proteus_017_credit-blocks";
const WALL = "onr_v1_245_fire-wall";
const FETAL = "onr_proteus_004_fetal-ai";
const runnerDeck: DeckDefinition = {
  ...DEMO_DECKS.demo_runner_001,
  id: "public-multi-expose-runner",
  cards: [
    ...DEMO_DECKS.demo_runner_001.cards,
    ...[HUNT, GUIDE, REPORT].map((id) => ({ id, quantity: 1 })),
  ],
};
const corpDeck: DeckDefinition = {
  ...DEMO_DECKS.demo_corp_001,
  id: "public-multi-expose-corp",
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards,
    ...[BLOCKS, WALL, FETAL].map((id) => ({ id, quantity: 1 })),
  ],
};

function apply(
  state: GameState,
  side: "runner" | "corp",
  predicate: (action: LegalAction) => boolean,
  selectedOptionIds?: string[],
): GameState {
  const action = getLegalActions(state, side).find(predicate);
  if (!action) throw new Error("Missing native expose fixture action");
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedOptionIds
      ? {
          selectedChoices: {
            choiceId: state.pendingChoice!.choiceId,
            selectedOptionIds,
          },
        }
      : {}),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function fixture(source: string) {
  let state = createGameAfterSetup({
    seed: "public-multi-expose",
    runnerDeck,
    corpDeck,
  });
  state = apply(state, "corp", (a) => a.type === "mandatory_draw");
  RealEngineFixtureBuilder.forState(state).withCorpHqSize(0);
  state = apply(state, "corp", (a) => a.type === "end_turn");
  RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(20)
    .withRunnerGripSize(0)
    .withRunnerCardInGrip(source)
    .withCorpIceOnServer("hq", WALL)
    .withCorpIceOnServer("remote_1", BLOCKS)
    .withCorpRemoteRoot("remote_2", FETAL);
  return state;
}

function playSource(state: GameState, source: string) {
  const cardId = state.runner.grip.find(
    (id) => state.cardInstances[id]!.definitionId === source,
  )!;
  return apply(
    state,
    "runner",
    (a) => a.type === "play_event" && a.payload?.cardId === cardId,
  );
}

function selectCards(state: GameState, definitionIds: string[]) {
  const selected = definitionIds.map((definitionId) => {
    const option = state.pendingChoice!.options.find(
      (entry) =>
        typeof entry.value === "string" &&
        state.cardInstances[entry.value]?.definitionId === definitionId,
    );
    if (!option) throw new Error("Missing native expose target");
    return option.id;
  });
  return apply(state, "runner", (a) => a.type === "resolve_choice", selected);
}

function input(state: GameState) {
  return buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: runnerDeck.id,
      side: "runner",
      cards: runnerDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}

it.each([HUNT, REPORT, GUIDE])(
  "remembers the real Engine expose bindings after %s without repeating that target",
  (source) => {
    const initial = fixture(source);
    const initialEventCount = initial.eventLog.length;
    let state = playSource(initial, source);
    if (source === REPORT)
      state = apply(state, "runner", (a) => a.type === "resolve_choice", [
        "fort_remote_1",
      ]);
    if (source !== GUIDE) state = selectCards(state, [BLOCKS]);
    const event = state.eventLog.at(-1)!;
    expect(event.publicPayload).toMatchObject({
      publicRevealKind: "expose",
      exposedServerIds: source === GUIDE ? "hq,remote_1" : "remote_1",
      exposedPositionKeys: source === GUIDE ? "ice:0,ice:0" : "ice:0",
    });
    const current = input(state);
    const before = JSON.stringify(current);
    expect(
      reconstructBeliefState(current).runnerOpponentModel!.knownPositionMemory,
    ).toContainEqual(
      expect.objectContaining({
        zone: "remote_1",
        positionKey: "ice:0",
        definitionId: BLOCKS,
        sourceEventId: event.eventId,
        sourceKind: "expose",
      }),
    );
    expect(
      runnerExposeInstalledOpportunity(current).unseenPositions,
    ).not.toContainEqual(
      expect.objectContaining({
        serverId: "remote_1",
        area: "ice",
        index: 0,
      }),
    );
    expect(JSON.stringify(current)).toBe(before);
    expect(JSON.stringify(event.publicPayload)).not.toContain(FETAL);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(FETAL);
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initialEventCount),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  },
);

it("keeps aligned observations from different server areas in one actual expose choice", () => {
  let state = playSource(fixture(HUNT), HUNT);
  state = selectCards(state, [WALL, FETAL]);
  expect(state.eventLog.at(-1)!.publicPayload).toMatchObject({
    publicRevealDefinitionIds: `${WALL},${FETAL}`,
    exposedServerIds: "hq,remote_2",
    exposedPositionKeys: "ice:0,root:0",
  });
  const memory = reconstructBeliefState(input(state)).runnerOpponentModel!
    .knownPositionMemory;
  expect(memory).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        zone: "hq",
        positionKey: "ice:0",
        definitionId: WALL,
      }),
      expect.objectContaining({
        zone: "remote_2",
        positionKey: "root:0",
        definitionId: FETAL,
      }),
    ]),
  );
  expect(JSON.stringify(state.eventLog.at(-1)!.publicPayload)).not.toContain(
    BLOCKS,
  );
});

it("creates no remembered observation for an actual zero-target choice", () => {
  let state = playSource(fixture(HUNT), HUNT);
  state = selectCards(state, []);
  expect(state.eventLog.at(-1)!.publicPayload.revealedCount).toBe(0);
  const memory = reconstructBeliefState(input(state)).runnerOpponentModel!
    .knownPositionMemory;
  expect(
    memory.some((entry) => [WALL, BLOCKS, FETAL].includes(entry.definitionId)),
  ).toBe(false);
});

it("accepts the explicit no-fort result of a real optional exposure", () => {
  let state = playSource(fixture(REPORT), REPORT);
  state = apply(state, "runner", (action) => action.type === "resolve_choice", [
    "fort_none",
  ]);
  expect(state.eventLog.at(-1)!.publicPayload).toMatchObject({
    hiddenZoneAction: "expose_installed_cards_single_fort",
    revealedCount: 0,
  });
  expect(input(state).eventTail.at(-1)!.publicPayload.revealedCount).toBe(0);
  expect(
    reconstructBeliefState(input(state)).runnerOpponentModel!
      .knownPositionMemory,
  ).toEqual([]);
});

it("keeps an exposed installed R&D card separate from the hidden deck top", () => {
  const initial = fixture(HUNT);
  RealEngineFixtureBuilder.forState(initial).withCorpIceOnServer("rd", BLOCKS);
  const state = selectCards(playSource(initial, HUNT), [BLOCKS]);
  const memory = reconstructBeliefState(input(state)).runnerOpponentModel!
    .knownPositionMemory;
  expect(memory).toContainEqual(
    expect.objectContaining({
      zone: "rd",
      positionKey: "ice:0",
      definitionId: BLOCKS,
    }),
  );
  expect(
    memory.some(
      (entry) => entry.zone === "rd" && /^top/.test(entry.positionKey),
    ),
  ).toBe(false);
});

it("resolves the next real expose action toward an unseen target under the existing window owner", () => {
  const initial = fixture(GUIDE);
  RealEngineFixtureBuilder.forState(initial).withRunnerCardInGrip(HUNT);
  let state = playSource(initial, GUIDE);
  state = playSource(state, HUNT);
  const expected = state.pendingChoice!.options.find(
    (option) =>
      typeof option.value === "string" &&
      state.cardInstances[option.value]?.definitionId === FETAL,
  )!;
  const current = input(state);
  const before = hashState(state);
  const decision = chooseAiAction(current);
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(decision.actionId).toBe("runner.resolve_choice");
  expect(decision.selectedChoices).toEqual({
    choiceId: state.pendingChoice!.choiceId,
    selectedOptionIds: [expected.id],
  });
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "rules",
    leafExecutorInstanceId: "rules.window_resolution",
  });
  expect(hashState(state)).toBe(before);
});

it.each(["missing_position", "duplicate_position", "contradictory_count"])(
  "rejects an ambiguous public expose binding without guessing (%s)",
  (mutation) => {
    const state = playSource(fixture(GUIDE), GUIDE);
    const current = input(state);
    const event = structuredClone(current.eventTail.at(-1)!);
    if (mutation === "missing_position")
      event.publicPayload.exposedPositionKeys = "ice:0";
    else if (mutation === "duplicate_position") {
      event.publicPayload.exposedServerIds = "hq,hq";
      event.publicPayload.exposedPositionKeys = "ice:0,ice:0";
    } else event.publicPayload.revealedCount = 0;
    expect(() =>
      publicInstalledExposures(current.playerView, event),
    ).toThrowError(
      expect.objectContaining({
        code: "invalid_player_view_card_projection",
        context: expect.objectContaining({ owner: "rules_contract" }),
      }),
    );
  },
);
