import type { CardImplementationDefinition } from "../../../types";

export const proteusCreditSubversionImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_136_credit-subversion",
  successfulRunFollowups: [
    {
      kind: "successful_run_before_access_effect",
      timing: "immediately_after_successful_run_before_access",
      server: "hq",
      source: "installed_hidden_runner_resource",
      cost: { kind: "reveal_and_tap_source" },
      effect: { kind: "corp_lose_credits", amount: 3 },
      visibility: "hidden_info_barrier",
    },
  ],
};
