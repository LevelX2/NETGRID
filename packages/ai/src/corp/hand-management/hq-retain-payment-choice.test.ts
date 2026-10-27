import { readFileSync } from "node:fs";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { selectedCorpHqRetainPaymentOptionIds } from "./hq-retain-payment-choice";

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

function nativeRetain(kind = "terminal") {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta563-hq-retain-" +
          kind +
          "-original.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(f.validation).every((v) => v === true)).toBe(true);
  return f.input as AiDecisionInput;
}
function retain(input: AiDecisionInput) {
  const before = JSON.stringify(input),
    choice = input.playerView.pendingChoice!;
  const selected = selectedCorpHqRetainPaymentOptionIds(
    input,
    choice,
    choice.options,
    (_input, card) => ({ total: card.type === "ice" ? 10000 : 0 }),
  );
  expect(JSON.stringify(input)).toBe(before);
  return selected!;
}
describe("terminal open Archives retention (SP-686)", () => {
  it("pays only for the one agenda needed to remove terminal exposure", () => {
    const input = nativeRetain();
    expect(retain(input)).toHaveLength(1);
    expect(retain(input)[0]).toMatch(/corporate-coup|political-coup/);
  });
  it("prefers the safe same-cost set over high-value ICE", () => {
    const input = nativeRetain();
    input.playerView.own.credits = 7;
    input.playerView.pendingChoice!.maxSelections = 3;
    expect(retain(input)).toHaveLength(1);
    expect(retain(input)[0]).toMatch(/corporate-coup|political-coup/);
  });
  it("pays for two cards only when one cannot remove terminal exposure", () => {
    const input = nativeRetain();
    input.playerView.opponent.agendaPoints = 5;
    input.playerView.own.credits = 4;
    input.playerView.pendingChoice!.maxSelections = 2;
    expect(retain(input)).toHaveLength(2);
    expect(
      retain(input).every((id) => /corporate-coup|political-coup/.test(id)),
    ).toBe(true);
  });
  it("keeps the reserve when no payable set can remove terminal exposure", () => {
    const input = nativeRetain();
    input.playerView.opponent.agendaPoints = 5;
    expect(retain(input)).toEqual([]);
  });
  it("counts existing own Archives points before the discarded hand", () => {
    const input = nativeRetain();
    const agenda = input.playerView.own.gripOrHq.find(
      (c) => c.type === "agenda",
    )!;
    input.playerView.own.heapOrArchives.push({
      ...agenda,
      instanceId: "existing-archives-agenda",
    });
    expect(retain(input)).toEqual([]);
  });
  it("keeps the ordinary reserve in the native nonterminal six-credit case", () => {
    const input = nativeRetain("nonterminal");
    expect(input.playerView.own.credits).toBe(6);
    expect(retain(input)).toEqual([]);
  });
  it.each(["ice", "run_prohibited"])(
    "keeps the reserve for Archives protected by %s",
    (change) => {
      const input = nativeRetain(),
        archives = input.playerView.servers.find((s) => s.id === "archives")!;
      if (change === "ice")
        archives.ice = [
          {
            ...input.playerView.servers.find((s) => s.id === "hq")!.ice[0]!,
            instanceId: "archives-ice",
          },
        ];
      else archives.statuses = [{ kind: "run_prohibited" } as any];
      expect(retain(input)).toEqual([]);
    },
  );
  it.each(["missing_option_card", "unknown_card", "missing_agenda_points"])(
    "fails visibly for %s",
    (change) => {
      const input = nativeRetain();
      if (change === "missing_option_card")
        input.playerView.pendingChoice!.options[0]!.value = "foreign-card";
      if (change === "unknown_card")
        input.playerView.own.gripOrHq[0]!.known = false;
      if (change === "missing_agenda_points")
        delete input.playerView.own.gripOrHq.find((c) => c.type === "agenda")!
          .agendaPoints;
      expect(() => retain(input)).toThrow(
        /invalid_player_view_card_projection/,
      );
    },
  );
});
