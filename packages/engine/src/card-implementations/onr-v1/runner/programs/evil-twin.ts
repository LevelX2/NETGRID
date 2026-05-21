import type { CardImplementationDefinition } from "../../../types";

// card name: Evil Twin
// text: [3]: Break sentry subroutine. [1]: +1 strength. Prevents up to 2 Net and/or brain damage total each turn.
export const evilTwinImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_023_evil-twin",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 3 },
      matches: { kind: "ice_subtype", subtype: "sentry" },
      visibility: "public",
    },
    {
      kind: "increase_strength",
      cost: { kind: "credit", amount: 1 },
      amount: 1,
      duration: "current_encounter",
      visibility: "public",
    },
  ],
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
