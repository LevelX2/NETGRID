import type { CardImplementationDefinition } from "../../../types";

// card name: Falsified-Transactions Expert
// text: Move up to three advancement counters from one card to another installed card that can be advanced.
export const falsifiedTransactionsExpertImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_291_falsified-transactions-expert",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "move_advancement_counters",
          source: "chosen_card",
          target: "chosen_installed_advanceable_card",
          maxAmount: 3,
          visibility: "public",
        },
      ],
    },
  ],
};
