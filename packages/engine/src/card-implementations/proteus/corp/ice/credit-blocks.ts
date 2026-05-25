import type { CardImplementationDefinition } from "../../../types";

// card name: Credit Blocks
// text: *End the run. When you rez Credit Blocks, you may pay [1], above the rez cost, to make it a wall instead of a sentry.
export const proteusCreditBlocksImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_017_credit-blocks",
  variableRez: {
    kind: "alternate_subtype",
    additionalCost: 1,
    baseSubtypes: ["sentry"],
    alternateSubtypes: ["wall"],
    visibility: "public",
  },
};
