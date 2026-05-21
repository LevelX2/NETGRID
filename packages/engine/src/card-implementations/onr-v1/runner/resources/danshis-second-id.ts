import type { CardImplementationDefinition } from "../../../types";

// card name: Danshi's Second ID
// text: A, [T]: Remove up to three tags, at no cost.
export const danshisSecondIdImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_158_danshis-second-id",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [
        { kind: "action", amount: 1 },
        { kind: "trash_source", amount: 1 },
      ],
      condition: { kind: "runner_is_tagged" },
      label: "Danshi's Second ID: bis zu 3 Tags entfernen",
      effects: [
        {
          kind: "remove_tags",
          recipient: "runner",
          mode: "up_to_amount",
          amount: 3,
          visibility: "public",
        },
      ],
    },
  ],
};
