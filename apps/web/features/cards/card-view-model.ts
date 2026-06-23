import type { PlayerView, PublicGameEvent, Side, VisibleCard } from "@netgrid/shared";

import { catalogSetDetailLabel, catalogSetShortLabelForSetId } from "../../app/catalog-ui";
import { localCardImageUrl } from "../../app/card-image-service";
import { visibleKnownCardRulesText } from "../../app/card-text-source";

type CardViewCatalogDetail = {
  catalogCardId: string;
  title: string;
  side: Side;
  type: string;
  subtypes: string[];
  text: string;
  setId: string;
  setName: string;
  collectorNumber: string;
  numeric: Record<string, number | null | undefined>;
};

export type DisplayVisibleCard = VisibleCard & {
  imageUrl?: string;
  strengthModifier?: number;
  setId?: string;
  setName?: string;
  collectorNumber?: string;
  setShortLabel?: string;
  setDetailLabel?: string;
};

export function visibleKnownCardIds(view: PlayerView | undefined): string[] {
  if (!view) return [];
  const cards = [
    ...view.own.gripOrHq,
    ...view.own.heapOrArchives,
    ...view.own.scoreArea,
    ...(view.own.rig ?? []),
    ...(view.opponent.discardCards ?? []),
    ...view.opponent.scoreArea,
    ...view.servers.flatMap((server) => [...server.ice, ...server.root]),
    ...(view.run?.approachedIce ? [view.run.approachedIce] : []),
    ...(view.run?.encounteredIce ? [view.run.encounteredIce] : [])
  ];
  return Array.from(new Set(cards.filter((card) => card.known && card.definitionId).map((card) => card.definitionId!)));
}

export function enrichVisibleCard(card: VisibleCard, detailsById: Record<string, CardViewCatalogDetail>): DisplayVisibleCard {
  if (!card.known || !card.definitionId) return card;
  const detail = detailsById[card.definitionId];
  const imageUrl = localCardImageUrl(card.definitionId);
  const enriched: DisplayVisibleCard = {
    ...card,
    ...(imageUrl ? { imageUrl } : {})
  };
  if (!detail) return enriched;
  addCatalogSetDisplay(enriched, detail);
  const rulesText = visibleKnownCardRulesText({
    catalogText: detail.text,
    visibleRulesText: card.rulesText ?? null,
  });
  if (rulesText !== undefined) enriched.rulesText = rulesText;
  addNumeric(enriched, "cost", card.cost, detail.numeric.cost);
  addNumeric(enriched, "installCost", card.installCost, detail.numeric.installCost);
  addNumeric(enriched, "memoryCost", card.memoryCost, detail.numeric.memoryCost);
  addNumeric(enriched, "strength", card.strength, detail.numeric.strength);
  addNumeric(enriched, "rezCost", card.rezCost, detail.numeric.rezCost);
  addNumeric(enriched, "trashCost", card.trashCost, detail.numeric.trashCost);
  addNumeric(enriched, "advancementRequirement", card.advancementRequirement, detail.numeric.advancementRequirement);
  addNumeric(enriched, "agendaPoints", card.agendaPoints, detail.numeric.agendaPoints);
  if (typeof card.strength === "number" && typeof detail.numeric.strength === "number" && card.strength > detail.numeric.strength) {
    enriched.strengthModifier = card.strength - detail.numeric.strength;
  }
  return enriched;
}

export function visibleCardFromCatalogDetail(card: CardViewCatalogDetail): DisplayVisibleCard {
  const visible: DisplayVisibleCard = {
    instanceId: `chronicle-${card.catalogCardId}`,
    known: true,
    title: card.title,
    definitionId: card.catalogCardId,
    subtypes: card.subtypes,
    rulesText: card.text
  };
  visible.type = card.type as NonNullable<VisibleCard["type"]>;
  addCatalogSetDisplay(visible, card);
  const imageUrl = localCardImageUrl(card.catalogCardId);
  if (imageUrl) visible.imageUrl = imageUrl;
  addNumeric(visible, "cost", undefined, card.numeric.cost);
  addNumeric(visible, "installCost", undefined, card.numeric.installCost);
  addNumeric(visible, "memoryCost", undefined, card.numeric.memoryCost);
  addNumeric(visible, "strength", undefined, card.numeric.strength);
  addNumeric(visible, "rezCost", undefined, card.numeric.rezCost);
  addNumeric(visible, "trashCost", undefined, card.numeric.trashCost);
  addNumeric(visible, "advancementRequirement", undefined, card.numeric.advancementRequirement);
  addNumeric(visible, "agendaPoints", undefined, card.numeric.agendaPoints);
  return visible;
}

export function visibleCardFromPublicEvent(event: PublicGameEvent, cardId: string, title: string): DisplayVisibleCard {
  const card: DisplayVisibleCard = {
    instanceId: `access-${event.eventId}-${cardId}`,
    known: true,
    title,
    definitionId: cardId
  };
  const imageUrl = localCardImageUrl(cardId);
  if (imageUrl) card.imageUrl = imageUrl;
  return card;
}

function addCatalogSetDisplay(target: DisplayVisibleCard, detail: Pick<CardViewCatalogDetail, "setId" | "setName" | "collectorNumber">): void {
  const shortLabel = catalogSetShortLabelForSetId(detail.setId);
  const detailLabel = catalogSetDetailLabel(detail);
  if (detail.setId) target.setId = detail.setId;
  if (detail.setName) target.setName = detail.setName;
  if (detail.collectorNumber) target.collectorNumber = detail.collectorNumber;
  if (shortLabel) target.setShortLabel = shortLabel;
  if (detailLabel) target.setDetailLabel = detailLabel;
}

function addNumeric(target: VisibleCard, key: keyof Pick<VisibleCard, "cost" | "installCost" | "memoryCost" | "strength" | "rezCost" | "trashCost" | "advancementRequirement" | "agendaPoints">, current: number | undefined, fallback: number | null | undefined): void {
  if (current !== undefined || fallback === null || fallback === undefined) return;
  target[key] = fallback;
}
