import type { CardImplementationDefinition } from "../../../types";

export const v08CashoutAssetImplementation: CardImplementationDefinition = {
  cardDefinitionId: "v08_cashout_asset",
  corpRootRezCreditOutcome: {
    timing: "after_runner_rez_interrupt_window",
    effect: {
      kind: "gain_credits",
      recipient: "corp",
      amount: 4,
      visibility: "public",
    },
  },
};
