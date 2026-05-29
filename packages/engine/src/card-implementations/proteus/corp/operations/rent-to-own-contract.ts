import type { CardImplementationDefinition } from "../../../types";

// card name: Rent-to-Own Contract
// text: Rez a piece of ice, at no cost. Put Term counters equal to its rez cost on it.
export const proteusRentToOwnContractImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_051_rent-to-own-contract",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "free_rez_installed_ice_with_counters",
          target: "chosen_installed_ice",
          counterType: "term",
          amount: { kind: "target_rez_cost" },
          lifecycle: "rent_to_own_start_corp_turn",
          visibility: "public",
        },
      ],
    },
  ],
};
