import type { CardImplementationDefinition } from "../../../types";

// card name: Security Net Optimization
// text: Choose a fort when you score Security Net Optimization. That fort gives all ice installed on it +1 strength.
export const securityNetOptimizationImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_215_security-net-optimization",
  scoredAgenda: {
    kind: "choose_fort_ice_strength_bonus",
    amount: 1,
    visibility: "public",
  },
};
