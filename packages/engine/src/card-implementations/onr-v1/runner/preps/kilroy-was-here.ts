import type { CardImplementationDefinition } from "../../../types";

// card name: Kilroy Was Here
// text: Make a run on R&D; you may trash, at no cost, any cards you access that were stored in R&D, even if the cards cannot normally be trashed.
export const kilroyWasHereImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_096_kilroy-was-here",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "central_server", server: "rd" },
          freeTrashAccessZones: ["rd"],
          visibility: "public",
        },
      ],
    },
  ],
};
