import type { CardImplementationDefinition } from "../../../types";

// card name: Remote Detonator
// text: Play only if you made a successful run on a data fort this turn. Trash all rezzed ice on that fort, and the Corp gives you three tags.
export const proteusRemoteDetonatorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_121_remote-detonator",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: {
        kind: "runner_made_successful_run_on_server_this_turn",
        server: "any_data_fort",
      },
      effects: [
        {
          kind: "trash_rezzed_ice_on_last_successful_run_fort_and_add_tags",
          tagAmount: 3,
          visibility: "public",
        },
      ],
    },
  ],
};
