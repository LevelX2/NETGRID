import type { CardImplementationDefinition } from "../../../types";

// card name: Corporate Retreat
// text: You lose the following ability as soon as you rez or install any card. A: Gain [2].
export const corporateRetreatImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_195_corporate-retreat",
  scoredAgenda: {
    kind: "scored_agenda_credit_until_install_or_rez",
    counterType: "mark",
    gainAmount: 2,
    visibility: "public",
  },
};
