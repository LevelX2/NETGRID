import type { CardImplementationDefinition } from "../../../types";

// card name: Planning Consultants
// text: Look at the top five cards of R&D and arrange them in any order you choose.
export const planningConsultantsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_298_planning-consultants",
  corpUtility: {
    kind: "corp_rd_top_reorder",
    count: 5,
    visibility: "hidden_info_barrier",
  },
};
