import type { CardImplementationDefinition } from "../types";

// CLASSIC-01 establishes the Classic registry hook without promoting cards.
export const CLASSIC_CARD_IMPLEMENTATIONS =
  [] as const satisfies readonly CardImplementationDefinition[];
