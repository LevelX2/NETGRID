import type { CardImplementationDefinition } from "../../../types";

export const pirateBroadcastImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_116_pirate-broadcast",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run_each_data_fort_sequence",
          onAllSuccessful: "gain_runner_event_agenda_point",
          onAnyUnsuccessful: "forgo_next_action",
          visibility: "public",
        },
      ],
    },
  ],
};
