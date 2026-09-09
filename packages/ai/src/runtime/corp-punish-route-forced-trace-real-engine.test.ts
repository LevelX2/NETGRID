import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
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
import { chooseCorpAction, chooseRunnerAction } from "../index";
import { selectedBidChoiceOptionId } from "./bid-choice-option";
import { assessTraceBidCandidates } from "./trace-bid-assessment";
import { latestTraceContext } from "./trace-context";
import { buildAiDecisionInput } from "./ai-decision-input";
import { withDecisionLocalCorpPunishRouteQuotes } from "./corp-punish-route-quote-input";

const CHANCE = "onr_v1_284_chance-observation";
const URBAN = "onr_v1_307_urban-renewal";
const CORP_DECK = withCards(DEMO_DECKS.demo_corp_001, "forced-trace-punish", [
  CHANCE,
  URBAN,
]);

it.each(["modern_open", "classic_blind", "classic_blind_corp_ties"] as const)(
  "executes the fixed automatic trace kill without extra bids under %s",
  (profile) => {
    const state = applyMandatoryDraw(
      createGameAfterSetup({
        seed: "forced-trace-punish",
        corpDeck: CORP_DECK,
        traceRulesProfile: profile,
      }),
    );
    RealEngineFixtureBuilder.forState(state)
      .withCorpHqSize(0)
      .withCorpCardInHq(CHANCE)
      .withCorpCardInHq(URBAN)
      .withCorpCredits(20)
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
    // Full campaign selection is certified for Modern Open; the Blind cases
    // independently exercise the real trace resolution from the same legal head.
    if (profile === "modern_open") {
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
    }

    let current = state;
    function applySelected(
      side: "corp" | "runner",
      actionId: string,
      selectedChoices?: Record<string, unknown>,
    ) {
      const result = applyAction(current, {
        matchId: current.matchId,
        side,
        actionId,
        clientKnownStateVersion: current.stateVersion,
        ...(selectedChoices ? { selectedChoices } : {}),
      });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.error.message);
      current = result.state;
    }
    applySelected("corp", action.actionId);
    expect(getPlayerView(current, "corp").trace?.bidEffect).toBe(
      "automatic_success_fixed_effect",
    );
    for (const side of ["corp", "runner"] as const) {
      const bidInput = buildAiDecisionInput(current, side, {
        decisionId: "fixed-bid:" + side + ":" + current.stateVersion,
        ownDeckSnapshot: snapshot(
          side === "corp" ? CORP_DECK : DEMO_DECKS.demo_runner_001,
        ),
      });
      const choice = bidInput.playerView.pendingChoice!;
      const before = structuredClone(bidInput);
      if (profile === "modern_open") {
        expect(
          selectedBidChoiceOptionId(
            bidInput,
            choice,
            latestTraceContext(bidInput),
          ),
        ).toBe("bid_0");
        const unrelatedChoice = {
          ...choice,
          source: "card_implementation.secret_spend_compare:unrelated",
        };
        if (side === "runner")
          expect(
            selectedBidChoiceOptionId(
              bidInput,
              unrelatedChoice,
              latestTraceContext(bidInput),
            ),
          ).not.toBe("bid_0");
      } else {
        const assessed = assessTraceBidCandidates(
          bidInput,
          choice,
          latestTraceContext(bidInput),
        );
        expect(assessed?.candidates).toEqual([
          expect.objectContaining({ optionId: "bid_0", bid: 0 }),
        ]);
      }
      expect(bidInput).toEqual(before);
      const bidDecision =
        side === "corp"
          ? chooseCorpAction(bidInput)
          : chooseRunnerAction(bidInput);
      const legal = bidInput.legalActions.find(
        (a) => a.type === "resolve_choice",
      )!;
      expect(bidDecision.actionId).toBe(legal.actionId);
      expect(bidDecision.selectedChoices).toEqual({
        choiceId: choice.choiceId,
        selectedOptionIds: ["bid_0"],
      });
      expect(bidDecision.fallbackUsed).toBe(false);
      applySelected(side, bidDecision.actionId!, bidDecision.selectedChoices);
    }
    expect(current.runner.tags).toBe(2);
    expect(current.corp.credits).toBe(18);
    const finishInput = decisionInput(current);
    const finish = chooseCorpAction(finishInput, {
      quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(current, request),
    });
    expect(finish.actionId).toBe(
      playOperation(finishInput.legalActions, finishInput, URBAN).actionId,
    );
    applySelected("corp", finish.actionId!);
    expect(current.winner).toBe("corp");
    expect(current.corp.credits).toBe(12);
  },
);
function decisionInput(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    decisionId: `tag-amplifier-quote:${state.matchId}:${state.stateVersion}`,
    profileId: "forced-trace-punish",
    ownDeckSnapshot: snapshot(CORP_DECK),
  });
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
