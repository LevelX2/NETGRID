import type { CardImplementationDefinition } from "../../../types";

// card name: Snowbank
// text: *End the run unless Runner pays [1]. Gain [3] when you rez Snowbank.
export const proteusSnowbankImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_038_snowbank",
  printedSubroutines: [
    {
      kind: "end_the_run_unless_runner_pays",
      amount: 1,
      text: "*End the run unless Runner pays [1].",
    },
  ],
  lifecycle: {
    on_rez: [
      {
        kind: "gain_credits",
        recipient: "corp",
        amount: 3,
        visibility: "public",
      },
    ],
  },
};
