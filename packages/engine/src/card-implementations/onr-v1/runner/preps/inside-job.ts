import type { CardImplementationDefinition } from "../../../types";

// card name: Inside Job
// text: Make a run. You automatically pass the first piece of ice you encounter during that run.
export const insideJobImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_094_inside-job",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "chosen_server" },
          bypassFirstIce: true,
          visibility: "public",
        },
      ],
    },
  ],
};
