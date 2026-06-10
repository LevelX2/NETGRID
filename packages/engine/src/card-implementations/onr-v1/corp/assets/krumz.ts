import type { CardImplementationDefinition } from "../../../types";
import { addHostedCredits } from "../../../helpers";

// card name: Krumz
// text: Put [1] from the bank on Krumz when you rez it. Use this bit only to pay for traces. If you use this bit, replace it at the start of your next turn.
export const krumzImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_330_krumz",
  lifecycle: {
    on_rez: [addHostedCredits(1)],
  },
  corpUtility: {
    kind: "krumz_trace_bit",
    amount: 1,
    refresh: "start_of_corp_turn_after_use",
    visibility: "public",
  },
};
