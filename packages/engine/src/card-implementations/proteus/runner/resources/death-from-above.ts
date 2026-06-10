import type { CardImplementationDefinition } from "../../../types";

export const proteusDeathFromAboveImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_137_death-from-above",
  successfulRunFollowups: [
    {
      kind: "successful_run_before_access_effect",
      timing: "immediately_after_successful_run_before_access",
      server: "remote",
      source: "installed_hidden_runner_resource",
      cost: { kind: "reveal_and_tap_source" },
      effect: { kind: "trash_remote_fort", include: "root_and_ice" },
      visibility: "hidden_info_barrier",
    },
  ],
};
