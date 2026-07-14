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

function discardInput(cards: VisibleCard[]): AiDecisionInput {
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
        minSelections: 2,
        maxSelections: 2,
        options: cards.map((candidate) => ({
          id: `option-${candidate.instanceId}`,
          label: candidate.title,
          value: candidate.instanceId,
        })),
      },
    },
  } as AiDecisionInput;
}
