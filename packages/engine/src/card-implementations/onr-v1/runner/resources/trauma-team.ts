import type { CardImplementationDefinition } from "../../../types";

// card name: Trauma Team
// text: Put two Trauma counters on Trauma Team when it is installed. Trauma counter: Prevent 1 meat damage. A: Put one Trauma counter on Trauma Team.
export const traumaTeamImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_185_trauma-team",
  lifecycle: {
    on_install: [
      {
        kind: "add_counters_to_source",
        counterType: "trauma",
        amount: 2,
        visibility: "public",
      },
    ],
  },
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "add_counters_to_source",
          counterType: "trauma",
          amount: 1,
          visibility: "public",
        },
      ],
      label: "Trauma-Counter hinzufügen",
    },
  ],
  damagePreventionSources: [
    {
      kind: "damage_prevention",
      damageTypes: ["meat"],
      amount: 1,
      cost: {
        kind: "source_counter",
        counterType: "trauma",
        amount: 1,
      },
      priority: 128,
      visibility: "public",
    },
  ],
};
