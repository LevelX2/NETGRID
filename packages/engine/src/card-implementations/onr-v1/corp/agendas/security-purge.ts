import type { CardImplementationDefinition } from "../../../types";

// card name: Security Purge
// text: Show the top three cards of R&D to Runner when you score Security Purge. If any of those cards are ice, install and rez them, at no cost. Trash the rest of those cards.
export const securityPurgeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_216_security-purge",
  scoredAgenda: {
    kind: "security_purge_top_rd",
    count: 3,
    visibility: "hidden_info_barrier",
  },
};
