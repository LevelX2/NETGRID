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
import { describe, expect, it, vi } from "vitest";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseCorpAction } from "../index";
import { buildAiDecisionInput } from "./ai-decision-input";
import { withDecisionLocalCorpPunishRouteQuotes } from "./corp-punish-route-quote-input";

const CLOSED_ACCOUNTS = "onr_v1_285_closed-accounts";
const CORP_DECK = withCards(
  DEMO_DECKS.demo_corp_001,
  "closed-accounts-quote-corp",
  [CLOSED_ACCOUNTS],
);

describe("Closed Accounts decision-local real-Engine punish quote", () => {
  it("transports the exact current LegalAction, fixed cost and visible lose-all source binding", () => {
    const state = closedAccountsState("closed-accounts-execute", 1);
    const input = decisionInput(state);
    const currentAction = closedAccountsAction(input.legalActions);

    const quoted = withDecisionLocalCorpPunishRouteQuotes(input, (request) =>
      quoteCorpPunishRoute(state, request),
    );
    const route = quoted.playerView.corpPunishRouteQuoteSet?.routes.find(
      (candidate) =>
        candidate.steps[0]?.sourceCardDefinitionId === CLOSED_ACCOUNTS,
    );

    expect(currentAction).toMatchObject({
      side: "corp",
      type: "play_operation",
      costs: [{ clicks: 1, credits: 1 }],
    });
    expect(route).toMatchObject({
      complete: true,
      totalClicks: 1,
      totalActionCredits: 1,
      tagTrigger: {
        kind: "existing_tag",
        status: "satisfied",
        currentRunnerTags: 1,
      },
      responsePaymentEnvelope: {
        corpCreditsAvailable: 1,
        runnerCreditsVisible: 8,
        totalCorpCredits: { minimum: 1, maximum: 1 },
      },
      guarantee: "guaranteed",
      responseKnowledge: "public_exact",
      steps: [
        {
          kind: "other_punish",
          sourceCardDefinitionId: CLOSED_ACCOUNTS,
          sourceCapabilityId: "ability:on_play:0",
          currentLegalAction: {
            actionId: currentAction.actionId,
            source: currentAction.source,
            payload: { cardId: currentAction.payload?.cardId },
          },
        },
      ],
    });

    const decision = chooseCorpAction(input, {
      quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
      persistTacticalPlanMemory: false,
    });
    expect(decision.actionId).toBe(currentAction.actionId);
    expect(decision.fallbackUsed).toBe(false);
  });

  it("transports an exact one-credit funding quote without fabricating a current LegalAction", () => {
    const state = closedAccountsState("closed-accounts-fund", 0);
    const input = decisionInput(state);

    expect(
      input.legalActions.some(
        (action) =>
          action.type === "play_operation" &&
          action.payload?.cardId === closedAccountsCardId(input),
      ),
    ).toBe(false);

    const quoted = withDecisionLocalCorpPunishRouteQuotes(input, (request) =>
      quoteCorpPunishRoute(state, request),
    );
    const route = quoted.playerView.corpPunishRouteQuoteSet?.routes.find(
      (candidate) =>
        candidate.steps[0]?.sourceCardDefinitionId === CLOSED_ACCOUNTS,
    );

    expect(route).toMatchObject({
      complete: true,
      totalClicks: 1,
      totalActionCredits: 1,
      responsePaymentEnvelope: {
        corpCreditsAvailable: 0,
        totalCorpCredits: { minimum: 1, maximum: 1 },
      },
      steps: [
        {
          sourceCardDefinitionId: CLOSED_ACCOUNTS,
          credits: 1,
        },
      ],
    });
    expect(route?.steps[0]).not.toHaveProperty("currentLegalAction");

    const fundingAction = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    if (!fundingAction) throw new Error("Missing basic credit funding action.");
    const decision = chooseCorpAction(input, {
      quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
      persistTacticalPlanMemory: false,
    });
    expect(decision.actionId).toBe(fundingAction.actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.evidence).toContain(
      "plan_priority_delegated_from:plan:corp.punish_campaign:corp-punish%3Aengine-certified-payoff",
    );
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "|module:corp.punish_campaign|phase:fund",
    );
  });

  it("emits no Closed Accounts route when the visible tag prerequisite is absent", () => {
    const state = closedAccountsState("closed-accounts-untagged", 1);
    state.runner.tags = 0;
    const input = decisionInput(state);
    const callback = vi.fn((request) => quoteCorpPunishRoute(state, request));

    const quoted = withDecisionLocalCorpPunishRouteQuotes(input, callback);

    expect(callback).not.toHaveBeenCalled();
    expect(quoted.playerView.corpPunishRouteQuoteSet).toBeUndefined();
  });
});

function closedAccountsState(seed: string, corpCredits: number): GameState {
  const setupState = createGameAfterSetup({
    seed,
    agendaPointsToWin: 7,
    corpDeck: CORP_DECK,
  });
  const state = apply(
    setupState,
    getLegalActions(setupState, "corp").find(
      (action) => action.type === "mandatory_draw",
    ),
  );
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq(CLOSED_ACCOUNTS)
    .withCorpCredits(corpCredits)
    .withRunnerCredits(8)
    .withRunnerTags(1);
  return state;
}

function decisionInput(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    decisionId: `closed-accounts-quote:${state.matchId}:${state.stateVersion}`,
    profileId: "closed-accounts-quote-corp",
    ownDeckSnapshot: snapshot(CORP_DECK),
  });
}

function closedAccountsAction(actions: readonly LegalAction[]): LegalAction {
  const action = actions.find(
    (candidate) =>
      candidate.type === "play_operation" &&
      candidate.payload?.cardId !== undefined &&
      candidate.source === candidate.payload.cardId,
  );
  if (!action) throw new Error("Missing current Closed Accounts LegalAction.");
  return action;
}

function closedAccountsCardId(
  input: ReturnType<typeof decisionInput>,
): string | undefined {
  return input.playerView.own.gripOrHq.find(
    (card) => card.definitionId === CLOSED_ACCOUNTS,
  )?.instanceId;
}

function apply(state: GameState, action: LegalAction | undefined): GameState {
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
