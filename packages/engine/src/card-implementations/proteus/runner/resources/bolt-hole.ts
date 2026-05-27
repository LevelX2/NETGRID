import type { CardImplementationDefinition } from "../../../types";

export const proteusBoltHoleImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_132_bolt-hole",
  damagePreventionSources: [
    {
      kind: "damage_prevention",
      damageTypes: ["meat"],
      amount: 2,
      cost: { kind: "tap_source" },
      priority: 118,
      visibility: "public",
    },
  ],
};
