import type { CardImplementationDefinition } from "../../../types";

// card name: Total Genetic Retrofit
// text: Remove all tags, at no cost, and automatically avoid receiving your next tag.
export const totalGeneticRetrofitImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_116_total-genetic-retrofit",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: { kind: "runner_is_tagged" },
      effects: [
        {
          kind: "remove_tags",
          recipient: "runner",
          mode: "all",
          visibility: "public",
        },
        {
          kind: "avoid_next_tag",
          recipient: "runner",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
