import type { CardImplementationDefinition } from "../../../types";

// card name: Disinfectant, Inc.
// text: You may pay [1] to avoid receiving a Virus counter. Use this ability only once each turn.
export const disinfectantIncImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_319_disinfectant-inc",
  corpUtility: {
    kind: "disinfectant_avoid_virus_counter",
    cost: { kind: "credit", amount: 1 },
    limit: "once_per_turn_per_source",
    visibility: "public",
  },
};
