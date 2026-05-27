import type { CardImplementationDefinition } from "../../../types";

// card name: Black Widow
// text: Choose a piece of ice when you install Black Widow. Black Widow gets +5 strength during encounters with that ice. [1]: Break sentry subroutine. [2]: +1 strength.
export const proteusBlackWidowImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_080_black-widow",
  installTargetBinding: {
    kind: "choose_installed_ice_on_install",
    stores: "selectedCardId",
    visibility: "public",
  },
  icebreakerEncounterStrengthBonus: {
    kind: "against_selected_installed_ice",
    amount: 5,
    visibility: "public",
  },
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "ice_subtype", subtype: "sentry" },
      visibility: "public",
    },
    {
      kind: "increase_strength",
      cost: { kind: "credit", amount: 2 },
      amount: 1,
      duration: "current_encounter",
      visibility: "public",
    },
  ],
};
