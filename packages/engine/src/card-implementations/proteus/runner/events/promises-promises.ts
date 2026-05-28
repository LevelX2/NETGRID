import type { CardImplementationDefinition } from "../../../types";

export const promisesPromisesImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_119_promises-promises",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "mark_next_agenda_access_agenda_point",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
