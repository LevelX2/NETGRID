import type { CardImplementationDefinition } from "../../../types";

export const proteusDeathFromAboveImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_137_death-from-above",
  successfulRunFollowups: [
    {
      kind: "hidden_resource_successful_remote_run_trash_fort",
      timing: "immediately_after_successful_run_before_access",
      include: "root_and_ice",
      cost: { kind: "tap_source" },
      visibility: "hidden_info_barrier",
    },
  ],
};
