import type { CardImplementationDefinition } from "../../../types";

// card name: Microtech 'Trode Set
// text: Pay [1], in addition to the normal cost, to break each ice subroutine. Ignore all AP subroutines except those that trace, or that do Net damage. Prevents all but 1 Net damage from each AP subroutine you do not break.
export const microtechTrodeSetImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_132_microtech-trode-set",
  runnerUtilityLongtail: {
    kind: "access_point_subroutine_modifier",
    visibility: "public",
  },
};
