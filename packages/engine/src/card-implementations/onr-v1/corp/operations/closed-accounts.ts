import type { CardImplementationDefinition } from "../../../types";

// card name: Closed Accounts
// text: Play only if Runner is tagged. Runner loses all bits.
export const closedAccountsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_285_closed-accounts",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: { kind: "runner_is_tagged" },
      effects: [
        {
          kind: "lose_credits",
          recipient: "runner",
          mode: "all",
          visibility: "public",
        },
      ],
    },
  ],
};
