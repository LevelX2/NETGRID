import type { CardImplementationDefinition } from "../../../types";

export const proteusExpendableFamilyMemberImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_140_expendable-family-member",
  tagPreventionSources: [
    {
      kind: "avoid_tag",
      amount: 1,
      cost: { kind: "credit_and_trash_source", amount: 1 },
      priority: 118,
      visibility: "public",
    },
  ],
};
