import { beforeEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  quoteCorpPunishRoute,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type GameState,
  type Side,
  type DeckDefinition,
} from "@netgrid/shared";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseAiAction, chooseCorpAction } from "../index";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { boundCorpPunishTraceChoices } from "../corp/punish/punish-trace-binding";
import { buildAiDecisionInput } from "./ai-decision-input";
import { withDecisionLocalCorpPunishRouteQuotes } from "../corp/punish/punish-route-quote-input";

const MANHUNT = 108;
const MARKED = 63;
const BROKER = 366;
const corpDeck: DeckDefinition = {
  ...DEMO_DECKS.demo_corp_001,
  id: "hidden-node-followup",
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards,
    { id: MANHUNT, quantity: 1 },
    { id: MARKED, quantity: 6 },
  ],
};
const runnerDeck: DeckDefinition = {
  ...DEMO_DECKS.demo_runner_001,
  id: "hidden-node-runner",
  cards: [...DEMO_DECKS.demo_runner_001.cards, { id: BROKER, quantity: 1 }],
};
beforeEach(() => resetResidentPlanPortfolioMemory());
function act(
  state: GameState,
  side: Side,
  actionId: string,
  selectedChoices?: Record<string, unknown>,
) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}
function fixture() {
  let state = createGameAfterSetup({
    seed: "hidden-node-followup",
    corpDeck,
    runnerDeck,
    traceRulesProfile: "modern_open",
  });
  state = act(state, "corp", "ce");
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCredits(12)
    .withRunnerCredits(1);
  state.turnSerial = 12;
  return state;
}
function input(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: corpDeck.id,
      side: "corp",
      cards: corpDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}
function choose(state: GameState) {
  return chooseCorpAction(input(state), {
    quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
  });
}

it("keeps an all-agenda overflow concealed through a Score-owned last-click install", () => {
  const state = fixture();
  const ids = Object.values(state.cardInstances)
    .filter((card) => card.definitionId === MARKED)
    .map((card) => card.instanceId);
  for (const id of ids) {
    state.corp.rd = state.corp.rd.filter((value) => value !== id);
    state.corp.hq.push(id);
    state.cardInstances[id]!.zone = { side: "corp", zone: "hq" };
  }
  state.corp.clicks = 1;
  const before = hashState(state);
  const decision = choose(state);
  const action = getLegalActions(state, "corp").find(
    (action) => action.actionId === decision.actionId,
  )!;
  expect(action).toMatchObject({
    type: "install_card",
    payload: { placement: "root", serverId: "new_remote" },
  });
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    selectedPlan: { moduleId: "corp.score_agenda" },
    selectedStep: { stepId: expect.stringContaining(":install_agenda") },
  });
  expect(JSON.stringify(decision.decisionDebug)).toContain(
    "corp_forced_agenda_discard_score_attempt",
  );
  expect(hashState(state)).toBe(before);
  const after = act(state, "corp", decision.actionId!);
  expect(after.corp.hq).toHaveLength(5);
  expect(after.corp.clicks).toBe(0);
  const ended = act(after, "corp", "c9");
  expect(ended.activeSide).toBe("runner");
  expect(ended.pendingChoice).toBeUndefined();
  expect(hashState(act(state, "corp", decision.actionId!))).toBe(
    hashState(after),
  );
});

it("does not use the forced-discard exception for an ordinary hand", () => {
  const state = fixture();
  RealEngineFixtureBuilder.forState(state).withCorpCardInHq(MARKED);
  state.corp.clicks = 1;
  expect(JSON.stringify(choose(state).decisionDebug)).not.toContain(
    "corp_forced_agenda_discard_score_attempt",
  );
});

it("prices Manhunt, binds its zero-credit bid and then trashes a visible resource", () => {
  let state = fixture();
  RealEngineFixtureBuilder.forState(state)
    .withCorpCardInHq(MANHUNT)
    .withRunnerResourceInstalled(BROKER, { bit: 9 });
  state.corp.credits = 6;
  state.corp.clicks = 2;
  state.runnerTurnFlags!.runAttemptsLastTurn = 1;
  const quoted = withDecisionLocalCorpPunishRouteQuotes(
    input(state),
    (request) => quoteCorpPunishRoute(state, request),
  );
  expect(quoted.playerView.corpPunishRouteQuoteSet?.routes[0]).toMatchObject({
    tagOutcomeEnvelope: { addedTags: { minimum: 5, maximum: 6 } },
    responsePaymentEnvelope: { totalCorpCredits: { minimum: 4, maximum: 4 } },
  });
  const head = choose(state);
  expect(
    getLegalActions(state, "corp").find((a) => a.actionId === head.actionId)
      ?.type,
  ).toBe("play_operation");
  const origin = head.decisionDebug!.planFirstDecision!;
  const portfolio = residentPlanPortfolioSnapshot(input(state));
  state = act(state, "corp", head.actionId!);
  const traceInput = input(state);
  const traceAction = traceInput.legalActions.find(
    (action) => action.type === "resolve_choice",
  )!;
  const traceOrigin = {
    ...origin.executionOrigin!,
    stateVersion: traceInput.playerView.stateVersion,
    timingPoint: traceInput.playerView.timingPoint,
    windowKind: "trace" as const,
    windowId: String(traceInput.playerView.trace!.traceId),
  };
  for (const invalid of ["source", "version", "option"] as const) {
    const altered = structuredClone(traceInput);
    const action = structuredClone(traceAction);
    if (invalid === "source")
      altered.playerView.trace!.sourceCardInstanceId = "wrong-source";
    if (invalid === "version") altered.playerView.stateVersion++;
    if (invalid === "option")
      action.choiceRequirements![0]!.optionIds = ["bid_1"];
    expect(() =>
      boundCorpPunishTraceChoices(altered, action, traceOrigin, portfolio),
    ).toThrow();
  }
  const bid = choose(state);
  expect(bid.selectedChoices).toEqual({
    choiceId: state.pendingChoice!.choiceId,
    selectedOptionIds: ["bid_0"],
  });
  expect(bid.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    origin.rootPlanInstanceId,
  );
  expect(bid.decisionDebug?.planFirstDecision?.leafExecutorInstanceId).toBe(
    origin.leafExecutorInstanceId,
  );
  state = act(state, "corp", bid.actionId!, bid.selectedChoices);
  const runnerChoice = state.pendingChoice!;
  state = act(
    state,
    "runner",
    getLegalActions(state, "runner").find((a) => a.type === "resolve_choice")!
      .actionId,
    { choiceId: runnerChoice.choiceId, selectedOptionIds: ["bid_1"] },
  );
  expect(state.runner.tags).toBe(5);
  expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
    traceValue: 6,
    runnerStrength: 1,
    tagsAdded: 5,
  });
  const payoff = choose(state);
  const payoffAction = getLegalActions(state, "corp").find(
    (a) => a.actionId === payoff.actionId,
  )!;
  expect(payoffAction.type).toBe("trash_resource");
  state = act(state, "corp", payoff.actionId!, payoff.selectedChoices);
  expect(state.runner.rig.resources).toHaveLength(0);
});

// Pairing 899 R1 G15: a partial avoid spends the source of full meat prevention.
it.each([
  { sourceId: 399, runnerCredits: 0, avoid: false },
  { sourceId: 399, runnerCredits: 5, avoid: true },
  { sourceId: 373, runnerCredits: 0, avoid: true },
])("binds tag avoidance to the actual protection left by source $sourceId with $runnerCredits credits", ({ sourceId, runnerCredits, avoid }) => {
  let state = createGameAfterSetup({
    seed: `tag-avoidance-meat-prevention-${sourceId}-${runnerCredits}`,
    traceRulesProfile: "modern_open",
    corpDeck: {
      ...corpDeck,
      cards: [...corpDeck.cards, { id: 514, quantity: 1 }],
    },
    runnerDeck: {
      ...runnerDeck,
      cards: [...runnerDeck.cards, { id: sourceId, quantity: 1 }],
    },
  });
  state = act(state, "corp", "ce");
  RealEngineFixtureBuilder.forState(state)
    .withCorpCardInHq(MANHUNT)
    .withCorpCardInHq(514)
    .withRunnerResourceInstalled(sourceId)
    .withRunnerGripSize(3)
    .withRunnerCredits(runnerCredits)
    .withCorpCredits(8);
  state.runnerTurnFlags!.runAttemptsLastTurn = 1;
  state.corp.clicks = 2;
  const play = (cardId: number) => {
    const action = getLegalActions(state, "corp").find(
      (candidate) =>
        candidate.type === "play_operation" &&
        state.cardInstances[candidate.source ?? ""]?.definitionId === cardId,
    );
    if (!action) throw new Error(`Missing legal operation ${cardId}`);
    state = act(state, "corp", action.actionId);
  };
  const resolve = (side: Side, optionId: string) => {
    const action = getLegalActions(state, side).find((a) => a.type === "resolve_choice")!;
    state = act(state, side, action.actionId, {
      choiceId: state.pendingChoice!.choiceId,
      selectedOptionIds: [optionId],
    });
  };
  play(MANHUNT);
  resolve("corp", "bid_0");
  resolve("runner", `bid_${runnerCredits}`);
  const runner = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: runnerDeck.id,
      side: "runner",
      cards: [...runnerDeck.cards, { id: sourceId, quantity: 1 }].map((card) => ({
        cardId: card.id,
        quantity: card.quantity,
      })),
    },
  });
  const choice = runner.playerView.pendingChoice!;
  const avoidance = choice.options.find((option) => option.id !== "pass")!;
  expect(avoidance.metadata?.tagAvoidanceSpendsMeatProtectionWhileTagged).toBe(
    avoid ? undefined : true,
  );
  expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
  expect(JSON.stringify(getPlayerView(state, "corp").publicEvents)).not.toContain(
    "tagAvoidanceSpendsMeatProtectionWhileTagged",
  );
  const before = hashState(state);
  const decision = chooseAiAction(runner);
  expect(decision.selectedChoices).toEqual({
    choiceId: choice.choiceId,
    selectedOptionIds: [avoid ? avoidance.id : "pass"],
  });
  expect(
    getLegalActions(state, "runner").find((a) => a.actionId === decision.actionId),
  ).toMatchObject({
    type: "resolve_choice",
    expiresAtStateVersion: state.stateVersion,
    choiceRequirements: [expect.objectContaining({ choiceId: choice.choiceId })],
  });
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "rules",
    leafExecutorInstanceId: "rules.window_resolution",
  });
  expect(decision.fallbackUsed).toBeFalsy();
  expect(hashState(state)).toBe(before);
  state = act(state, "runner", decision.actionId!, decision.selectedChoices);
  if (!avoid) {
    expect(state.runner.tags).toBe(6);
    play(514);
    const protection = state.pendingChoice!.options.find((option) => option.id !== "pass")!;
    resolve("runner", protection.id);
    expect(state.runner.grip).toHaveLength(3);
    expect(state.winner).toBeNull();
  } else {
    expect(state.runner.tags).toBe(runnerCredits === 5 ? 0 : 5);
  }
});
