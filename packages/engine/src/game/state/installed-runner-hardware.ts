import {
  CARD_DEFINITIONS_BY_ID,
  type CardInstanceId,
  type GameState,
} from "@netgrid/shared";

/**
 * Returns the exact, public installed Runner-hardware target set for effects
 * that exclude one printed subtype.
 *
 * The Rules Engine owns this projection. AI callers must never reconstruct it
 * from card names, rules text or printed costs.
 */
export function eligibleInstalledRunnerHardwareIds(
  state: GameState,
  excludedSubtype: string,
): CardInstanceId[] {
  const normalizedExcludedSubtype = normalizeSubtype(excludedSubtype);
  return state.runner.rig.hardware
    .filter((cardId) => {
      const instance = state.cardInstances[cardId];
      const definition = instance
        ? CARD_DEFINITIONS_BY_ID[instance.definitionId]
        : undefined;
      return (
        instance?.owner === "runner" &&
        instance.controller === "runner" &&
        instance.zone.side === "runner" &&
        instance.zone.zone === "rig" &&
        definition?.type === "hardware" &&
        !definition.subtypes.some(
          (subtype) => normalizeSubtype(subtype) === normalizedExcludedSubtype,
        )
      );
    })
    .sort((left, right) => {
      const leftDefinition =
        CARD_DEFINITIONS_BY_ID[state.cardInstances[left]!.definitionId]!;
      const rightDefinition =
        CARD_DEFINITIONS_BY_ID[state.cardInstances[right]!.definitionId]!;
      return (
        leftDefinition.title.localeCompare(rightDefinition.title) ||
        left.localeCompare(right)
      );
    });
}

function normalizeSubtype(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
