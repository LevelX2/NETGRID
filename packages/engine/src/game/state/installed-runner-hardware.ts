import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { type CardInstanceId, type GameState } from "@netgrid/shared";

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
  const eligible: { cardId: CardInstanceId; title: string }[] = [];
  for (const cardId of state.runner.rig.hardware) {
    const instance = state.cardInstances[cardId];
    if (
      instance?.owner !== "runner" ||
      instance.controller !== "runner" ||
      instance.zone.side !== "runner" ||
      instance.zone.zone !== "rig"
    )
      continue;
    const definition = CARD_DEFINITIONS_BY_ID[instance.definitionId];
    if (
      definition?.type !== "hardware" ||
      definition.subtypes.some(
        (subtype) => normalizeSubtype(subtype) === normalizedExcludedSubtype,
      )
    )
      continue;
    eligible.push({ cardId, title: definition.title.toLowerCase() });
  }
  // Numbered choices must keep the same instance order on every host.
  return eligible
    .sort((left, right) => {
      if (left.title !== right.title) return left.title < right.title ? -1 : 1;
      if (left.cardId === right.cardId) return 0;
      return left.cardId < right.cardId ? -1 : 1;
    })
    .map(({ cardId }) => cardId);
}

function normalizeSubtype(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
