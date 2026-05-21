import type { CardImplementationDefinition } from "../../../types";

// card name: Succubus
// text: Succubus can have up to 3 MU of programs installed in it. If Succubus leaves play, trash all programs installed in it.
export const succubusImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_069_succubus",
  hostedProgramCapacity: {
    capacityMu: 3,
    allowedCardTypes: ["program"],
    hostedProgramsAreInstalled: true,
    hostLeavesPlayTrashesHosted: true,
  },
};
