import type { CardImplementationDefinition } from "../../../types";

// card name: Hunt Club BBS
// text: Expose up to three installed cards.
export const huntClubBbsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_091_hunt-club-bbs",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "expose_installed_cards",
          targets: "chosen_installed_corp_cards",
          min: 0,
          max: 3,
          visibility: "public",
        },
      ],
    },
  ],
};
