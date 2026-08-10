import type { CardDefinitionId } from "@netgrid/shared";
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

export const TAG_HANDSIZE_ASSET_SOURCE = uniqueDefinitionId(
  "corp run-start tax",
  (implementation) => implementation.corpUtility?.kind === "run_start_tax",
);
