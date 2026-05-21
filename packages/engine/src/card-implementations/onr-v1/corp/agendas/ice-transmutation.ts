import type { CardImplementationDefinition } from "../../../types";

// card name: Ice Transmutation
// text: Choose a piece of rezzed ice when you score Ice Transmutation. That ice now has +1 strength, and each subroutine on it is repeated once. Treat this as if each repeated subroutine appeared immediately after the original subroutine.
export const iceTransmutationImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_204_ice-transmutation",
  scoredAgenda: {
    kind: "ice_transmutation_rezzed_ice_modifier",
    visibility: "public",
  },
};
