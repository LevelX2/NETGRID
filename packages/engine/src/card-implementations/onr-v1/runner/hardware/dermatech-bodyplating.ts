import type { CardImplementationDefinition } from "../../../types";

// card name: Dermatech Bodyplating
// text: Prevents 1 meat damage each turn.
export const dermatechBodyplatingImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_125_dermatech-bodyplating",
  damagePreventionSources: [
    {
      kind: "damage_prevention",
      damageTypes: ["meat"],
      amount: 1,
      limit: { kind: "per_turn", amount: 1 },
      cost: { kind: "none" },
      priority: 110,
      visibility: "public",
    },
  ],
};
