import type { CardImplementationDefinition } from "../../../types";

// card name: Afreet
// text: Afreet can have up to 3 MU of programs installed in it. All icebreakers installed in Afreet have their strength reduced by 1. If Afreet leaves play, trash all programs installed in it.
export const afreetImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_001_afreet",
  hostedProgramCapacity: {
    capacityMu: 3,
    allowedCardTypes: ["program"],
    hostedProgramsAreInstalled: true,
    hostLeavesPlayTrashesHosted: true,
  },
  hostedProgramModifiers: [
    {
      appliesTo: "hosted_icebreakers",
      kind: "icebreaker_strength",
      operation: "reduce",
      amount: 1,
    },
  ],
};
