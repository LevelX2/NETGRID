import type { CardImplementationDefinition } from "../../../types";

// card name: Preying Mantis
// text: Each of your turns, you may choose to gain an action. If you do, suffer 1 brain damage at the end of the turn. This damage cannot be prevented.
export const preyingMantisImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_171_preying-mantis",
  runnerUtilityLongtail: {
    kind: "optional_extra_action_with_delayed_damage",
    extraActions: 1,
    damageType: "core",
    damageAmount: 1,
    damageTiming: "end_of_turn",
    preventable: false,
    limit: "once_per_turn_per_source",
    visibility: "public",
  },
};
