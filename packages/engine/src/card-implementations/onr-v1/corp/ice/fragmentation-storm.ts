import type { CardImplementationDefinition } from "../../../types";

// card name: Fragmentation Storm
// text: *Trace 4-If trace is successful, end the run and trash a program, and Runner cannot run again until Runner takes an action to pay [1].
export const fragmentationStormImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_246_fragmentation-storm",
  printedSubroutines: [
    {
      kind: "trace",
      baseTraceStrength: 4,
      text: "*Trace 4-If trace is successful, end the run and trash a program, and Runner cannot run again until Runner takes an action to pay [1].",
      visibility: "public",
      onSuccess: [
        { kind: "end_run", visibility: "public" },
        {
          kind: "trash_program",
          target: "installed_runner_program",
          visibility: "public",
        },
        {
          kind: "runner_run_lock_until_action_paid",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
