import type { CardImplementationDefinition } from "../../../types";

const sterdroidAbility = {
  kind: "activated",
  costs: [
    { kind: "credit", amount: 3 },
    { kind: "tap_source", amount: 1 },
  ],
  effects: [
    {
      kind: "double_chosen_ice_strength_until_end_of_turn",
      target: "chosen_installed_ice",
      maxStrength: 10,
      visibility: "public",
    },
  ],
  label: "Sterdroid: ICE-Stärke verdoppeln",
} as const;

// card name: Sterdroid
// text: [3], [T]: Choose a piece of ice. That ice's strength is doubled until end of turn, capped at 10.
export const classicSterdroidImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_024_sterdroid",
  abilities: [
    {
      ...sterdroidAbility,
      timing: "corp_main",
    },
    {
      ...sterdroidAbility,
      timing: "corp_during_run",
    },
  ],
};
