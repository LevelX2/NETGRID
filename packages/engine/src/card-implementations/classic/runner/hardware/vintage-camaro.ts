import type { CardImplementationDefinition } from "../../../types";

// card name: Vintage Camaro
// text: [1], Forgo your next action: Avoid receiving a tag.
export const classicVintageCamaroImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_051_vintage-camaro",
  tagPreventionSources: [
    {
      kind: "avoid_tag",
      amount: 1,
      cost: { kind: "credit_and_forgo_next_action", amount: 1 },
      priority: 130,
      visibility: "public",
    },
  ],
};
