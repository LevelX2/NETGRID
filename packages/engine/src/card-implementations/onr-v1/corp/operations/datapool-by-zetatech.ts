import type { CardImplementationDefinition } from "../../../types";

// card name: Datapool by Zetatech
// text: Play only if Runner is tagged. Give Runner two tags.
export const datapoolByZetatechImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_287_datapool-by-zetatech",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: { kind: "runner_is_tagged" },
      effects: [
        {
          kind: "add_tags",
          recipient: "runner",
          amount: 2,
          visibility: "public",
        },
      ],
    },
  ],
};
