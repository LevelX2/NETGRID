import type { CardImplementationDefinition } from "../../../types";

// card name: Netspace Inverter
// text: Reverse a fort's ice cards so that the outermost piece of ice becomes the innermost piece of ice, and so forth. Use this ability only immediately after a successful run on that data fort.
export const netspaceInverterImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_044_netspace-inverter",
  successfulRunFollowups: [
    {
      kind: "reverse_ice_on_successful_run_fort",
      timing: "immediately_after_successful_run",
      cost: "none",
      visibility: "public",
    },
  ],
};
