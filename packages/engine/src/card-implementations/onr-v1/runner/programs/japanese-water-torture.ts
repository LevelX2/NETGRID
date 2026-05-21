import type { CardImplementationDefinition } from "../../../types";

// card name: Japanese Water Torture
// text: [0]: Break wall subroutine. [X]: +X strength, and forgo your next X actions.
export const japaneseWaterTortureImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_037_japanese-water-torture",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 0 },
      matches: { kind: "ice_subtype", subtype: "wall" },
      visibility: "public",
    },
    {
      kind: "increase_strength",
      cost: { kind: "credit", amount: 1 },
      amount: 1,
      variableAmount: { kind: "paid_amount", min: 1 },
      duration: "current_encounter",
      visibility: "public",
    },
  ],
};
