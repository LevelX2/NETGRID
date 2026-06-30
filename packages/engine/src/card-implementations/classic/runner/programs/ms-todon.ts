import type { CardImplementationDefinition } from "../../../types";

// card name: MS-todon
// text: [1]: Break sentry subroutine. [1]: +1 strength. The first time during each run that you break a sentry subroutine with MS-todon, lose all bits from all stealth cards, if you can, and the Corp gives you a tag.
export const classicMsTodonImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_029_ms-todon",
  icebreakerAbilities: [
    {
      kind: "break_subroutine",
      cost: { kind: "credit", amount: 1 },
      matches: { kind: "ice_subtype", subtype: "sentry" },
      special: { kind: "once_per_run_break_tag_and_all_stealth_loss" },
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
