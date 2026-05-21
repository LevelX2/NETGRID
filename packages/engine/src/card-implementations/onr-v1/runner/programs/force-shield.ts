import type { CardImplementationDefinition } from "../../../types";

// card name: Force Shield
// text: Prevents up to 2 Net and/or brain damage total each turn.
export const forceShieldImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_028_force-shield",
  damagePreventionSources: [
    {
      kind: "damage_prevention",
      damageTypes: ["net", "core"],
      amount: 2,
      limit: { kind: "per_turn", amount: 2 },
      cost: { kind: "none" },
      priority: 100,
      visibility: "public",
    },
  ],
};
