import type { VisibleCard } from "@netgrid/shared";

export type VisibleCardHeuristicDefinition = {
  title?: string;
  subtypes?: readonly string[];
  rulesText?: string;
  mechanics?: readonly string[];
  installCost?: number;
  cost?: number;
  rezCost?: number;
};

export function visibleCardPlayOrInstallCost(
  card: VisibleCard,
  definition: VisibleCardHeuristicDefinition | undefined,
): number {
  const direct = card.installCost ?? card.cost ?? card.rezCost;
  if (typeof direct === "number" && Number.isFinite(direct)) {
    return Math.max(0, direct);
  }
  return Math.max(
    0,
    definition?.installCost ?? definition?.cost ?? definition?.rezCost ?? 0,
  );
}

export function visibleCardText(
  card: VisibleCard,
  definition: VisibleCardHeuristicDefinition | undefined,
): string {
  return [
    card.title,
    card.definitionId,
    ...(card.subtypes ?? []),
    card.rulesText,
    definition?.title,
    ...(definition?.subtypes ?? []),
    definition?.rulesText,
    ...(definition?.mechanics ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

export function runnerCardLooksLikeCreditPayout(
  card: VisibleCard,
  definition: VisibleCardHeuristicDefinition | undefined,
): boolean {
  const mechanics = definition?.mechanics ?? [];
  if (mechanics.some((mechanic) => mechanic.includes("gain_credits"))) {
    return true;
  }
  return /gain\s+\[?\d+\]?\s+credits/i.test(
    visibleCardText(card, definition),
  );
}

export function runnerBadPublicityOrTraceTechCard(
  card: VisibleCard | undefined,
  roles: readonly string[] = [],
  definition: VisibleCardHeuristicDefinition | undefined,
): boolean {
  const text = card ? visibleCardText(card, definition) : "";
  return (
    roles.some(
      (role) =>
        role.includes("bad_publicity") ||
        role.includes("trace") ||
        role.includes("bad-publicity"),
    ) || /bad publicity|bad_publicity|trace/i.test(text)
  );
}
