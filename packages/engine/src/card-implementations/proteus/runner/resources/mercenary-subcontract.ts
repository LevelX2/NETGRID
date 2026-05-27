import type { CardImplementationDefinition } from "../../../types";

export const proteusMercenarySubcontractImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_145_mercenary-subcontract",
  runnerUtilityLongtail: {
    kind: "hidden_resource_current_access_free_trash",
    cost: { kind: "credit_and_tap_source", amount: 4 },
    target: "current_accessed_cards",
    visibility: "hidden_info_barrier",
  },
};
