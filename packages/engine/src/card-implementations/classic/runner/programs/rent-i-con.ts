import type { CardImplementationDefinition } from "../../../types";

// card name: Rent-I-Con
// text: [1]: Break ice subroutine. At the end of this run, trash Rent-I-Con. [1]: +1 strength.
export const classicRentIConImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_031_rent-i-con",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "any" },
      special: { kind: "run_end_trash_source_if_used" },
      visibility: "public",
    },
    {
      kind: "increase_strength",
      cost: { kind: "credit", amount: 1 },
      amount: 1,
      duration: "current_encounter",
      visibility: "public",
    },
  ],
};
