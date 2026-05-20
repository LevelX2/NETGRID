import type { CardImplementationDefinition } from "../../../types";

// card name: Red Herrings
// text: Runner must pay [5], in addition to any other costs, to steal agendas accessed from this fort, even on the run during which Runner trashes Red Herrings.
export const redHerringsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_366_red-herrings",
  modifiers: [
    {
      kind: "steal_cost",
      operation: "increase",
      amount: 5,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      side: "corp",
      visibility: "public",
      appliesTo: {
        cardType: "agenda",
      },
      sameServerAsSource: true,
      persistsForCurrentAccessIfSourceTrashed: true,
    },
  ],
};
