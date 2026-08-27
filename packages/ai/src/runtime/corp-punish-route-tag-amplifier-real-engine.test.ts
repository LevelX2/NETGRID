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
import { describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseCorpAction } from "../index";
import { buildAiDecisionInput } from "./ai-decision-input";
import { withDecisionLocalCorpPunishRouteQuotes } from "./corp-punish-route-quote-input";

const DATAPOOL = "onr_v1_287_datapool-by-zetatech";
const VOUCHER = "onr_v1_293_netwatch-credit-voucher";
const SCORCHED_EARTH = "onr_v1_302_scorched-earth";
const CORP_DECK = withCards(
  DEMO_DECKS.demo_corp_001,
  "tag-amplifier-quote-corp",
  [DATAPOOL, VOUCHER, SCORCHED_EARTH],
);

describe("direct additional-tag punish routes", () => {
  it("binds Datapool as an executable additional-tag route under the existing punish owner", () => {
    const state = tagAmplifierState("datapool-additional-tags", DATAPOOL, 1);
    const input = decisionInput(state);
    const action = playOperation(input.legalActions, input, DATAPOOL);
    const quoted = withDecisionLocalCorpPunishRouteQuotes(input, (request) =>
      quoteCorpPunishRoute(state, request),
    );
    const route = routeFor(quoted, DATAPOOL);

    expect(route).toMatchObject({
      complete: true,
      totalClicks: 1,
      totalActionCredits: 1,
      tagTrigger: {
        kind: "existing_tag",
        status: "satisfied",
        currentRunnerTags: 1,
      },
      tagOutcomeEnvelope: {
        currentRunnerTags: 1,
        addedTags: { minimum: 2, maximum: 2 },
        projectedRunnerTags: { minimum: 3, maximum: 3 },
      },
      steps: [
        {
          kind: "tag",
          sourceCardDefinitionId: DATAPOOL,
          currentLegalAction: { actionId: action.actionId },
        },
      ],
    });

    const decision = chooseCorpAction(quoted, {
      quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
      persistTacticalPlanMemory: false,
    });
    expect(decision.actionId).toBe(action.actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "module:corp.execute_punish_sequence",
    );
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId:
        "plan:corp.punish_campaign:corp-punish%3Aengine-certified-payoff",
      selectedStep: {
        parentInstanceId:
          "plan:corp.punish_campaign:corp-punish%3Aengine-certified-payoff",
      },
    });
  });

  it("quotes and chooses the Voucher's combined tag-and-credit effect as a punish route", () => {
    const state = tagAmplifierState("voucher-tag-credit", VOUCHER, 0);
    const input = decisionInput(state);
    const action = playOperation(input.legalActions, input, VOUCHER);
    const candidate = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: Object.fromEntries(
        input.playerView.own.gripOrHq.flatMap((card) =>
          card.definitionId ? [[card.instanceId, card.definitionId]] : [],
        ),
      ),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    }).find((entry) => entry.actionId === action.actionId);
    expect(candidate).toMatchObject({
      sourceDefinitionId: VOUCHER,
      semanticActionType: "economy.gain_credit",
      economyProjection: {
        kind: "immediate_liquid",
        netLiquidCreditGain: 1,
      },
    });
    const quoted = withDecisionLocalCorpPunishRouteQuotes(input, (request) =>
      quoteCorpPunishRoute(state, request),
    );
    const route = routeFor(quoted, VOUCHER);

    expect(route).toMatchObject({
      complete: true,
      totalClicks: 1,
      totalActionCredits: 0,
      tagOutcomeEnvelope: {
        currentRunnerTags: 1,
        addedTags: { minimum: 1, maximum: 1 },
        projectedRunnerTags: { minimum: 2, maximum: 2 },
      },
      steps: [
        {
          kind: "tag",
          sourceCardDefinitionId: VOUCHER,
          currentLegalAction: { actionId: action.actionId },
        },
      ],
    });
    const decision = chooseCorpAction(quoted, {
      quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
      persistTacticalPlanMemory: false,
    });
    expect(decision.actionId).toBe(action.actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "module:corp.execute_punish_sequence",
    );
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId:
        "plan:corp.punish_campaign:corp-punish%3Aengine-certified-payoff",
      selectedStep: {
        parentInstanceId:
          "plan:corp.punish_campaign:corp-punish%3Aengine-certified-payoff",
      },
    });
    if (!decision.actionId) throw new Error("Missing selected Voucher action.");

    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: decision.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.runner.tags).toBe(2);
    expect(result.state.corp.credits).toBe(1);
  });

  it("keeps an immediately terminal damage route ahead of additional tags", () => {
    const state = tagAmplifierState("terminal-damage-before-tags", VOUCHER, 3);
    RealEngineFixtureBuilder.forState(state).withRunnerGripSize(3);
    const input = decisionInput(state);
    const scorchedEarth = playOperation(
      input.legalActions,
      input,
      SCORCHED_EARTH,
    );

    const decision = chooseCorpAction(input, {
      quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe(scorchedEarth.actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "module:corp.execute_punish_sequence",
    );
    expect(decision.decisionDebug?.planFirstDecision?.priority).toMatchObject({
      effectiveClass: "P1",
    });
  });
});

function tagAmplifierState(
  seed: string,
  amplifierDefinitionId: string,
  corpCredits: number,
): GameState {
  const setupState = createGameAfterSetup({
    seed,
    agendaPointsToWin: 7,
    corpDeck: CORP_DECK,
  });
  const state = applyMandatoryDraw(setupState);
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq(amplifierDefinitionId)
    .withCorpCardInHq(SCORCHED_EARTH)
    .withCorpCredits(corpCredits)
    .withRunnerTags(1)
    .withRunnerGripSize(5);
  return state;
}

function decisionInput(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    decisionId: `tag-amplifier-quote:${state.matchId}:${state.stateVersion}`,
    profileId: "tag-amplifier-quote-corp",
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
