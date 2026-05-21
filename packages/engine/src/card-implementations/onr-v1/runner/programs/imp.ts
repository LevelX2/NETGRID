import type { CardImplementationDefinition } from "../../../types";

// card name: Imp
// text: Imp can have up to 2 MU of programs installed in it. All icebreakers installed in this way have their strength reduced by 1. If Imp leaves play, trash all programs installed in it.
export const impImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_033_imp",
  hostedProgramCapacity: {
    capacityMu: 2,
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
