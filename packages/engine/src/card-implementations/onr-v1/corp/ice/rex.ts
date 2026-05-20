import type { CardImplementationDefinition } from "../../../types";

// card name: Rex
// text: *Trace 3-If trace is successful, end the run, and Runner cannot run again until Runner takes an action to pay [2].
export const rexImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_264_rex",
  printedSubroutines: [
    {
      kind: "trace",
      baseTraceStrength: 3,
      text: "*Trace 3-If trace is successful, end the run, and Runner cannot run again until Runner takes an action to pay [2].",
      visibility: "public",
      onSuccess: [
        { kind: "end_run", visibility: "public" },
        {
          kind: "runner_run_lock_until_action_paid",
          amount: 2,
          visibility: "public",
        },
      ],
    },
  ],
};
