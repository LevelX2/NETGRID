import type { CardImplementationDefinition } from "../../../types";

// card name: Sumo 2008
// text: *End the run. When you rez Sumo 2008, you may pay [1], above the rez cost, to make it a wall instead of a sentry.
export const proteusSumo2008Implementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_040_sumo-2008",
  variableRez: {
    kind: "alternate_subtype",
    additionalCost: 1,
    baseSubtypes: ["sentry"],
    alternateSubtypes: ["wall"],
    visibility: "public",
  },
};
