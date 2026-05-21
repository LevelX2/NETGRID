import type { CardImplementationDefinition } from "../../../types";

// card name: Tutor
// text: *For the remainder of the run, all ice encountered has an additional subroutine, "*End the run," after all other subroutines.
export const tutorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_274_tutor",
  printedSubroutines: [
    {
      kind: "run_duration_additional_subroutine",
      append: "after_existing",
      subroutine: {
        kind: "end_the_run",
        text: "*End the run.",
        visibility: "public",
      },
      text: '*For the remainder of the run, all ice encountered has an additional subroutine, "*End the run," after all other subroutines.',
    },
  ],
};
