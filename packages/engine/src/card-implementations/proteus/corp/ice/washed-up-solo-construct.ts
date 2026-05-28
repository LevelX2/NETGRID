import type { CardImplementationDefinition } from "../../../types";

// card name: Washed-Up Solo Construct
// text: *Trash a program unless Runner pays [1]. Gain [3] when you rez Washed-Up Solo Construct.
export const proteusWashedUpSoloConstructImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_045_washed-up-solo-construct",
  printedSubroutines: [
    {
      kind: "trash_program_unless_runner_pays",
      amount: 1,
      text: "*Trash a program unless Runner pays [1].",
    },
  ],
  lifecycle: {
    on_rez: [{ kind: "gain_credits", recipient: "corp", amount: 3, visibility: "public" }],
  },
};
