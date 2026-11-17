import type { ChoiceOption } from "@netgrid/shared";

import { playfulAiGainValue } from "./choice-option";

export function selectedPlayfulAiChoiceOptionId(
  selectableOptions: readonly ChoiceOption[],
): string | undefined {
  return [...selectableOptions].sort(
    (left, right) =>
      playfulAiGainValue(right) - playfulAiGainValue(left) ||
      left.id.localeCompare(right.id),
  )[0]?.id;
}
