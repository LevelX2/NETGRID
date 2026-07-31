import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { selectedDiscardChoiceOptionIds } from "./discard-choice-selection";

describe("selectedDiscardChoiceOptionIds", () => {
  it("revalues the last remaining copy after selecting a duplicate", () => {
    const duplicateOne = card("duplicate-1", "duplicate");
    const duplicateTwo = card("duplicate-2", "duplicate");
    const neutral = card("neutral-1", "neutral");
    const input = discardInput([duplicateOne, duplicateTwo, neutral]);
    const choice = input.playerView.pendingChoice!;

    const selected = selectedDiscardChoiceOptionIds(
      input,
      choice,
      choice.options,
      (currentInput, candidate) => ({
        total:
          candidate.definitionId === "duplicate" &&
          currentInput.playerView.own.gripOrHq.filter(
            (current) => current.definitionId === "duplicate",
          ).length > 1
            ? 0
            : candidate.definitionId === "neutral"
              ? 50
              : 100,
      }),
    );

    expect(selected).toEqual(["option-duplicate-1", "option-neutral-1"]);
  });

  it("discards an unbound card before a plan-bound support provider regardless of numeric keep score", () => {
    const support = card("support-1", "support");
    const unbound = card("unbound-1", "unbound");
    const input = discardInput([support, unbound], 1);
    const choice = input.playerView.pendingChoice!;

    const selected = selectedDiscardChoiceOptionIds(
      input,
      choice,
      choice.options,
      (_currentInput, candidate) =>
        candidate.definitionId === "support"
          ? { total: -1_000, planDisposition: "support_for_need" }
          : { total: 1_000 },
    );

    expect(selected).toEqual(["option-unbound-1"]);
  });
});

function card(instanceId: string, definitionId: string): VisibleCard {
  return {
    instanceId,
    definitionId,
    title: definitionId,
    type: "asset",
    known: true,
  } as VisibleCard;
}

function discardInput(
  cards: VisibleCard[],
  selectionCount = 2,
): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      own: {
        gripOrHq: cards,
      },
      pendingChoice: {
        choiceId: "discard-test",
        side: "corp",
        source: "discard_phase",
        minSelections: selectionCount,
        maxSelections: selectionCount,
        options: cards.map((candidate) => ({
          id: `option-${candidate.instanceId}`,
          label: candidate.title,
          value: candidate.instanceId,
        })),
      },
    },
  } as AiDecisionInput;
}
