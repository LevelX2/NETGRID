import type { CardImplementationDefinition } from "../types";

export type CardImplementationCatalogGroup = {
  set: "onr-v1";
  side: "corp" | "runner";
  cardType: string;
  implementations: readonly CardImplementationDefinition[];
};

// Set, side and type order is explicit so registry iteration and replay remain deterministic.
export const CARD_IMPLEMENTATION_CATALOG_GROUPS: readonly CardImplementationCatalogGroup[] =
  [];

export const CARD_IMPLEMENTATION_CATALOG =
  CARD_IMPLEMENTATION_CATALOG_GROUPS.flatMap((group) => group.implementations);
