import type { CardImplementationDefinition } from "../../../types";

// card name: Virizz
// text: *For the remainder of the run, Runner must pay an additional [1] to break each ice subroutine.
export const virizzImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_277_virizz",
  printedSubroutines: [
    {
      kind: "run_duration_break_subroutine_cost",
      amount: 1,
      text: "*For the remainder of the run, Runner must pay an additional [1] to break each ice subroutine.",
      visibility: "public",
    },
  ],
};
