import type { CardImplementationDefinition } from "../../../types";

// card name: All-Nighter
// text: Make a run; whether or not that run is successful, you may then make another run.
export const allNighterImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_076_all-nighter",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "chosen_server" },
          followupRunOnEnd: "optional",
          visibility: "public",
        },
      ],
    },
  ],
};
