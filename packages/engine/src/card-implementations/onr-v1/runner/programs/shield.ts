import type { CardImplementationDefinition } from "../../../types";

// card name: Shield
// text: Prevents up to 2 Net damage each turn.
export const shieldImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_061_shield",
  damagePreventionSources: [
    {
      kind: "damage_prevention",
      damageTypes: ["net"],
      amount: 2,
      limit: { kind: "per_turn", amount: 2 },
      cost: { kind: "none" },
      priority: 131,
      visibility: "public",
    },
  ],
};
