import type { CardImplementationDefinition } from "../../../types";

export const proteusGetReadyToRumbleImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_141_get-ready-to-rumble",
  runnerUtilityLongtail: {
    kind: "hidden_resource_post_meat_damage_random_hq_discard",
    cost: { kind: "tap_source" },
    amount: 2,
    visibility: "hidden_info_barrier",
  },
};
