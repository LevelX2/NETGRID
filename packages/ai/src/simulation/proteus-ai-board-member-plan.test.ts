import { createGameAfterSetup } from "@netgrid/engine";
import type { DeckDefinition, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import proteusDecksJson from "../../../../data/decks/proteus-playtest-decks-2026-05-25.json";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import { chooseAiAction } from "../index";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";

const AI_BOARD_MEMBER = "onr_proteus_001_ai-board-member";

describe("Proteus AI Board Member offer plan", () => {
  it("accepts guaranteed Basic Credit capacity through corp.economy", () => {
    const { input } = offerInput("gain_credit");
    const decision = chooseAiAction(input);

    expect(decision).toMatchObject({
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
      decisionDebug: { planKind: "corp.economy" },
    });
    expect(decision.actionId).toMatch(/\.accept_extra_action_offer$/);
  });

  it("declines draw-only capacity when the draw has no admitted safe route", () => {
    const { state, input } = offerInput("draw_card");
    state.corp.rd = state.corp.rd.slice(0, 2);
    state.corp.hq = state.corp.hq.slice(0, state.corp.maxHandSize);
    const constrainedInput = buildAiDecisionInput(state, "corp", {
      ownDeckSnapshot: deckSnapshot(
        deck("proteus_corp_region_fast_score_2026_05_25"),
      ),
      decisionId: `${state.matchId}:decline-draw-offer`,
      profileId: "proteus-ai-board-member-plan",
    });
    resetResidentPlanPortfolioMemory();
    const decision = chooseAiAction(constrainedInput);

    expect(input.legalActions).toHaveLength(2);
    expect(decision).toMatchObject({
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
      decisionDebug: { planKind: "corp.economy" },
    });
    expect(decision.actionId).toMatch(/\.decline_extra_action_offer$/);
  });
});

function offerInput(restriction: "gain_credit" | "draw_card") {
  const corpDeck = deck("proteus_corp_region_fast_score_2026_05_25");
  const state = createGameAfterSetup({
    matchId: `proteus-ai-board-member-${restriction}`,
    seed: `proteus-ai-board-member-${restriction}`,
    agendaPointsToWin: 7,
    runnerDeck: deck("proteus_runner_hq_virus_derez_2026_05_25"),
    corpDeck,
  });
  const source = corpCard(state, AI_BOARD_MEMBER);
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 3;
  state.actionEconomy = {
    pendingOffer: {
      side: "corp",
      sourceCardInstanceId: source.instanceId,
      sourceDefinitionId: source.definitionId,
      restriction,
      optional: true,
      createdAtStateVersion: state.stateVersion,
    },
  };
  resetResidentPlanPortfolioMemory();
  return {
    state,
    input: buildAiDecisionInput(state, "corp", {
      ownDeckSnapshot: deckSnapshot(corpDeck),
      decisionId: `${state.matchId}:resolve-offer`,
      profileId: "proteus-ai-board-member-plan",
    }),
  };
}

function corpCard(state: GameState, definitionId: string) {
  const card = Object.values(state.cardInstances).find(
    (candidate) =>
      candidate.owner === "corp" && candidate.definitionId === definitionId,
  );
  if (!card) throw new Error(`Missing Corp card ${definitionId}`);
  return card;
}

function deckSnapshot(
  deckDefinition: DeckDefinition,
): AiDeckStrategyDeckSnapshot {
  return {
    deckSnapshotId: `${deckDefinition.id}-board-member-offer`,
    sourceDeckId: deckDefinition.id,
    side: deckDefinition.side,
    cards: deckDefinition.cards.map((card) => ({
      cardId: card.id,
      quantity: card.quantity,
    })),
  };
}

function deck(deckId: string): DeckDefinition {
  const result = (proteusDecksJson as { decks: DeckDefinition[] }).decks.find(
    (candidate) => candidate.id === deckId,
  );
  if (!result) throw new Error(`Missing Proteus pilot deck ${deckId}`);
  return structuredClone(result);
}
