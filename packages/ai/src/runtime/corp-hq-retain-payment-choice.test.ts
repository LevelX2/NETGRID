import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { selectedCorpHqRetainPaymentOptionIds } from "./corp-hq-retain-payment-choice";

describe("Corp HQ retain payment choice", () => {
  it("ranks by keep value and preserves the five-credit reserve", () => {
    const cards = [
      card("low", "Low"),
      card("high", "High"),
      card("mid", "Mid"),
    ];
    const input = corpInput(cards, 7);
    const choice = input.playerView.pendingChoice!;

    const selected = selectedCorpHqRetainPaymentOptionIds(
      input,
      choice,
      choice.options,
      (_input, candidate) => ({
        total:
          candidate.instanceId === "high"
            ? 300
            : candidate.instanceId === "mid"
              ? 200
              : 100,
      }),
    );

    expect(selected).toEqual(["card_high"]);
  });

  it("keeps all valuable cards when credits cover both payment and reserve", () => {
    const cards = [card("one", "One"), card("two", "Two")];
    const input = corpInput(cards, 9);
    const choice = input.playerView.pendingChoice!;

    const selected = selectedCorpHqRetainPaymentOptionIds(
      input,
      choice,
      choice.options,
      () => ({ total: 100 }),
    );

    expect(selected).toHaveLength(2);
  });
});

function corpInput(cards: VisibleCard[], credits: number): AiDecisionInput {
  return {
    side: "corp",
    legalActions: [],
    eventTail: [],
    difficulty: "hard",
    seed: "corp-retain-choice",
    decisionId: "corp-retain-choice.1",
    actionNumber: 1,
    profileId: "corp-ai-v0.9-hard",
    playerView: {
      side: "corp",
      stateVersion: 1,
      timingPoint: "choice.pending",
      activeSide: "corp",
      phase: "corp_action",
      own: {
        identity: card("corp-id", "Corp"),
        credits,
        clicks: 0,
        agendaPoints: 0,
        gripOrHq: cards,
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: card("runner-id", "Runner"),
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 30,
        discardCount: 0,
        scoreArea: [],
        rig: [],
      },
      servers: [],
      publicEvents: [],
      legalActions: [],
      pendingChoice: {
        choiceId: "retain-hq",
        side: "corp",
        source: "runner.successful_hq_run_corp_pay_to_retain_hq:source:1",
        prompt: "HQ-Karten für je 2 Credits behalten",
        kind: "select_cards",
        options: cards.map((candidate) => ({
          id: `card_${candidate.instanceId}`,
          label: candidate.title ?? candidate.instanceId,
          value: candidate.instanceId,
        })),
        minSelections: 0,
        maxSelections: Math.min(cards.length, Math.floor(credits / 2)),
        stateVersion: 1,
        visibility: "hidden_info_barrier",
      },
      winner: null,
      agendaPointsToWin: 7,
    },
  } as unknown as AiDecisionInput;
}

function card(instanceId: string, title: string): VisibleCard {
  return {
    instanceId,
    definitionId: instanceId,
    title,
    known: true,
  };
}
