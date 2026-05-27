import type { CardImplementationDefinition } from "../../../types";

export const proteusCreditSubversionImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_136_credit-subversion",
  successfulRunFollowups: [
    {
      kind: "hidden_resource_successful_hq_run_corp_lose_credits",
      timing: "immediately_after_successful_run_before_access",
      amount: 3,
      cost: { kind: "tap_source" },
      visibility: "hidden_info_barrier",
    },
  ],
};
