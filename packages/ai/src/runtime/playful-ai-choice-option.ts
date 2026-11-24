import type { ChoiceOption } from "@netgrid/shared";

export function selectedPlayfulAiChoiceOptionId(
  selectableOptions: readonly ChoiceOption[],
): string | undefined {
  let best: { id: string; amount: number } | undefined;
  for (const option of selectableOptions) {
    const amount = option.value;
    if (
      typeof amount !== "number" ||
      !Number.isSafeInteger(amount) ||
      amount < 0
    )
      return undefined;
    if (
      !best ||
      amount > best.amount ||
      (amount === best.amount && option.id.localeCompare(best.id) < 0)
    )
      best = { id: option.id, amount };
  }
  return best?.id;
}
