import type { CardImplementationDefinition } from "../../../types";

// card name: Haunting Inquisition
// text: *Runner cannot make another run during his or her next six actions. *End the run.
export const hauntingInquisitionImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_247_haunting-inquisition",
  printedSubroutines: [
    {
      kind: "runner_run_lock_actions",
      amount: 6,
      text: "*Runner cannot make another run during his or her next six actions.",
    },
    {
      kind: "end_the_run",
      text: "*End the run.",
    },
  ],
};
