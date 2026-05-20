import type { CardImplementationDefinition } from "../../../types";

// card name: Access to Arasaka
// text: [2]: Base link 4. [2]: +1 link. Use only one base link card for each trace attempt made against you.
export const accessToArasakaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_149_access-to-arasaka",
  abilities: [
    {
      kind: "activated",
      timing: "trace_base_link_window",
      costs: [{ kind: "credit", amount: 2 }],
      limit: {
        kind: "one_base_link_card_per_trace_attempt",
        scope: "trace_attempt",
      },
      label: "Access to Arasaka: Base Link 4 nutzen",
      effects: [
        {
          kind: "use_base_link",
          baseLink: 4,
          visibility: "public",
        },
      ],
    },
    {
      kind: "activated",
      timing: "trace_post_bid_link_window",
      costs: [{ kind: "credit", amount: 2 }],
      label: "Access to Arasaka: +1 Link",
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
