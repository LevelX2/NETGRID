import type { CardImplementationDefinition } from "../../../types";

// card name: Data Darts
// text: *Do 3 Net damage. *Runner cannot break any subroutines of the next piece of ice encountered during the run.
export const dataDartsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_234_data-darts",
  printedSubroutines: [
    {
      kind: "damage",
      damageType: "net",
      amount: 3,
      preventable: true,
      text: "*Do 3 Net damage.",
    },
    {
      kind: "prohibit_break_next_ice",
      text: "*Runner cannot break any subroutines of the next piece of ice encountered during the run.",
    },
  ],
};
