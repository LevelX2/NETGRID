import { type VisibleCard } from "@netgrid/shared";

export function corpVisibleRunnerHardwarePayoffEvidence(
  card: VisibleCard,
): string[] {
  const normalizedText = `${card.title ?? ""} ${card.rulesText ?? ""}`
    .toLowerCase()
    .replace(/&/g, "and");
  return [
    `target_definition:${card.definitionId ?? "unknown"}`,
    ...(normalizedText.includes("additional card") ||
    normalizedText.includes("access 1 additional") ||
    normalizedText.includes("multiaccess")
      ? ["runner_hardware_payoff:multiaccess"]
      : []),
  ];
}
