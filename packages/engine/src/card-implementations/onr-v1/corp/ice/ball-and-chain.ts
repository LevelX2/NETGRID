import type { CardImplementationDefinition } from "../../../types";

// card name: Ball and Chain
// text: *For the remainder of the run, Runner must pay [2] when encountering a piece of ice, in addition to any other costs, or end the run.
export const ballAndChainImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_222_ball-and-chain",
  printedSubroutines: [
    {
      kind: "run_duration_encounter_cost_or_end_run",
      amount: 2,
      text: "*For the remainder of the run, Runner must pay [2] when encountering a piece of ice, in addition to any other costs, or end the run.",
    },
  ],
};
