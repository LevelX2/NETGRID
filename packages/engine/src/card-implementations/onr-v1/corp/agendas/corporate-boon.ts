import type { CardImplementationDefinition } from "../../../types";

// card name: Corporate Boon
// text: Put four Boon counters on Corporate Boon when you score it. Boon Counter: Gain an action. Use this ability only once per turn and only during your turn.
export const corporateBoonImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_192_corporate-boon",
  scoredAgenda: {
    kind: "add_counters_on_score",
    counterType: "boon",
    amount: 4,
    visibility: "public",
  },
  abilities: [
    {
      kind: "activated",
      timing: "corp_main",
      costs: [
        {
          kind: "source_counter",
          counterType: "boon",
          amount: 1,
          source: "source",
        },
      ],
      limit: {
        kind: "once_per_turn_per_source",
        scope: "any_ability_on_source",
      },
      effects: [
        {
          kind: "gain_actions",
          recipient: "corp",
          amount: 1,
          visibility: "public",
        },
      ],
      label: "Corporate Boon: Boon-Counter fuer Aktion ausgeben",
    },
  ],
};
