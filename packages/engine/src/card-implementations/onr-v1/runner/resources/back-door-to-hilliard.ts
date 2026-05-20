import type { CardImplementationDefinition } from "../../../types";

// card name: Back Door to Hilliard
// text: [0]: Base link 2. [3]: +1 link. Use only one base link card for each trace attempt made against you.
export const backDoorToHilliardImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_152_back-door-to-hilliard",
  abilities: [
    {
      kind: "activated",
      timing: "trace_base_link_window",
      costs: [{ kind: "credit", amount: 0 }],
      limit: {
        kind: "one_base_link_card_per_trace_attempt",
        scope: "trace_attempt",
      },
      label: "Back Door to Hilliard: Base Link 2 nutzen",
      effects: [
        {
          kind: "use_base_link",
          baseLink: 2,
          visibility: "public",
        },
      ],
    },
    {
      kind: "activated",
      timing: "trace_post_bid_link_window",
      costs: [{ kind: "credit", amount: 3 }],
      label: "Back Door to Hilliard: +1 Link",
      effects: [
        {
          kind: "increase_trace_link",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
