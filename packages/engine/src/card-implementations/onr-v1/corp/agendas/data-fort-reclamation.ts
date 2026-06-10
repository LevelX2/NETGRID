import type { CardImplementationDefinition } from "../../../types";

// card name: Data Fort Reclamation
// text: Gain [10] and choose up to four cards stored in HQ when you score Data Fort Reclamation. Create a new data fort using the cards chosen. Install the cards one at a time; you may rez them when you install them. Then, return to the bank any of the [10] not spent.
export const dataFortReclamationImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_197_data-fort-reclamation",
  scoredAgenda: {
    kind: "score_install_hq_cards_into_new_remote_then_rez",
    sourceZone: "hq",
    targetServer: "new_remote",
    allowedCards: "corp_installable",
    maxCards: 4,
    temporaryCredits: {
      amount: 10,
      usableFor: "rez_installed_cards_from_sequence",
      returnUnused: true,
    },
    optionalRez: true,
    visibility: "hidden_info_barrier",
  },
};
