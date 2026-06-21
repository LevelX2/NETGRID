import type { CardImplementationDefinition } from "../../../types";

// card name: Corporate War
// text: If you have [12] or more bits in your pool when you score Corporate War, gain [12]; otherwise, lose all bits.
export const corporateWarImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_196_corporate-war",
  scoredAgenda: {
    kind: "score_credit_swing_if_corp_credit_threshold_met",
    threshold: 12,
    gainAmount: 12,
    visibility: "public",
  },
};
