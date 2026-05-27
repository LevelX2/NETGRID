import type { CardImplementationDefinition } from "../../../types";

// card name: Reconnaissance
// text: Make a run. Whenever the Corp rezzes a card during that run, gain [1].
export const proteusReconnaissanceImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_120_reconnaissance",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "chosen_server" },
          runnerCreditGainOnCorpRez: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
