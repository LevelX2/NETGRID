import type { CardImplementationDefinition } from "../../../types";

// card name: Weefle Initiation
// text: Make a run. Prevent up to 7 damage during that run.
export const proteusWeefleInitiationImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_127_weefle-initiation",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "chosen_server" },
          damagePreventionPool: 7,
          visibility: "public",
        },
      ],
    },
  ],
};
