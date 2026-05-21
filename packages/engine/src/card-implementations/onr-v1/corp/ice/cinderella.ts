import type { CardImplementationDefinition } from "../../../types";

// card name: Cinderella
// text: *Trace 6-If trace is successful, end the run, trash a piece of hardware, and do 2 meat damage. This damage cannot be prevented.
export const cinderellaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_228_cinderella",
  printedSubroutines: [
    {
      kind: "trace",
      baseTraceStrength: 6,
      text: "*Trace 6-If trace is successful, end the run, trash a piece of hardware, and do 2 meat damage. This damage cannot be prevented.",
      onSuccess: [
        { kind: "end_run", visibility: "public" },
        {
          kind: "trash_hardware",
          target: "installed_runner_hardware",
          visibility: "public",
        },
        {
          kind: "unpreventable_meat_damage",
          recipient: "runner",
          amount: 2,
          visibility: "public",
        },
      ],
    },
  ],
};
