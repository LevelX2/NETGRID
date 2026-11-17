import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  quoteCorpPunishRoute,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type CardDefinitionId,
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
import { withDecisionLocalCorpPunishRouteQuotes } from "../corp/punish/punish-route-quote-input";

const DATAPOOL = 499;
const VOUCHER = 505;
const SCORCHED_EARTH = 514;
const URBAN_RENEWAL = 519;
const WILSON = 399;
const CORP_DECK = withCards(
  DEMO_DECKS.demo_corp_001,
  "tag-amplifier-quote-corp",
  [DATAPOOL, VOUCHER, SCORCHED_EARTH],
);
const DAMAGE_DECK = withCards(CORP_DECK, "sacrifice-quote-corp", [
  URBAN_RENEWAL,
]);

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

  it.each([
    { grip: 3, credits: 9, terminal: true },
    { grip: 4, credits: 9, terminal: false },
    { grip: 3, credits: 8, terminal: false },
  ])(
    "uses the Engine minimum after one public sacrifice with $grip Grip and $credits credits",
    ({ grip, credits, terminal }) => {
      let state = applyMandatoryDraw(
        createGameAfterSetup({
          seed: "sacrifice-quote-campaign",
          agendaPointsToWin: 7,
          corpDeck: DAMAGE_DECK,
          runnerDeck: withCards(
            DEMO_DECKS.demo_runner_001,
            "sacrifice-quote-runner",
            [WILSON],
          ),
        }),
      );
      RealEngineFixtureBuilder.forState(state)
        .withCorpHqSize(0)
        .withCorpCardInHq(SCORCHED_EARTH)
        .withCorpCardInHq(URBAN_RENEWAL)
        .withCorpCredits(credits)
        .withRunnerTags(1)
        .withRunnerResourceInstalled(WILSON)
        .withRunnerGripSize(grip);
      state.corp.clicks = 2;
      const input = decisionInput(state, DAMAGE_DECK);
      const quoted = withDecisionLocalCorpPunishRouteQuotes(input, (request) =>
        quoteCorpPunishRoute(state, request),
      );
      expect(
        quoted.playerView.corpPunishRouteQuoteSet?.routes.filter(
          (route) => route.complete && route.steps.length === 2,
        ),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            totalActionCredits: 9,
            damageEnvelope: expect.objectContaining({
              effectiveDamage: { minimum: 4, maximum: 9 },
              visiblePrevention: expect.objectContaining({
                maximumPreventableDamage: 5,
              }),
            }),
          }),
        ]),
      );
      const decision = chooseCorpAction(quoted, {
        persistTacticalPlanMemory: false,
      });
      expect(decision.fallbackUsed).toBe(false);
      if (!terminal) {
        expect(
          decision.decisionDebug?.planFirstDecision?.priority?.effectiveClass,
        ).not.toBe("P1");
        return;
      }
      expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId:
          "plan:corp.punish_campaign:corp-punish%3Aengine-certified-payoff",
        priority: { effectiveClass: "P1" },
        route: {
          actionId: decision.actionId,
          stateVersion: state.stateVersion,
        },
      });
      const first = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: decision.actionId!,
        clientKnownStateVersion: state.stateVersion,
      });
      if (!first.ok) throw new Error(first.error.message);
      const pending = first.state.pendingChoice!;
      const prevent = pending.options.find(
        (option) => option.metadata?.optionKind === "prevent_damage",
      )!;
      const choice = getLegalActions(first.state, "runner").find(
        (action) => action.type === "resolve_choice",
      )!;
      const prevented = applyAction(first.state, {
        matchId: state.matchId,
        side: "runner",
        actionId: choice.actionId,
        clientKnownStateVersion: first.state.stateVersion,
        selectedChoices: {
          choiceId: pending.choiceId,
          selectedOptionIds: [prevent.id],
        },
      });
      if (!prevented.ok) throw new Error(prevented.error.message);
      state = prevented.state;
      expect(state.runner.rig.resources).toEqual([]);
      const followup = chooseCorpAction(decisionInput(state, DAMAGE_DECK), {
        quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
        persistTacticalPlanMemory: false,
      });
      expect(followup.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId:
          "plan:corp.punish_campaign:corp-punish%3Aengine-certified-payoff",
        priority: { effectiveClass: "P1" },
      });
      const resolved = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: followup.actionId!,
        clientKnownStateVersion: state.stateVersion,
      });
      if (!resolved.ok) throw new Error(resolved.error.message);
      expect(resolved.state.winner).toBe("corp");
    },
  );
});

function tagAmplifierState(
  seed: string,
  amplifierDefinitionId: number,
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

function decisionInput(state: GameState, deck = CORP_DECK) {
  return buildAiDecisionInput(state, "corp", {
    decisionId: `tag-amplifier-quote:${state.matchId}:${state.stateVersion}`,
    profileId: "tag-amplifier-quote-corp",
    ownDeckSnapshot: snapshot(deck),
  });
}

function routeFor(
  input: ReturnType<typeof decisionInput>,
  definitionId: number,
) {
  return input.playerView.corpPunishRouteQuoteSet?.routes.find(
    (route) => route.steps[0]?.sourceCardDefinitionId === definitionId,
  );
}

function playOperation(
  actions: readonly LegalAction[],
  input: ReturnType<typeof decisionInput>,
  definitionId: number,
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
  additions: readonly CardDefinitionId[],
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
