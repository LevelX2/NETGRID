import type { CardImplementationDefinition } from "../../../types";

// card name: Romp through HQ
// text: Make a run on HQ; you may trash, at no cost, any cards you access that were stored in HQ, even if the cards cannot normally be trashed.
export const rompThroughHqImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_107_romp-through-hq",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "central_server", server: "hq" },
          freeTrashAccessZones: ["hq"],
          visibility: "public",
        },
      ],
    },
  ],
};
