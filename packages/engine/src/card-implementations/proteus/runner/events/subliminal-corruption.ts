import type { CardImplementationDefinition } from "../../../types";

// card name: Subliminal Corruption
// text: Make a run. Give the Corp 1 Bad Publicity point for each advertisement you trash during the run.
export const proteusSubliminalCorruptionImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_125_subliminal-corruption",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "chosen_server" },
          badPublicityRunAftermath: "subliminal_corruption",
          visibility: "public",
        },
      ],
    },
  ],
};
