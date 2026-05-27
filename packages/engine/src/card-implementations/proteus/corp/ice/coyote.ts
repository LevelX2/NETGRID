import type { CardImplementationDefinition } from "../../../types";

// card name: Coyote
// text: *For the remainder of the run, all further ice is encountered at +1 strength, unless Runner pays [2] while passing Coyote. Gain [3] when you rez Coyote.
export const proteusCoyoteImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_016_coyote",
  printedSubroutines: [
    {
      kind: "run_duration_ice_strength",
      amount: 1,
      runnerMayCancelOnPassingSource: { amount: 2 },
      text: "*For the remainder of the run, all further ice is encountered at +1 strength, unless Runner pays [2] while passing Coyote.",
    },
  ],
  lifecycle: {
    on_rez: [{ kind: "gain_credits", recipient: "corp", amount: 3, visibility: "public" }],
  },
};
