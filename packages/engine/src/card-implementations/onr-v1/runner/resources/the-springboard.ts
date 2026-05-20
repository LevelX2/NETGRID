import type { CardImplementationDefinition } from "../../../types";

// card name: The Springboard
// text: [1]: +1 link. Use this ability only once during each trace attempt, and only after you and the Corp have revealed how much each of you spent.
export const theSpringboardImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_181_the-springboard",
  abilities: [
    {
      kind: "activated",
      timing: "trace_post_bid_link_window",
      costs: [{ kind: "credit", amount: 1 }],
      limit: {
        kind: "once_per_trace_per_source",
        scope: "source",
      },
      label: "The Springboard: +1 Link",
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
