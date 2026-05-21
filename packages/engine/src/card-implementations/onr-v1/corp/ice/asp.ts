import type { CardImplementationDefinition } from "../../../types";

// card name: Asp
// text: *Trace 5-If trace is successful, end the run, and Runner cannot run again until Runner takes an action to pay [1].
export const aspImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_221_asp",
  printedSubroutines: [
    {
      kind: "trace",
      baseTraceStrength: 5,
      text: "*Trace 5-If trace is successful, end the run, and Runner cannot run again until Runner takes an action to pay [1].",
      onSuccess: [
        { kind: "end_run", visibility: "public" },
        {
          kind: "runner_run_lock_until_action_paid",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
