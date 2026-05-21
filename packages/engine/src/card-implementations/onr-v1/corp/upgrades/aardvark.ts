import type { CardImplementationDefinition } from "../../../types";

// card name: Aardvark
// text: Runner cannot use worms during runs on this fort. If Runner uses a worm during a run on this fort before Aardvark is rezzed, you may rez Aardvark to trash that worm, and any bits spent using that worm on the current piece of ice are lost to no effect. Runner may then use further icebreakers to break the ice.
export const aardvarkImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_349_aardvark",
  fortRunWindows: [
    {
      kind: "aardvark_worm_lock_and_reaction",
      timing: "during_run_on_this_fort",
      blocks: "runner_worm_icebreaker_use",
      reaction: "rez_to_trash_worm_and_cancel_current_use",
      visibility: "hidden_info_barrier",
    },
  ],
};
