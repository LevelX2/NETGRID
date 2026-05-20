import type { CardImplementationDefinition } from "../../../types";

// card name: Executive Wiretaps
// text: Make a run on HQ. If run is successful, access two additional cards from HQ.
export const executiveWiretapsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_085_executive-wiretaps",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "central_server", server: "hq" },
          accessCount: 3,
          visibility: "public",
        },
      ],
    },
  ],
};
