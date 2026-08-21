import type { CardDefinitionId } from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../card-definitions";
import { CARD_IMPLEMENTATIONS } from "../card-implementations/registry";

function uniqueDefinitionId(
  sourceKind: string,
  predicate: (implementation: (typeof CARD_IMPLEMENTATIONS)[number]) => boolean,
): CardDefinitionId {
  const matches = CARD_IMPLEMENTATIONS.filter(predicate)
    .map((implementation) => implementation.cardDefinitionId)
    .sort();
  if (matches.length !== 1)
    throw new Error(
      `Expected exactly one ${sourceKind} implementation, found ${matches.length}.`,
    );
  return matches[0]!;
}

export const RANDOM_BREAKER_PROGRAM_SOURCE = uniqueDefinitionId(
  "random icebreaker run-start-strength",
  (implementation) => {
    const definition = CARD_DEFINITIONS_BY_ID[implementation.cardDefinitionId];
    return (
      definition?.type === "program" &&
      definition.subtypes.includes("random") &&
      implementation.icebreakerAbilities?.some(
        (ability) =>
          ability.kind === "break_subroutine" &&
          ability.special?.kind === "run_start_random_strength_bonus",
      ) === true
    );
  },
);

export const BOARDWALK_RANDOM_PROGRAM_SOURCE = uniqueDefinitionId(
  "random program virus counter",
  (implementation) => implementation.virusCounter?.counterKind === "boardwalk",
);

export const RANDOM_RESOURCE_SOURCE = uniqueDefinitionId(
  "random runner utility resource",
  (implementation) =>
    CARD_DEFINITIONS_BY_ID[implementation.cardDefinitionId]?.type ===
      "resource" &&
    implementation.runnerUtilityLongtail?.kind === "start_turn_random_effect_table",
);
