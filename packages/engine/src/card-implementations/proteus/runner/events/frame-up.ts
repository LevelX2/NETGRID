import type { CardImplementationDefinition } from "../../../types";

// card name: Frame-Up
// text: Play only if you made a successful run on both HQ and R&D this turn. Give the Corp 1 Bad Publicity point. Give the Corp 1 additional Bad Publicity point if you liberated or trashed any Black Ops cards during those runs.
export const proteusFrameUpImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_109_frame-up",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: { kind: "runner_made_successful_hq_and_rd_runs_this_turn" },
      effects: [
        {
          kind: "add_bad_publicity_from_frame_up_history",
          baseAmount: 1,
          additionalAmount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
