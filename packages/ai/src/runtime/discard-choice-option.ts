import { type AiDecisionInput } from "@netgrid/shared";

type PendingChoiceOption = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>["options"][number];

export function stableDiscardChoiceOptionIds(
  selectableOptions: readonly PendingChoiceOption[],
  count: number,
): string[] {
  return selectableOptions
    .slice()
    .sort(
      (left, right) =>
        left.label.localeCompare(right.label, "de") ||
        left.id.localeCompare(right.id),
    )
    .slice(0, count)
    .map((option) => option.id);
}

export function discardOptionInstanceId(
  option: PendingChoiceOption,
): string | undefined {
  if (typeof option.value === "string") return option.value;
  if (option.card?.instanceId) return option.card.instanceId;
  return option.id.startsWith("card_")
    ? option.id.slice("card_".length)
    : undefined;
}
