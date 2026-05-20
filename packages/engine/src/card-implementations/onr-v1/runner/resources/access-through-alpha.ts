import type { CardImplementationDefinition } from "../../../types";

// card name: Access through Alpha
// text: [1]: Base link 9. Use only one base link card for each trace attempt made against you.
export const accessThroughAlphaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_148_access-through-alpha",
  abilities: [
    {
      kind: "activated",
      timing: "trace_base_link_window",
      costs: [{ kind: "credit", amount: 1 }],
      limit: {
        kind: "one_base_link_card_per_trace_attempt",
        scope: "trace_attempt",
      },
      label: "Access through Alpha: Base Link 9 nutzen",
      effects: [
        {
          kind: "use_base_link",
          baseLink: 9,
          visibility: "public",
        },
      ],
    },
  ],
};
