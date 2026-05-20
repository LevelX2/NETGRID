import type { CardImplementationDefinition } from "../../../types";

// card name: Access to Kiribati
// text: [1]: Base link 1. [1]: +1 link. Use only one base link card for each trace attempt made against you.
export const accessToKiribatiImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_150_access-to-kiribati",
  abilities: [
    {
      kind: "activated",
      timing: "trace_base_link_window",
      costs: [{ kind: "credit", amount: 1 }],
      limit: {
        kind: "one_base_link_card_per_trace_attempt",
        scope: "trace_attempt",
      },
      label: "Access to Kiribati: Base Link 1 nutzen",
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
      label: "Access to Kiribati: +1 Link",
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
