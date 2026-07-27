import type { PlayerView } from "@netgrid/shared";

import { newBloodReorderTargetLabel } from "../../app/action-board-ui";

type VisibleChoice = NonNullable<PlayerView["pendingChoice"]>;

export function cardChoiceOrderBadge(
  choice: VisibleChoice,
  selectionIndex: number,
): { label: string; ariaLabel: string } {
  if (
    isRunnerStackTopChooseOneArrangeRestChoice(choice) &&
    selectionIndex === 0
  ) {
    return { label: "1", ariaLabel: "Auswahlposition 1: in den Grip nehmen" };
  }
  const newBloodTarget = newBloodReorderTargetLabel(choice, selectionIndex);
  if (newBloodTarget) {
    return {
      label: newBloodTarget,
      ariaLabel: `Zielslot ${selectionIndex + 1}: ${newBloodTarget}`,
    };
  }
  const position = selectionIndex + 1;
  return {
    label: String(position),
    ariaLabel: `Auswahlposition ${position}`,
  };
}

export function cardChoiceReadonlyPositionBadge(
  choice: VisibleChoice,
  optionId: string,
): { label: string; ariaLabel: string } | null {
  const cardOptions = readonlyRdCardOptions(choice);
  if (cardOptions.length <= 1) return null;
  const optionIndex = cardOptions.findIndex((option) => option.id === optionId);
  if (optionIndex < 0) return null;
  const position = optionIndex + 1;
  if (position === 1) {
    return {
      label: "1 · R&D-Spitze",
      ariaLabel: "Position 1: oberste Karte von R&D",
    };
  }
  if (position === cardOptions.length) {
    return {
      label: `${position} · Unterste`,
      ariaLabel: `Position ${position}: unterste der ${cardOptions.length} angesehenen R&D-Karten`,
    };
  }
  return {
    label: String(position),
    ariaLabel: `Position ${position} von ${cardOptions.length} in R&D`,
  };
}

export function cardChoiceReadonlyPositionHint(
  choice: VisibleChoice,
): string | null {
  const cardOptions = readonlyRdCardOptions(choice);
  if (cardOptions.length <= 1) return null;
  return `Die Nummerierung folgt der R&D-Reihenfolge: 1 ist die R&D-Spitze; ${cardOptions.length} ist die unterste der ${cardOptions.length} angesehenen Karten.`;
}

export function cardChoiceHeapPositionBadge(
  choice: VisibleChoice,
  optionId: string,
): { label: string; ariaLabel: string } | null {
  const cardOptions = heapCardOptions(choice);
  const optionIndex = cardOptions.findIndex((option) => option.id === optionId);
  if (optionIndex < 0) return null;
  const position = optionIndex + 1;
  if (position === cardOptions.length) {
    return {
      label: `${position} · Heap-Spitze`,
      ariaLabel: `Position ${position}: oberste Karte des Heaps`,
    };
  }
  if (position === 1) {
    return {
      label: "1 · Heap-Boden",
      ariaLabel: "Position 1: unterste Karte des Heaps",
    };
  }
  return {
    label: String(position),
    ariaLabel: `Position ${position} von ${cardOptions.length} im Heap`,
  };
}

export function cardChoiceHeapPositionHint(
  choice: VisibleChoice,
): string | null {
  const cardOptions = heapCardOptions(choice);
  if (cardOptions.length === 0) return null;
  if (cardOptions.length === 1)
    return "Die markierte Karte ist die Heap-Spitze und kann mit Junkyard BBS in den Grip genommen werden.";
  return `Die Reihenfolge folgt dem Heap: 1 ist der Heap-Boden; ${cardOptions.length} ist die Heap-Spitze und kann mit Junkyard BBS in den Grip genommen werden.`;
}

export function isRunnerStackTopChooseOneArrangeRestChoice(
  choice: VisibleChoice,
): boolean {
  return (
    choice.source.startsWith(
      "v1922.runner_stack_top5_choose_one_arrange_rest",
    ) ||
    choice.source.startsWith("p3_37.runner_stack_top5_choose_one_arrange_rest")
  );
}

function readonlyRdCardOptions(choice: VisibleChoice): VisibleChoice["options"] {
  if (
    choice.kind !== "select_cards" ||
    !choice.source.startsWith("p3_33.private_look:") ||
    choice.source.split(":")[3] !== "rd"
  ) {
    return [];
  }
  return choice.options.filter((option) => option.id !== "done");
}

function heapCardOptions(choice: VisibleChoice): VisibleChoice["options"] {
  if (
    choice.kind !== "select_cards" ||
    choice.cardSearchPresentation?.sourceZone !== "heap"
  ) {
    return [];
  }
  return choice.options.filter((option) => option.id !== "done");
}
