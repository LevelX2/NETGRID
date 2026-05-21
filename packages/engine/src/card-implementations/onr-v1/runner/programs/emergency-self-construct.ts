import type { CardImplementationDefinition } from "../../../types";

// card name: Emergency Self-Construct
// text: [T]: Prevent yourself from being flatlined, though you still lose all cards in your hand. Remove all brain damage. For the remainder of the game, you have only three actions per turn, instead of four; your hand size is reduced by 1; and all meat damage is automatically prevented.
export const emergencySelfConstructImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_022_emergency-self-construct",
  flatlineReplacementSources: [
    {
      kind: "flatline_replacement_installed",
      replacement: "emergency_self_construct",
      cost: { kind: "trash_source" },
      visibility: "public",
    },
  ],
};
