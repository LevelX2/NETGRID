import type { CardImplementationDefinition } from "../../../types";

// card name: Audit of Call Records
// text: Play only if Runner attempted two or more runs during his or her last turn. Trace 5-If trace is successful, give Runner a tag.
export const auditOfCallRecordsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_283_audit-of-call-records",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: {
        kind: "runner_attempted_run_last_turn",
        minimumRuns: 2,
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
