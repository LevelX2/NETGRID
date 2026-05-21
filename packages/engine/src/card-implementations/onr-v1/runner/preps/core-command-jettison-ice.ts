import type { CardImplementationDefinition } from "../../../types";

// card name: Core Command: Jettison Ice
// text: Play only if you made a successful run on HQ this turn. Pay the rez cost of a piece of rezzed ice to trash it.
export const coreCommandJettisonIceImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_080_core-command-jettison-ice",
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
          kind: "pay_rez_cost_to_trash_rezzed_ice",
          target: "chosen_rezzed_ice",
          visibility: "public",
        },
      ],
    },
  ],
};
