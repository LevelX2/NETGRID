import type { CardImplementationDefinition } from "../../../types";

// card name: Ice and Data's Guide to the Net
// text: Expose the outermost ice of each data fort.
export const iceAndDatasGuideToTheNetImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_092_ice-and-datas-guide-to-the-net",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "expose_outermost_ice_each_fort",
          visibility: "public",
        },
      ],
    },
  ],
};
