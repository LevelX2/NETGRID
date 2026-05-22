import type { CardImplementationDefinition } from "../../../types";

// card name: Smith's Pawnshop
// text: At the start of each of your turns, you may trash one of your other installed cards to gain [2]. Only one unique card of a particular name can be in play at a time. If for some reason more than one is in play, trash all but one.
export const smithsPawnshopImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_180_smiths-pawnshop",
  unique: {
    kind: "unique_by_title",
    controller: "runner",
  },
  uniqueDirectLongtail: {
    kind: "smiths_pawnshop_start_turn_trash_for_credits",
    gainCredits: 2,
    visibility: "public",
  },
};
