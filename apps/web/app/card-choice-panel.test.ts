import { describe, expect, it } from "vitest";
import type { PlayerView } from "@netgrid/shared";

import { cardChoiceOrderBadge } from "../features/actions/card-choice-order-badge";

type VisibleChoice = NonNullable<PlayerView["pendingChoice"]>;

function orderedChoice(source: string): VisibleChoice {
  return {
    choiceId: "choice_1",
    side: "runner",
    source,
    prompt: "Stack-Spitze waehlen und anordnen",
    kind: "select_cards",
    options: [
      { id: "card_a", label: "A", value: "a" },
      { id: "card_b", label: "B", value: "b" },
      { id: "card_c", label: "C", value: "c" },
    ],
    minSelections: 3,
    maxSelections: 3,
    stateVersion: 1,
    visibility: "hidden_info_barrier",
  };
}

describe("cardChoiceOrderBadge", () => {
  it("numbers the Runner top-stack take-and-arrange choice from the grip card onward", () => {
    const choice = orderedChoice(
      "p3_37.runner_stack_top5_choose_one_arrange_rest:source:1",
    );

    expect(cardChoiceOrderBadge(choice, 0)).toEqual({
      label: "1",
      ariaLabel: "Auswahlposition 1: in den Grip nehmen",
    });
    expect(cardChoiceOrderBadge(choice, 1)).toEqual({
      label: "2",
      ariaLabel: "Auswahlposition 2",
    });
  });

  it("keeps non-special ordered choices as plain numeric positions", () => {
    const choice = orderedChoice("v1922.corp_rd_arrange_top5:source:1");

    expect(cardChoiceOrderBadge(choice, 0)).toEqual({
      label: "1",
      ariaLabel: "Auswahlposition 1",
    });
  });
});
