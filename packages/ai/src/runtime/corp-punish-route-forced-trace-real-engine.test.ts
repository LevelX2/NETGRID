import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  quoteCorpPunishRoute,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type DeckDefinition,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { expect, it } from "vitest";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseCorpAction } from "../index";
import { buildAiDecisionInput } from "./ai-decision-input";
import { withDecisionLocalCorpPunishRouteQuotes } from "./corp-punish-route-quote-input";

const CHANCE = "onr_v1_284_chance-observation";
const URBAN = "onr_v1_307_urban-renewal";
const CORP_DECK = withCards(DEMO_DECKS.demo_corp_001, "forced-trace-punish", [
  CHANCE,
  URBAN,
]);

it("executes the publicly guaranteed zero-bid trace kill through the existing punish campaign", () => {
  const state = applyMandatoryDraw(
    createGameAfterSetup({ seed: "forced-trace-punish", corpDeck: CORP_DECK }),
  );
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq(CHANCE)
    .withCorpCardInHq(URBAN)
    .withCorpCredits(8)
    .withRunnerTags(0)
    .withRunnerGripSize(4);
  state.corp.clicks = 2;
  state.runner.credits = 12;
  state.runnerTurnFlags!.runAttemptsLastTurn = 1;
  const crash = "visible-forced-trace-source";
  state.runner.rig.resources.push(crash);
  state.cardInstances[crash] = {
    instanceId: crash,
    definitionId: "onr_classic_044_crash-space",
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  const input = decisionInput(state);
  const action = playOperation(input.legalActions, input, CHANCE);
  const quoted = withDecisionLocalCorpPunishRouteQuotes(input, (request) =>
    quoteCorpPunishRoute(state, request),
  );
  expect(quoted.playerView.corpPunishRouteQuoteSet?.routes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        complete: true,
        totalActionCredits: 8,
        responsePaymentEnvelope: expect.objectContaining({
          totalCorpCredits: { minimum: 8, maximum: 8 },
        }),
      }),
    ]),
  );
  const decision = chooseCorpAction(quoted, {
    quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
    persistTacticalPlanMemory: false,
  });
  expect(decision.actionId).toBe(action.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId:
      "plan:corp.punish_campaign:corp-punish%3Aengine-certified-payoff",
    selectedStep: {
      parentInstanceId:
        "plan:corp.punish_campaign:corp-punish%3Aengine-certified-payoff",
    },
  });
  expect(JSON.stringify(decision.decisionDebug)).toContain(
    "module:corp.execute_punish_sequence",
  );
});
function decisionInput(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    decisionId: `tag-amplifier-quote:${state.matchId}:${state.stateVersion}`,
    profileId: "forced-trace-punish",
    ownDeckSnapshot: snapshot(CORP_DECK),
  });
}

function routeFor(
  input: ReturnType<typeof decisionInput>,
  definitionId: string,
) {
  return input.playerView.corpPunishRouteQuoteSet?.routes.find(
    (route) => route.steps[0]?.sourceCardDefinitionId === definitionId,
  );
}

function playOperation(
  actions: readonly LegalAction[],
  input: ReturnType<typeof decisionInput>,
  definitionId: string,
): LegalAction {
  const instanceId = input.playerView.own.gripOrHq.find(
    (card) => card.definitionId === definitionId,
  )?.instanceId;
  const action = actions.find(
    (candidate) =>
      candidate.type === "play_operation" && candidate.source === instanceId,
  );
  if (!action) throw new Error(`Missing ${definitionId} LegalAction.`);
  return action;
}

function applyMandatoryDraw(state: GameState): GameState {
  const action = getLegalActions(state, "corp").find(
    (candidate) => candidate.type === "mandatory_draw",
  );
  if (!action) throw new Error("Missing mandatory Corp draw action.");
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `corp:${state.stateVersion}:${action.actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function withCards(
  base: DeckDefinition,
  id: string,
  additions: readonly string[],
): DeckDefinition {
  return {
    ...base,
    id,
    name: id,
    cards: [
      ...base.cards,
      ...additions.map((cardId) => ({ id: cardId, quantity: 1 })),
    ],
  };
}

function snapshot(deckDefinition: DeckDefinition): AiDeckStrategyDeckSnapshot {
  return {
    deckSnapshotId: `${deckDefinition.id}-snapshot`,
    side: deckDefinition.side,
    cards: deckDefinition.cards.map((card) => ({
      cardId: card.id,
      quantity: card.quantity,
    })),
  };
}
