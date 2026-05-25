import type { CardImplementationDefinition } from "../../../types";

// card name: Lesser Arcana
// text: *End the run. When you rez Lesser Arcana, you may pay 1, above the rez cost, to make it a wall instead of a sentry.
export const proteusLesserArcanaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_028_lesser-arcana",
  variableRez: {
    kind: "alternate_subtype",
    additionalCost: 1,
    baseSubtypes: ["sentry"],
    alternateSubtypes: ["wall"],
    visibility: "public",
  },
};
