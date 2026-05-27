import type { CardImplementationDefinition } from "../../../types";

// card name: Manhunt
// text: Play only if Runner attempted a run during his or her last turn. Trace 6-If trace is successful, give Runner one tag for each point by which your trace exceeded his or her link.
export const proteusManhuntImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_050_manhunt",
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
          baseTraceStrength: 6,
          visibility: "public",
          onSuccess: [
            {
              kind: "add_tags_by_trace_margin_over_runner_link",
              recipient: "runner",
              visibility: "public",
            },
          ],
        },
      ],
    },
  ],
};
