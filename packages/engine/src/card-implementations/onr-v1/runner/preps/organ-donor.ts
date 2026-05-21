import type { CardImplementationDefinition } from "../../../types";

// card name: Organ Donor
// text: Trash up to five cards from your hand. Gain [2] for each card trashed in this way.
export const organDonorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_103_organ-donor",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "trash_cards_from_grip_for_credits",
          target: "chosen_runner_grip_cards",
          max: 5,
          gainPerTrashed: 2,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
