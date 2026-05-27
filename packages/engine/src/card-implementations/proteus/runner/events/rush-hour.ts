import type { CardImplementationDefinition } from "../../../types";

// card name: Rush Hour
// text: Make a run on R&D. If run is successful, access three additional cards from R&D. You cannot use noisy icebreakers during the run.
export const proteusRushHourImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_122_rush-hour",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "central_server", server: "rd" },
          accessCount: 4,
          prohibitNoisyIcebreakers: true,
          visibility: "public",
        },
      ],
    },
  ],
};
