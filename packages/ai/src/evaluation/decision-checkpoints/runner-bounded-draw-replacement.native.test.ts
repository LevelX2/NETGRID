import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import {
  installRunnerResourceForTest,
  moveRunnerCardToGrip,
  removeEverywhere,
  toRunnerTurn,
  putCorpRootInRemote,
} from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { runnerGenericDrawDevelopmentSignals } from "../../runner/hand-development/development-signals";
import { coverageSupportActionIds } from "../../runner/rig-coverage/coverage-support";
import { assessRunnerHandRotation } from "../../runtime/runner-hand-rotation-assessment";
import { buildRunnerEconomyPosture } from "../../runner-economy-posture";
import type { RunnerStrategicIntentProfile } from "../../runner-strategic-intent";

const crash = "onr_v1_157_crash-everett-inventive-fixer",
  saloon = "onr_v1_179_silicon-saloon-franchise",
  junkyard = "onr_v1_165_junkyard-bbs",
  jack = "onr_v1_095_jack-n-joe";
const deck = {
  ...ORIGINALSET_DEFAULT_DECKS.runner,
  cards: [
    ...ORIGINALSET_DEFAULT_DECKS.runner.cards.filter(
      (c) => ![crash, saloon, junkyard, jack].includes(c.id),
    ),
    { id: crash, quantity: 1 },
    { id: saloon, quantity: 1 },
    { id: junkyard, quantity: 1 },
    { id: jack, quantity: 1 },
  ],
} as typeof ORIGINALSET_DEFAULT_DECKS.runner;
function fixture(stackCount = 1, withCrash = true, activeDeck = deck) {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed: `bounded-draw:${stackCount}:${withCrash}`,
      runnerDeck: activeDeck,
      corpDeck: {
        ...ORIGINALSET_DEFAULT_DECKS.corp,
        cards: [
          ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
            (c) => c.id !== "onr_v1_313_city-surveillance",
          ),
          { id: "onr_v1_313_city-surveillance", quantity: 1 },
        ],
      },
    }),
  );
  if (withCrash) installRunnerResourceForTest(state, crash);
  installRunnerResourceForTest(state, saloon);
  installRunnerResourceForTest(state, junkyard);
  moveRunnerCardToGrip(state, jack);
  while (state.runner.grip.length > 1) {
    const id = state.runner.grip.find(
      (id) => state.cardInstances[id]!.definitionId !== jack,
    )!;
    removeEverywhere(state, id);
    state.runner.heap.push(id);
    state.cardInstances[id]!.zone = { side: "runner", zone: "heap" };
  }
  while (state.runner.stack.length > stackCount) {
    const id = state.runner.stack.pop()!;
    state.runner.heap.push(id);
    state.cardInstances[id]!.zone = { side: "runner", zone: "heap" };
  }
  state.runner.credits = 18;
  state.runner.clicks = 4;
  return state;
}
function saloonAction(state: GameState) {
  return getLegalActions(state, "runner").find(
    (a) =>
      a.type === "activated_card_ability" &&
      a.payload?.drawCardsAmount !== undefined &&
      a.source !== "basic_action",
  )!;
}
function project(state: GameState, action: LegalAction) {
  return buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: "runner",
    stateVersion: state.stateVersion,
  })[0]!.economyProjection!;
}
function act(state: GameState, action: LegalAction, optionId?: string) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `bounded-draw:${state.stateVersion}`,
    ...(action.type === "resolve_choice"
      ? {
          selectedChoices: {
            choiceId: state.pendingChoice!.choiceId,
            selectedOptionIds: [
              optionId ??
                state.pendingChoice!.options.find((o) =>
                  o.id.startsWith("trash_"),
                )!.id,
            ],
          },
        }
      : {}),
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}
afterEach(resetResidentPlanPortfolioMemory);

it.each([
  [1, true, 1, 0],
  [2, true, 2, 1],
  [1, false, 1, 1],
  [0, true, 0, 0],
] as const)(
  "quotes and executes an installed draw with stack %i / replacement %s",
  (stackCount, withCrash, gross, net) => {
    let state = fixture(stackCount, withCrash);
    const action = saloonAction(state),
      before = structuredClone(state),
      hand = state.runner.grip.length,
      start = state.eventLog.length;
    expect(action.payload).toMatchObject({
      projectedGrossDrawCount: gross,
      projectedPostDrawDispositionCount: withCrash && gross > 0 ? 1 : 0,
      projectedNetHandDelta: net,
    });
    expect(project(state, action)).toMatchObject({
      cardsDrawn: gross,
      cardsConsumed: 0,
      netHandDelta: net,
    });
    state = act(state, action);
    if (state.pendingChoice)
      state = act(state, getLegalActions(state, "runner")[0]!);
    expect(state.runner.grip.length - hand).toBe(net);
    expect(state.runner.credits).toBe(19);
    const replay = replayEvents(before, state.eventLog.slice(start));
    expect(replay.ok).toBe(true);
    if (replay.ok)
      expect(hashGameState(replay.state)).toBe(hashGameState(state));
  },
);

it("subtracts both mandatory disposition and the event source from a bounded burst", () => {
  let state = fixture();
  const before = structuredClone(state),
    hand = state.runner.grip.length,
    start = state.eventLog.length;
  const action = getLegalActions(state, "runner").find(
    (a) => a.type === "play_event" && a.payload?.drawCardsAmount !== undefined,
  )!;
  expect(action).toBeDefined();
  expect(project(state, action)).toMatchObject({
    cardsDrawn: 1,
    cardsConsumed: 1,
    netHandDelta: -1,
  });
  state = act(state, action);
  state = act(state, getLegalActions(state, "runner")[0]!);
  expect(state.runner.grip.length - hand).toBe(-1);
  const replay = replayEvents(before, state.eventLog.slice(start));
  expect(replay.ok).toBe(true);
  if (replay.ok) expect(hashGameState(replay.state)).toBe(hashGameState(state));
});

function soleAnswerDraw(withCrash: boolean) {
  const codecracker = "onr_v1_014_codecracker";
  const activeDeck = {
    ...deck,
    cards: [
      ...deck.cards.filter((card) => card.id !== codecracker),
      { id: codecracker, quantity: 1 },
    ],
  };
  const state = fixture(1, withCrash, activeDeck);
  const answer = Object.values(state.cardInstances).find(
    (card) => card.definitionId === codecracker,
  )!;
  removeEverywhere(state, answer.instanceId);
  for (const id of state.runner.stack.splice(0)) {
    state.runner.heap.push(id);
    state.cardInstances[id]!.zone = { side: "runner", zone: "heap" };
  }
  state.runner.stack.push(answer.instanceId);
  answer.zone = { side: "runner", zone: "stack" };
  answer.faceup = false;
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: "native-sole-answer-draw",
      side: "runner",
      cards: activeDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
  const action = input.legalActions.find(
    (a) => a.type === "draw_card" && a.source === "basic_action",
  )!;
  const candidates = buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: "runner",
    stateVersion: state.stateVersion,
  });
  const rotation = assessRunnerHandRotation(input, []);
  expect(rotation.status).toBe("capacity_available");
  expect(action.payload?.projectedNetHandDelta).toBe(withCrash ? 0 : 1);
  return { input, action, candidates, rotation };
}

it.each([true, false])(
  "admits a native basic draw for option development only if it retains a card (replacement %s)",
  (withCrash) => {
    const { input, action, candidates, rotation } = soleAnswerDraw(withCrash);
    const developments = runnerGenericDrawDevelopmentSignals(
      input,
      candidates,
      {} as RunnerStrategicIntentProfile,
      [],
      rotation,
      { admissible: false, evidenceCodes: [] },
      buildRunnerEconomyPosture({ input }),
    );
    expect(developments.flatMap((d) => d.actionIds)).toEqual(
      withCrash ? [] : [action.actionId],
    );
  },
);

it.each([true, false])(
  "admits a native basic draw for an actual stack coverage answer only if it retains a card (replacement %s)",
  (withCrash) => {
    const { input, action, candidates, rotation } = soleAnswerDraw(withCrash);
    expect(input.ownDeckCapabilities).toBeDefined();
    const support = coverageSupportActionIds(
      input,
      candidates,
      input.ownDeckCapabilities!,
      "breaker_code_gate",
      { handRotation: rotation },
    );
    expect(support.drawForAnswerActionIds).toEqual(
      withCrash ? [] : [action.actionId],
    );
  },
);

it("counts actual replaced draws for visible taxes while keeping an unrezzed source private", () => {
  let state = fixture(2);
  const city = putCorpRootInRemote(state, "onr_v1_313_city-surveillance");
  expect(saloonAction(state).payload?.visibleDrawTaxSourceCount).toBe(0);
  state.cardInstances[city]!.rezzed = true;
  state.cardInstances[city]!.faceup = true;
  const action = saloonAction(state),
    before = structuredClone(state),
    hand = state.runner.grip.length,
    start = state.eventLog.length;
  expect(action.payload).toMatchObject({
    projectedGrossDrawCount: 2,
    projectedPostDrawDispositionCount: 1,
    projectedNetHandDelta: 1,
    visibleDrawTaxSourceCount: 1,
  });
  expect(JSON.stringify(action.payload)).not.toContain(city);
  state = act(state, action);
  for (let n = 0; n < 2; n += 1) {
    expect(state.pendingChoice?.presentationKey).toBe("runner_draw_tax");
    state = act(state, getLegalActions(state, "runner")[0]!, "pay_credit");
  }
  expect(state.pendingChoice?.presentationKey).toBe("crash_draw");
  state = act(state, getLegalActions(state, "runner")[0]!);
  expect(state.runner.grip.length - hand).toBe(1);
  expect(state.runner.credits).toBe(17);
  expect(state.runner.tags).toBe(0);
  const replay = replayEvents(before, state.eventLog.slice(start));
  expect(replay.ok).toBe(true);
  if (replay.ok) expect(hashGameState(replay.state)).toBe(hashGameState(state));
});

it("uses the existing Defense owner and real heap recovery when the last draw cannot grow the hand", () => {
  const state = fixture();
  expect(state.runnerTurnFlags).toBeDefined();
  state.runnerTurnFlags!.runLockActionsPending = 6;
  expect(
    getLegalActions(state, "runner").some((a) => a.type === "start_run"),
  ).toBe(false);
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: "native-bounded-draw",
      side: "runner",
      cards: deck.cards.map((c) => ({ cardId: c.id, quantity: c.quantity })),
    },
  });
  const d = chooseAiAction(input),
    pf = d.decisionDebug!.planFirstDecision!;
  expect(d.fallbackUsed).toBe(false);
  expect(d.timeoutUsed).not.toBe(true);
  expect(d.actionId).toContain("junkyard-bbs");
  expect(pf.selectedPlan?.moduleId).toBe("runner.defense_and_recovery");
  const action = input.legalActions.find((a) => a.actionId === d.actionId)!;
  expect(action.expiresAtStateVersion).toBe(state.stateVersion);
  expect(act(state, action).runner.grip.length).toBe(2);
});
