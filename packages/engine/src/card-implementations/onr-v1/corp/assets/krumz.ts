import type { CardImplementationDefinition } from "../../../types";

// card name: Krumz
// text: Put [1] from the bank on Krumz when you rez it. Use this bit only to pay for traces. If you use this bit, replace it at the start of your next turn.
export const krumzImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_330_krumz",
  lifecycle: {
    on_rez: [
      {
        kind: "add_hosted_credits",
        target: "source",
        amount: 1,
        visibility: "public",
      },
    ],
  },
  corpUtility: {
    kind: "krumz_trace_bit",
    amount: 1,
    refresh: "start_of_corp_turn_after_use",
    visibility: "public",
  },
};
