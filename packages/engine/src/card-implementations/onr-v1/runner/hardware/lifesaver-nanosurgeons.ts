import type { CardImplementationDefinition } from "../../../types";

// card name: Lifesaver Nanosurgeons
// text: A: Draw two cards. Use this ability only if you were damaged during any of your last three actions. [T]: Prevent 1 brain damage.
export const lifesaverNanosurgeonsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_130_lifesaver-nanosurgeons",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      condition: { kind: "runner_damaged_during_last_three_actions" },
      effects: [
        {
          kind: "draw_cards",
          recipient: "runner",
          amount: 2,
          visibility: "public",
        },
      ],
    },
  ],
  damagePreventionSources: [
    {
      kind: "damage_prevention",
      damageTypes: ["core"],
      amount: 1,
      cost: { kind: "trash_source" },
      priority: 121,
      visibility: "public",
    },
  ],
};
