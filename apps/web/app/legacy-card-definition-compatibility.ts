import { CARD_DEFINITIONS_BY_ID } from "@netgrid/shared";

/**
 * CS06 legacy-only browser compatibility. Migrated CardSpec ids are absent by
 * authority contract and must arrive through side-safe Action/Event DTO text.
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
