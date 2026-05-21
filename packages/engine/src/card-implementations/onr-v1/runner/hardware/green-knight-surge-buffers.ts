import type { CardImplementationDefinition } from "../../../types";

// card name: "Green Knight" Surge Buffers
// text: Prevents 1 Net damage each turn.
export const greenKnightSurgeBuffersImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_128_green-knight-surge-buffers",
  damagePreventionSources: [
    {
      kind: "damage_prevention",
      damageTypes: ["net"],
      amount: 1,
      limit: { kind: "per_turn", amount: 1 },
      cost: { kind: "none" },
      priority: 121,
      visibility: "public",
    },
  ],
};
