import type { PlayerView, VisibleCard } from "@netgrid/shared";

import { rolesMatch } from "./role-match";

export type VisibleCardHeuristicDefinition = {
  title?: string;
  subtypes?: readonly string[];
  rulesText?: string;
  mechanics?: readonly string[];
  installCost?: number;
  cost?: number;
  rezCost?: number;
};

export type VisibleCardRuntimeDefinition = {
  text?: string;
  type?: string;
  numeric?: {
    advancementRequirement?: number | null;
    rezCost?: number | null;
  };
};

export type VisibleCardDemoDefinition = {
  rulesText?: string;
  type?: string;
  advancementRequirement?: number;
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

export function normalizedRulesTextForDefinition(
  runtime: VisibleCardRuntimeDefinition | undefined,
  demo: VisibleCardDemoDefinition | undefined,
): string {
  const runtimeText = runtime?.text ?? "";
  const demoText = typeof demo?.rulesText === "string" ? demo.rulesText : "";
  return `${runtimeText} ${demoText}`.toLowerCase().replace(/\s+/g, " ").trim();
}

export function visibleCardType(
  card: VisibleCard,
  runtime: VisibleCardRuntimeDefinition | undefined,
  demo: VisibleCardDemoDefinition | undefined,
): string | undefined {
  return card.type ?? runtime?.type ?? demo?.type;
}

export function visibleCardAdvancementRequirement(
  card: VisibleCard,
  runtime: VisibleCardRuntimeDefinition | undefined,
  demo: VisibleCardDemoDefinition | undefined,
): number | undefined {
  return (
    card.advancementRequirement ??
    runtime?.numeric?.advancementRequirement ??
    demo?.advancementRequirement
  );
}

export function visibleIceRezCost(
  card: VisibleCard,
  runtime: VisibleCardRuntimeDefinition | undefined,
  demo: VisibleCardDemoDefinition | undefined,
): number | undefined {
  return card.rezCost ?? runtime?.numeric?.rezCost ?? demo?.rezCost;
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
    rolesMatch(roles, ["bad_publicity", "trace", "bad-publicity"]) ||
    /bad publicity|bad_publicity|trace/i.test(text)
  );
}

export function visibleCounterValue(card: VisibleCard | undefined): number {
  if (!card) return 0;
  const counters = Object.values(card.counters ?? {}).reduce(
    (sum, value) => sum + (typeof value === "number" ? Math.max(0, value) : 0),
    0,
  );
  return counters + (card.counterDisplays?.length ?? 0);
}

export function visibleInstallCost(card: VisibleCard | undefined): number {
  if (!card) return 0;
  const value = card.installCost ?? card.cost;
  return safeNonNegativeInteger(value);
}

export function visibleMemoryCost(card: VisibleCard | undefined): number {
  return safeNonNegativeInteger(card?.memoryCost);
}

export function visibleCardsByInstanceId(
  view: PlayerView,
): Map<string, VisibleCard> {
  const cards = [
    view.own.identity,
    ...view.own.gripOrHq,
    ...view.own.heapOrArchives,
    ...view.own.scoreArea,
    ...(view.own.rig ?? []),
    view.opponent.identity,
    ...view.opponent.scoreArea,
    ...(view.opponent.rig ?? []),
    ...(view.opponent.discardCards ?? []),
    ...view.servers.flatMap((server) => [...server.ice, ...server.root]),
  ];
  return new Map(cards.map((card) => [card.instanceId, card]));
}

export function safeNonNegativeInteger(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}
