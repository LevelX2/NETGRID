import type { CardImplementationDefinition } from "../../../types";

// card name: Back Door to Orbital Air
// text: [1]: Base link 2. [2]: +1 link. Use only one base link card for each trace attempt made against you.
export const backDoorToOrbitalAirImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_153_back-door-to-orbital-air",
  abilities: [
    {
      kind: "activated",
      timing: "trace_base_link_window",
      costs: [{ kind: "credit", amount: 1 }],
      limit: {
        kind: "one_base_link_card_per_trace_attempt",
        scope: "trace_attempt",
      },
      label: "Back Door to Orbital Air: Base Link 2 nutzen",
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
      costs: [{ kind: "credit", amount: 2 }],
      label: "Back Door to Orbital Air: +1 Link",
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
