import type { CardImplementationDefinition } from "../../../types";

// card name: All-Hands
// text: Make a run on HQ. If run is successful, access three additional cards from HQ. You cannot use noisy icebreakers during the run.
export const proteusAllHandsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_101_all-hands",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "central_server", server: "hq" },
          accessCount: 4,
          prohibitNoisyIcebreakers: true,
          visibility: "public",
        },
      ],
    },
  ],
};
