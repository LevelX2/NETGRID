import type { CardImplementationDefinition } from "../../../types";

// card name: Anonymous Tip
// text: Derez a piece of black ice of your choice.
export const anonymousTipImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_077_anonymous-tip",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "derez_rezzed_black_ice",
          target: "chosen_rezzed_black_ice",
          visibility: "public",
        },
      ],
    },
  ],
};
