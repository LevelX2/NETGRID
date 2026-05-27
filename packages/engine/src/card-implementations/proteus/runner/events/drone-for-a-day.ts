import type { CardImplementationDefinition } from "../../../types";

// card name: Drone for a Day
// text: Gain [9] and the Corp gives you a tag.
export const proteusDroneForADayImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_107_drone-for-a-day",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 9,
          visibility: "public",
        },
        {
          kind: "add_tags",
          recipient: "runner",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
