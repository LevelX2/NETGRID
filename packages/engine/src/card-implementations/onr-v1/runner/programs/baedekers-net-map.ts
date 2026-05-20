import type { CardImplementationDefinition } from "../../../types";

// card name: Baedeker's Net Map
// text: [0]: Base link 1. [1]: +1 link. Use only one base link card for each trace attempt made against you.
export const baedekersNetMapImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_003_baedekers-net-map",
  abilities: [
    {
      kind: "activated",
      timing: "trace_base_link_window",
      costs: [{ kind: "credit", amount: 0 }],
      limit: {
        kind: "one_base_link_card_per_trace_attempt",
        scope: "trace_attempt",
      },
      label: "Baedeker's Net Map: Base Link 1 nutzen",
      effects: [
        {
          kind: "use_base_link",
          baseLink: 1,
          visibility: "public",
        },
      ],
    },
    {
      kind: "activated",
      timing: "trace_post_bid_link_window",
      costs: [{ kind: "credit", amount: 1 }],
      label: "Baedeker's Net Map: +1 Link",
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
