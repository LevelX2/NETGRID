import type { CardImplementationDefinition } from "../../../types";

// card name: Syd Meyer Superstores
// text: A: Trash a rezzed piece of ice. Gain [4].
export const proteusSydMeyerSuperstoresImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_076_syd-meyer-superstores",
  abilities: [
    {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "trash_own_rezzed_ice_for_credits",
          target: "chosen_own_rezzed_ice",
          gainCredits: 4,
          visibility: "public",
        },
      ],
    },
  ],
};
