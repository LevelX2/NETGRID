import type { CardImplementationDefinition } from "../../../types";

// card name: misc.for-sale
// text: Trash any number of your installed cards. Gain [3] for each card trashed in this way.
export const miscForSaleImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_100_misc-for-sale",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "trash_own_installed_cards_for_credits",
          target: "chosen_installed_runner_cards",
          min: 0,
          max: "any",
          gainPerTrashed: 3,
          visibility: "public",
        },
      ],
    },
  ],
};
