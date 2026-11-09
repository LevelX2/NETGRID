import {
  applyAction,
  createGameAfterSetup,
  hashState,
  quoteCorpPunishRoute,
} from "@netgrid/engine";
import { DEMO_DECKS, type DeckDefinition } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { chooseCorpAction } from "../index";
import { buildAiDecisionInput } from "./ai-decision-input";
import { withDecisionLocalCorpPunishRouteQuotes } from "../corp/punish/punish-route-quote-input";

const TROJAN = "onr_v1_306_trojan-horse";
const MOLE = "onr_proteus_142_hq-mole";
const corpDeck: DeckDefinition = {
  ...DEMO_DECKS.demo_corp_001,
  id: "uncertain-direct-tag-corp",
  cards: [...DEMO_DECKS.demo_corp_001.cards, { id: TROJAN, quantity: 1 }],
};
const runnerDeck: DeckDefinition = {
  ...DEMO_DECKS.demo_runner_001,
  id: "uncertain-direct-tag-runner",
  cards: [...DEMO_DECKS.demo_runner_001.cards, { id: MOLE, quantity: 1 }],
};
afterEach(resetResidentPlanPortfolioMemory);

it.each([false, true])(
  "keeps direct-tag priority tied to the real Engine response guarantee (concealed=%s)",
  (concealed) => {
    let state = createGameAfterSetup({
      seed: "uncertain-direct-tag",
      corpDeck,
      runnerDeck,
      traceRulesProfile: "modern_open",
    });
    const drawn = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: "corp.mandatory_draw",
      clientKnownStateVersion: state.stateVersion,
    });
    if (!drawn.ok) throw new Error(drawn.error.message);
    state = drawn.state;
    RealEngineFixtureBuilder.forState(state)
      .withCorpHqSize(0)
      .withCorpCredits(20)
      .withCorpCardInHq(TROJAN);
    if (concealed) {
      RealEngineFixtureBuilder.forState(state).withRunnerResourceInstalled(
        MOLE,
      );
      const mole = state.runner.rig.resources.find(
        (id) => state.cardInstances[id]?.definitionId === MOLE,
      )!;
      state.cardInstances[mole]!.faceup = false;
      state.cardInstances[mole]!.rezzed = false;
    }
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      stoleAgendaLastTurn: true,
    };
    const input = buildAiDecisionInput(state, "corp", {
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
    const before = hashState(state);
    const quoted = withDecisionLocalCorpPunishRouteQuotes(input, (request) =>
      quoteCorpPunishRoute(state, request),
    );
    const route = quoted.playerView.corpPunishRouteQuoteSet!.routes.find(
      (r) => r.steps[0]?.sourceCardDefinitionId === TROJAN,
    )!;
    expect(route).toMatchObject({
      complete: true,
      guarantee: concealed ? "not_guaranteed" : "guaranteed",
      responseKnowledge: concealed ? "unknown" : "public_exact",
      tagOutcomeEnvelope: {
        addedTags: { minimum: concealed ? 0 : 1, maximum: 1 },
      },
    });
    if (concealed) expect(JSON.stringify(route)).not.toContain(MOLE);
    const decision = chooseCorpAction(input, {
      quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
      persistTacticalPlanMemory: false,
    });
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    expect(
      input.legalActions.some((a) => a.actionId === decision.actionId),
    ).toBe(true);
    expect(decision.decisionDebug?.planFirstDecision?.route?.actionId).toBe(
      decision.actionId,
    );
    if (concealed)
      expect(decision.actionId).not.toBe(
        route.steps[0]!.currentLegalAction!.actionId,
      );
    else
      expect(decision.actionId).toBe(
        route.steps[0]!.currentLegalAction!.actionId,
      );
    expect(hashState(state)).toBe(before);
  },
);
