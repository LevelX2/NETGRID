import type { CardImplementationDefinition } from "../../../types";

// card name: Schlaghund Pointers
// text: Play only if Runner has attempted a run this game. Trace 3-If trace is successful, give Runner a tag. Pay [1], in addition to the normal cost, for each point of trace above 0.
export const proteusSchlaghundPointersImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_052_schlaghund-pointers",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: {
        kind: "runner_attempted_run_this_game",
        minimumRuns: 1,
      },
      effects: [
        {
          kind: "trace",
          baseTraceStrength: 3,
          additionalPlayCostPerBaseTracePointAboveZero: 1,
          visibility: "public",
          onSuccess: [
            {
              kind: "add_tags",
              recipient: "runner",
              amount: 1,
              visibility: "public",
            },
          ],
        },
      ],
    },
  ],
};
