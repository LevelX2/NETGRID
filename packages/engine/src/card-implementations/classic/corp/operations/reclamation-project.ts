import type { CardImplementationDefinition } from "../../../types";

// card name: Reclamation Project
// text: Search the archives for any number of ice cards. Show those cards to Runner, then store them in HQ. Playing a double operation costs two consecutive actions this turn instead of one.
export const classicReclamationProjectImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_018_reclamation-project",
  corpUtility: {
    kind: "corp_archives_to_hq",
    filter: { cardType: "ice" },
    maxSelections: "all",
    revealToRunner: true,
    playCost: { kind: "printed", additionalClicks: 1 },
    visibility: "hidden_info_barrier",
  },
};
