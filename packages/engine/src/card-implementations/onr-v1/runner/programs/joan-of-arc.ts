import type { CardImplementationDefinition } from "../../../types";

// card name: Joan of Arc
// text: [T]: Prevent one or more of your other installed programs from being trashed. [1]: Prevent one or more of your other installed programs from being trashed, and bring Joan of Arc into your hand.
export const joanOfArcImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_038_joan-of-arc",
  trashPreventionSources: [
    {
      kind: "prevent_installed_card_trash",
      protectsCardTypes: ["program"],
      excludesSelf: true,
      mode: "one_or_more_simultaneous",
      cost: { kind: "trash_source" },
      priority: 118,
      visibility: "public",
    },
    {
      kind: "prevent_installed_card_trash",
      protectsCardTypes: ["program"],
      excludesSelf: true,
      mode: "one_or_more_simultaneous",
      cost: { kind: "credit_return_source_to_grip", amount: 1 },
      priority: 119,
      visibility: "public",
    },
  ],
};
