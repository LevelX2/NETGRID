import type { CardImplementationDefinition } from "../../../types";

// card name: Custodial Position
// text: Make a run on R&D. If run is successful, access two additional cards from R&D.
export const custodialPositionImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_081_custodial-position",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "central_server", server: "rd" },
          accessCount: 3,
          visibility: "public",
        },
      ],
    },
  ],
};
