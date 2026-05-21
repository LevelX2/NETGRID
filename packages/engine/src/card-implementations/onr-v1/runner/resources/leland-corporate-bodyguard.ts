import type { CardImplementationDefinition } from "../../../types";

// card name: Leland, Corporate Bodyguard
// text: [1]: Prevent 1 meat damage. [T]: Avoid receiving a tag.
export const lelandCorporateBodyguardImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_167_leland-corporate-bodyguard",
  damagePreventionSources: [
    {
      kind: "damage_prevention",
      damageTypes: ["meat"],
      amount: 1,
      cost: { kind: "credit", amount: 1 },
      priority: 118,
      visibility: "public",
    },
  ],
  tagPreventionSources: [
    {
      kind: "avoid_tag",
      amount: 1,
      cost: { kind: "trash_source" },
      priority: 122,
      visibility: "public",
    },
  ],
};
