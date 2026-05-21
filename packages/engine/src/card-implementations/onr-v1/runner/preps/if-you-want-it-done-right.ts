import type { CardImplementationDefinition } from "../../../types";

// card name: If You Want It Done Right . . .
// text: Look through the top five cards of your stack. Bring one of those cards into your hand, and arrange the rest in any order you choose.
export const ifYouWantItDoneRightImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_093_if-you-want-it-done-right",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "look_top_stack_take_one_arrange_rest",
          count: 5,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
