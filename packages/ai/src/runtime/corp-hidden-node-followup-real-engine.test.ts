import { beforeEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
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
import { chooseCorpAction } from "../index";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { boundCorpPunishTraceChoices } from "../plans/corp-punish-trace-binding";
import { buildAiDecisionInput } from "./ai-decision-input";
import { withDecisionLocalCorpPunishRouteQuotes } from "./corp-punish-route-quote-input";

const MANHUNT = "onr_proteus_050_manhunt";
const MARKED = "onr_proteus_005_marked-accounts";
const BROKER = "onr_v1_154_broker";
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
  state = act(state, "corp", "corp.mandatory_draw");
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
  const ended = act(after, "corp", "corp.end_turn");
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
    tagOutcomeEnvelope: { addedTags: { minimum: 6, maximum: 6 } },
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
  for (const invalid of ["source", "version", "option"] as const) {
    const altered = structuredClone(traceInput);
    const action = structuredClone(traceAction);
    if (invalid === "source")
      altered.playerView.trace!.sourceCardInstanceId = "wrong-source";
    if (invalid === "version") altered.playerView.stateVersion++;
    if (invalid === "option")
      action.choiceRequirements![0]!.optionIds = ["bid_1"];
    expect(() =>
      boundCorpPunishTraceChoices(
        altered,
        action,
        origin.executionOrigin!,
        portfolio,
      ),
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
  expect(state.runner.tags).toBe(6);
  const payoff = choose(state);
  const payoffAction = getLegalActions(state, "corp").find(
    (a) => a.actionId === payoff.actionId,
  )!;
  expect(payoffAction.type).toBe("trash_resource");
  state = act(state, "corp", payoff.actionId!, payoff.selectedChoices);
  expect(state.runner.rig.resources).toHaveLength(0);
});
