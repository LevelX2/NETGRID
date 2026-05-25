import type { CardImplementationDefinition } from "../../../types";

// card name: Walking Wall
// text: *End the run. [1]: Move Walking Wall and insert it in a different position on this data fort. Use this ability only at the start of a run on this data fort. You may use this ability even if Walking Wall is unrezzed, in which case, you reveal it.
export const proteusWalkingWallImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_044_walking-wall",
  printedSubroutines: [{ kind: "end_the_run", text: "*End the run." }],
  fortRunWindows: [
    {
      kind: "move_self_to_different_position_on_same_fort",
      timing: "start_of_run_on_this_fort",
      cost: { kind: "credit", amount: 1 },
      target: "different_position_on_same_fort",
      revealIfUnrezzed: true,
      limit: "once_per_run_per_source",
      visibility: "public",
    },
  ],
};
