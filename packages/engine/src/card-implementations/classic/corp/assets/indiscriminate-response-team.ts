import type { CardImplementationDefinition } from "../../../types";

// card name: Indiscriminate Response Team
// text: After Runner makes a successful run, you may have Runner shuffle his or her hand into his or her stack and then draw as many cards as he or she had before.
export const classicIndiscriminateResponseTeamImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_classic_019_indiscriminate-response-team",
    successfulRunFollowups: [
      {
        kind: "corp_optional_shuffle_runner_grip_into_stack_then_draw_same_count",
        timing: "after_successful_run",
        cost: "none",
        visibility: "hidden_info_barrier",
      },
    ],
  };
