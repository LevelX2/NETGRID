import type { CardImplementationDefinition } from "../../../types";

// card name: Signpost
// text: [1]: +2 link. Use this ability only once during each trace attempt, and only after you and the Corp have revealed how much each of you spent.
export const signpostImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_063_signpost",
  abilities: [
    {
      kind: "activated",
      timing: "trace_post_bid_link_window",
      costs: [{ kind: "credit", amount: 1 }],
      limit: {
        kind: "once_per_trace_per_source",
        scope: "source",
      },
      label: "Signpost: +2 Link",
      effects: [
        {
          kind: "increase_trace_link",
          amount: 2,
          visibility: "public",
        },
      ],
    },
  ],
};
