import type { CardImplementationDefinition } from "../../../types";

// card name: Preying Mantis
// text: Each of your turns, you may choose to gain an action. If you do, suffer 1 brain damage at the end of the turn. This damage cannot be prevented.
export const preyingMantisImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_171_preying-mantis",
  runnerUtilityLongtail: {
    kind: "preying_mantis_optional_action_unpreventable_core_damage",
    visibility: "public",
  },
};
