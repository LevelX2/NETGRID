import type { CardImplementationDefinition } from "../../../types";

// card name: Rasmin Bridger
// text: After Runner passes each piece of ice on this fort, Runner must pay [1] or end the run.
export const proteusRasminBridgerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_070_rasmin-bridger",
  fortRunWindows: [
    {
      kind: "runner_pay_or_end_run_after_passing_ice_on_this_fort",
      timing: "pass_ice_on_this_fort",
      amount: 1,
      visibility: "public",
    },
  ],
};
