import type { CardImplementationDefinition } from "../../../types";

// card name: Full Body Conversion
// text: Prevents all meat damage. For each [1] the Corp pays when meat damage is done, 1 point of meat damage is not prevented by this card.
export const fullBodyConversionImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_127_full-body-conversion",
  damagePreventionSources: [
    {
      kind: "damage_prevention",
      damageTypes: ["meat"],
      amount: "all",
      cost: { kind: "none" },
      corpMayPayToBypass: { costPerDamage: 1 },
      priority: 119,
      visibility: "public",
    },
  ],
};
