import type { CardImplementationDefinition } from "../../../types";

// card name: Too Many Doors
// text: *Secretly spend [0], [1], or [2]; Runner does the same. Then you and Runner reveal how much each of you spent. End the run unless you spent as many bits as Runner spent.
export const tooManyDoorsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_272_too-many-doors",
  printedSubroutines: [
    {
      kind: "secret_spend_compare_end_run_unless_corp_spent_at_least_runner",
      allowedAmounts: [0, 1, 2],
      text: "*Secretly spend [0], [1], or [2]; Runner does the same. Then you and Runner reveal how much each of you spent. End the run unless you spent as many bits as Runner spent.",
    },
  ],
};
