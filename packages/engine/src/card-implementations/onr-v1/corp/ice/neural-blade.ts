import type { CardImplementationDefinition } from "../../../types";

// card name: Neural Blade
// text: *Do 1 Net damage. *Runner cannot break any subroutines of the next piece of ice encountered during the run.
export const neuralBladeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_258_neural-blade",
  printedSubroutines: [
    {
      kind: "damage",
      damageType: "net",
      amount: 1,
      preventable: true,
      text: "*Do 1 Net damage.",
    },
    {
      kind: "prohibit_break_next_ice",
      text: "*Runner cannot break any subroutines of the next piece of ice encountered during the run.",
    },
  ],
};
