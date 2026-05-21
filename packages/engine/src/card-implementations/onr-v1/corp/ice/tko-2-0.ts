import type { CardImplementationDefinition } from "../../../types";

// card name: TKO 2.0
// text: *End the run, and Runner forgoes his or her next action.
export const tkoTwoPointZeroImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_271_tko-2-0",
  printedSubroutines: [
    {
      kind: "runner_forgoes_next_action",
      text: "*Runner forgoes his or her next action.",
      breakTags: ["knockout"],
    },
    {
      kind: "end_the_run",
      text: "*End the run.",
    },
  ],
};
