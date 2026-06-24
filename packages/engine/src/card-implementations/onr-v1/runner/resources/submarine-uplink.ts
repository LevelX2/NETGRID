import type { CardImplementationDefinition } from "../../../types";

// card name: Submarine Uplink
// text: [0]: Base link 4. [1]: +1 link. You may use Submarine Uplink only during a run. Using Submarine Uplink forces you to jack out after the current encounter ends. Use only one base link card for each trace attempt made against you.
export const submarineUplinkImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_182_submarine-uplink",
  abilities: [
    {
      kind: "activated",
      timing: "trace_base_link_window",
      costs: [{ kind: "credit", amount: 0 }],
      limit: {
        kind: "one_base_link_card_per_trace_attempt",
        scope: "trace_attempt",
      },
      label: "Submarine Uplink: Base Link 4 nutzen",
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
      costs: [{ kind: "credit", amount: 1 }],
      label: "Submarine Uplink: +1 Link",
      effects: [
        {
          kind: "increase_trace_link",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
  runnerUtilityLongtail: {
    kind: "trace_link_force_jack_out",
    visibility: "public",
  },
};
