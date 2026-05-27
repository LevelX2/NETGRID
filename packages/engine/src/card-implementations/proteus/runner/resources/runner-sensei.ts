import type { CardImplementationDefinition } from "../../../types";

// card name: Runner Sensei
// text: [2]: Base link 4. [2]: +1 link. Gain [1] whenever you successfully use Runner Sensei to avoid a trace. Use only one base link card for each trace attempt made against you.
export const proteusRunnerSenseiImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_148_runner-sensei",
  abilities: [
    {
      kind: "activated",
      timing: "trace_base_link_window",
      costs: [{ kind: "credit", amount: 2 }],
      limit: {
        kind: "one_base_link_card_per_trace_attempt",
        scope: "trace_attempt",
      },
      label: "Runner Sensei: Base Link 4 nutzen",
      effects: [
        {
          kind: "use_base_link",
          baseLink: 4,
          rewardCreditsOnAvoidTrace: 1,
          visibility: "public",
        },
      ],
    },
    {
      kind: "activated",
      timing: "trace_post_bid_link_window",
      costs: [{ kind: "credit", amount: 2 }],
      label: "Runner Sensei: +1 Link",
      effects: [
        {
          kind: "increase_trace_link",
          amount: 1,
          rewardCreditsOnAvoidTrace: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
