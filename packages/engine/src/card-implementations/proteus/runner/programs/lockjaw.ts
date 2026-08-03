import type { CardImplementationDefinition } from "../../../types";

// card name: Lockjaw
// text: Trash Lockjaw: Choose one of your installed icebreakers. That icebreaker gets +2 strength for the remainder of the run.
export const proteusLockjawImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_091_lockjaw",
  runnerRunStrengthBoost: {
    timing: "during_ice_encounter",
    cost: { trashSelf: true },
    target: "installed_runner_icebreaker",
    amount: 2,
    duration: "current_run",
    visibility: "public",
  },
};
