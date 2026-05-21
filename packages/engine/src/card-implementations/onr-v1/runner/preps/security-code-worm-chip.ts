import type { CardImplementationDefinition } from "../../../types";

// card name: Security Code WORM Chip
// text: Play only if you made a successful run on HQ this turn. Trash a piece of unrezzed ice.
export const securityCodeWormChipImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_109_security-code-worm-chip",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: {
        kind: "runner_made_successful_run_on_server_this_turn",
        server: "hq",
      },
      effects: [
        {
          kind: "trash_unrezzed_ice",
          target: "chosen_unrezzed_ice",
          visibility: "public",
        },
      ],
    },
  ],
};
