import type { CardImplementationDefinition } from "../../../types";

// card name: Chance Observation
// text: Play only if Runner attempted a run during his or her last turn. Trace 5-If trace is successful, give Runner a tag.
export const chanceObservationImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_284_chance-observation",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: {
        kind: "runner_attempted_run_last_turn",
        minimumRuns: 1,
      },
      effects: [
        {
          kind: "trace",
          baseTraceStrength: 5,
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
