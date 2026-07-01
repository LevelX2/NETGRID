import type { CardImplementationDefinition } from "../../../types";

export const proteusWiredSwitchboardImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_154_wired-switchboard",
  abilities: [
    {
      kind: "activated",
      timing: "trace_post_bid_link_window",
      costs: [{ kind: "trash_source", amount: 1 }],
      limit: { kind: "once_per_trace_per_source", scope: "source" },
      label: "Wired Switchboard: +3 Link",
      effects: [
        {
          kind: "increase_trace_link",
          amount: 3,
          visibility: "public",
        },
      ],
    },
  ],
};
