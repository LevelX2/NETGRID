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
