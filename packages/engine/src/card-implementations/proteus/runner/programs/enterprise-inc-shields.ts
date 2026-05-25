import type { CardImplementationDefinition } from "../../../types";

// card name: Enterprise, Inc., Shields
// text: [1]: Prevent up to 2 Net damage. [1]: Prevent 1 brain damage.
export const proteusEnterpriseIncShieldsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_086_enterprise-inc-shields",
  damagePreventionSources: [
    {
      kind: "damage_prevention",
      damageTypes: ["net"],
      amount: 2,
      cost: { kind: "credit", amount: 1 },
      priority: 100,
      visibility: "public",
    },
    {
      kind: "damage_prevention",
      damageTypes: ["core"],
      amount: 1,
      cost: { kind: "credit", amount: 1 },
      priority: 101,
      visibility: "public",
    },
  ],
};
