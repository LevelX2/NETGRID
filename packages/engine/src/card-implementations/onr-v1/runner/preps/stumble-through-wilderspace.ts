import type { CardImplementationDefinition } from "../../../types";

// card name: Stumble through Wilderspace
// text: Make a run. You have +9 link for every trace attempt made during that run.
export const stumbleThroughWilderspaceImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_112_stumble-through-wilderspace",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "chosen_server" },
          runTraceLinkBonus: 9,
          visibility: "public",
        },
      ],
    },
  ],
};
