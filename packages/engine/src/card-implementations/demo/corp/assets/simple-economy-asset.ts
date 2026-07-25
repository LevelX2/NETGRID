import type { CardImplementationDefinition } from "../../../types";

export const simpleEconomyAssetImplementation: CardImplementationDefinition = {
  cardDefinitionId: "simple_economy_asset",
  corpRootRezCreditOutcome: {
    timing: "after_runner_rez_interrupt_window",
    effect: {
      kind: "gain_credits",
      recipient: "corp",
      amount: 3,
      visibility: "public",
    },
  },
};
