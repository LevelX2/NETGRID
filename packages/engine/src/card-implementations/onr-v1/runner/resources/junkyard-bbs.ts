import type { CardImplementationDefinition } from "../../../types";

// card name: Junkyard BBS
// text: A, [1]: Bring the top card from your trash into your hand.
export const junkyardBbsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_165_junkyard-bbs",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [
        { kind: "action", amount: 1 },
        { kind: "credit", amount: 1 },
      ],
      label: "Junkyard BBS: oberste Trash-Karte in die Grip nehmen",
      effects: [
        {
          kind: "move_top_trash_to_grip",
          recipient: "runner",
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
