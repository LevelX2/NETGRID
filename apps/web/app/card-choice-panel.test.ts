import { describe, expect, it } from "vitest";
import type { PlayerView } from "@netgrid/shared";

import {
  cardChoiceHeapPositionBadge,
  cardChoiceHeapPositionHint,
  cardChoiceOrderBadge,
  cardChoiceReadonlyPositionBadge,
  cardChoiceReadonlyPositionHint,
} from "../features/actions/card-choice-order-badge";
import { choiceSelectionRangeLabel } from "../features/actions/card-choice-selection-label";

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

describe("read-only R&D position labels", () => {
  const choice: VisibleChoice = {
    ...orderedChoice("p3_33.private_look:successful_run:protocol_files:rd:2"),
    options: [
      { id: "card_a", label: "A", value: "a", selectable: false },
      { id: "card_b", label: "B", value: "b", selectable: false },
      { id: "card_c", label: "C", value: "c", selectable: false },
      { id: "card_d", label: "D", value: "d", selectable: false },
      { id: "card_e", label: "E", value: "e", selectable: false },
      { id: "done", label: "Fertig", value: "done" },
    ],
  };

  it("marks the R&D top, intermediate positions, and the bottom of the viewed cards", () => {
    expect(cardChoiceReadonlyPositionBadge(choice, "card_a")).toEqual({
      label: "1 · R&D-Spitze",
      ariaLabel: "Position 1: oberste Karte von R&D",
    });
    expect(cardChoiceReadonlyPositionBadge(choice, "card_c")).toEqual({
      label: "3",
      ariaLabel: "Position 3 von 5 in R&D",
    });
    expect(cardChoiceReadonlyPositionBadge(choice, "card_e")).toEqual({
      label: "5 · Unterste",
      ariaLabel: "Position 5: unterste der 5 angesehenen R&D-Karten",
    });
  });

  it("explains the same order and leaves single-card looks unmarked", () => {
    expect(cardChoiceReadonlyPositionHint(choice)).toBe(
      "Die Nummerierung folgt der R&D-Reihenfolge: 1 ist die R&D-Spitze; 5 ist die unterste der 5 angesehenen Karten.",
    );
    const singleCardChoice: VisibleChoice = {
      ...choice,
      options: [choice.options[0]!, choice.options.at(-1)!],
    };
    expect(
      cardChoiceReadonlyPositionBadge(singleCardChoice, "card_a"),
    ).toBeNull();
    expect(cardChoiceReadonlyPositionHint(singleCardChoice)).toBeNull();
  });
});

describe("Heap positions", () => {
  const choice: VisibleChoice = {
    ...orderedChoice("p3_37.search_trash_to_grip:source:definition:program:1"),
    cardSearchPresentation: {
      sourceZone: "heap",
      selectableFilter: "program",
      reveal: "hidden",
      destination: "grip",
      shuffleAfter: false,
      showNonMatchingCards: true,
    },
  };

  it("marks the source-order bottom and the Junkyard BBS-relevant top", () => {
    expect(cardChoiceHeapPositionBadge(choice, "card_a")).toEqual({
      label: "1 · Heap-Boden",
      ariaLabel: "Position 1: unterste Karte des Heaps",
    });
    expect(cardChoiceHeapPositionBadge(choice, "card_b")).toEqual({
      label: "2",
      ariaLabel: "Position 2 von 3 im Heap",
    });
    expect(cardChoiceHeapPositionBadge(choice, "card_c")).toEqual({
      label: "3 · Heap-Spitze",
      ariaLabel: "Position 3: oberste Karte des Heaps",
    });
  });

  it("explains the source order and keeps single-card searches explicit", () => {
    expect(cardChoiceHeapPositionHint(choice)).toBe(
      "Die Reihenfolge folgt dem Heap: 1 ist der Heap-Boden; 3 ist die Heap-Spitze und kann mit Junkyard BBS in den Grip genommen werden.",
    );
    const singleCardChoice: VisibleChoice = {
      ...choice,
      options: [choice.options[0]!],
    };
    expect(cardChoiceHeapPositionHint(singleCardChoice)).toBe(
      "Die markierte Karte ist die Heap-Spitze und kann mit Junkyard BBS in den Grip genommen werden.",
    );
  });
});

describe("choiceSelectionRangeLabel", () => {
  it("states how many cards the player may select", () => {
    expect(choiceSelectionRangeLabel(2, 2)).toBe("2 Karten auswählen");
    expect(choiceSelectionRangeLabel(1, 1)).toBe("1 Karte auswählen");
    expect(choiceSelectionRangeLabel(0, 3)).toBe("Bis zu 3 Karten auswählen");
    expect(choiceSelectionRangeLabel(1, 3)).toBe("1 bis 3 Karten auswählen");
  });
});
