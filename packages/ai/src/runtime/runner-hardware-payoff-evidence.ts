import { type VisibleCard } from "@netgrid/shared";

export function corpVisibleRunnerHardwarePayoffEvidence(
  card: VisibleCard,
): string[] {
  const normalizedText = `${card.title ?? ""} ${card.rulesText ?? ""}`
    .toLowerCase()
    .replace(/&/g, "and");
  const hasMultiaccessPayoff =
    /\badditional card\b/.test(normalizedText) ||
    /\baccess\s+1\s+additional\b/.test(normalizedText) ||
    /\bmultiaccess\b/.test(normalizedText);
  return [
    `target_definition:${card.definitionId ?? "unknown"}`,
    ...(hasMultiaccessPayoff ? ["runner_hardware_payoff:multiaccess"] : []),
  ];
}
