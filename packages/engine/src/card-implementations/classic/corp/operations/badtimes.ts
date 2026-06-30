import type { CardImplementationDefinition } from "../../../types";

// card name: Badtimes
// text: Play only if Runner is tagged. Runner's MU is reduced by 2 until end of turn.
export const classicBadtimesImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_016_badtimes",
  corpUtility: {
    kind: "runner_memory_limit_modifier_until_end_of_turn",
    operation: "reduce",
    amount: 2,
    condition: "runner_tagged",
    visibility: "public",
  },
};
