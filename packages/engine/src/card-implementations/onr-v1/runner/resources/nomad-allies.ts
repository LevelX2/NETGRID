import type { CardImplementationDefinition } from "../../../types";

// card name: Nomad Allies
// text: A, [1]: Remove a tag, at no cost. [T]: Avoid receiving a tag.
export const nomadAlliesImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_170_nomad-allies",
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [
        { kind: "action", amount: 1 },
        { kind: "credit", amount: 1 },
      ],
      condition: { kind: "runner_is_tagged" },
      label: "Nomad Allies: Tag entfernen",
      effects: [
        {
          kind: "remove_tags",
          recipient: "runner",
          mode: "amount",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
  tagPreventionSources: [
    {
      kind: "avoid_tag",
      amount: 1,
      cost: { kind: "trash_source" },
      priority: 121,
      visibility: "public",
    },
  ],
};
