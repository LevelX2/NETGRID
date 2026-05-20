import type { CardImplementationDefinition } from "../../../types";

// card name: Bakdoor
// text: [0]: Base link 3. [2]: +1 link. Use only one base link card for each trace attempt made against you.
export const bakdoorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_004_bakdoor",
  abilities: [
    {
      kind: "activated",
      timing: "trace_base_link_window",
      costs: [{ kind: "credit", amount: 0 }],
      limit: {
        kind: "one_base_link_card_per_trace_attempt",
        scope: "trace_attempt",
      },
      label: "Bakdoor: Base Link 3 nutzen",
      effects: [
        {
          kind: "use_base_link",
          baseLink: 3,
          visibility: "public",
        },
      ],
    },
    {
      kind: "activated",
      timing: "trace_post_bid_link_window",
      costs: [{ kind: "credit", amount: 2 }],
      label: "Bakdoor: +1 Link",
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
