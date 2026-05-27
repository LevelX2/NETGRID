import type { CardImplementationDefinition } from "../../../types";

// card name: Decoy Signal
// text: Make a run. Whenever you approach an unrezzed piece of ice during that run, expose it. You may jack out before the Corp decides whether to rez the ice.
export const proteusDecoySignalImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_104_decoy-signal",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "chosen_server" },
          eventApproachIceExposeBeforeRez: true,
          visibility: "public",
        },
      ],
    },
  ],
};
