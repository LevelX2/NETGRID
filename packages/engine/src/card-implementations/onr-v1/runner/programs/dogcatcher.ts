import type { CardImplementationDefinition } from "../../../types";

// card name: Dogcatcher
// text: [1]: Break pit bull, hellhound, bloodhound, or watchdog subroutine. [1]: +1 strength.
export const dogcatcherImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_018_dogcatcher",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: {
        kind: "ice_subtype_any_of",
        subtypes: ["pit_bull", "hellhound", "bloodhound", "watchdog"],
      },
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
