import type { CardImplementationDefinition } from "../../../types";

// card name: Blink
// text: [0]: Roll a die. On a 4, 5, or 6, break ice subroutine; otherwise, suffer that much Net damage. Use this ability only once on each subroutine during each encounter with a piece of ice.
export const blinkImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_007_blink",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 0 },
      matches: { kind: "any" },
      special: { kind: "blink_random_break_or_net_damage" },
      visibility: "public",
    },
  ],
};
