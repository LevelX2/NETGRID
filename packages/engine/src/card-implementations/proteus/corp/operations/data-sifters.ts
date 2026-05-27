import type { CardImplementationDefinition } from "../../../types";

// card name: Data Sifters
// text: Play only if Runner trashed any nodes during his or her last turn. Give Runner a tag.
export const proteusDataSiftersImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_048_data-sifters",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: {
        kind: "runner_trashed_node_last_turn",
      },
      effects: [
        {
          kind: "add_tags",
          recipient: "runner",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
