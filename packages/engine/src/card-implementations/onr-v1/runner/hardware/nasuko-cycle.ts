import type { CardImplementationDefinition } from "../../../types";

// card name: Nasuko Cycle
// text: [3]: Avoid receiving a tag.
export const nasukoCycleImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_135_nasuko-cycle",
  tagPreventionSources: [
    {
      kind: "avoid_tag",
      amount: 1,
      cost: { kind: "credit", amount: 3 },
      priority: 125,
      visibility: "public",
    },
  ],
};
