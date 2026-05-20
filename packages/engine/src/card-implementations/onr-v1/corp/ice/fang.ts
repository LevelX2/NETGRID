import type { CardImplementationDefinition } from "../../../types";

// card name: Fang
// text: *Trace 4-If trace is successful, end the run, and Runner cannot run again until Runner takes an action to pay [2].
export const fangImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_240_fang",
  printedSubroutines: [
    {
      kind: "trace",
      baseTraceStrength: 4,
      text: "*Trace 4-If trace is successful, end the run, and Runner cannot run again until Runner takes an action to pay [2].",
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
