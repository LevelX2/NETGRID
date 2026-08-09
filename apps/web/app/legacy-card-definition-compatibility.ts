import { CARD_DEFINITIONS_BY_ID } from "@netgrid/shared";

export type PublicCardPresentation = {
  title: string;
  type?: string;
};

export type PublicCardPresentationsById = Readonly<
  Record<string, PublicCardPresentation>
>;

/**
 * Legacy-only browser compatibility. CardSpec-migrated ids are absent by
 * authority contract and must arrive through side-safe Catalog/Action/Event
 * DTO text.
 * Remove with the remaining Shared card definitions in CS11.
 */
export function legacyPublicCardDefinition(definitionId: string) {
  return CARD_DEFINITIONS_BY_ID[definitionId];
}

export function legacyPublicCardTitle(
  definitionId: string | undefined,
): string | undefined {
  return definitionId === undefined
    ? undefined
    : CARD_DEFINITIONS_BY_ID[definitionId]?.title;
}

/**
 * Browser-safe title projection. The injected values come from the sanitized
 * catalog list DTO; Shared remains a disjoint compatibility source for cards
 * that have not migrated yet.
 */
export function publicCardTitle(
  definitionId: string | undefined,
  presentationsById?: PublicCardPresentationsById,
): string | undefined {
  if (definitionId === undefined) return undefined;
  return (
    presentationsById?.[definitionId]?.title ??
    legacyPublicCardTitle(definitionId)
  );
}

export function publicCardPresentation(
  definitionId: string | undefined,
  presentationsById?: PublicCardPresentationsById,
): PublicCardPresentation | undefined {
  if (definitionId === undefined) return undefined;
  const injected = presentationsById?.[definitionId];
  if (injected) return injected;
  const legacy = legacyPublicCardDefinition(definitionId);
  return legacy ? { title: legacy.title, type: legacy.type } : undefined;
}
