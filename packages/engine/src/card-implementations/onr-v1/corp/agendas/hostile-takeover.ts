import type { CardImplementationDefinition } from "../../../types";

// card name: Hostile Takeover
// text: Gain [5] when you score Hostile Takeover.
export const hostileTakeoverImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_203_hostile-takeover",
  scoredAgenda: {
    kind: "gain_credits_on_score",
    recipient: "corp",
    amount: 5,
    visibility: "public",
  },
};
