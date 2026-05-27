import type { CardImplementationDefinition } from "../../../types";

// card name: Underworld Mole
// text: Play only if Runner installed any resources during his or her last turn. Trace 4-If trace is successful, trash a resource Runner installed during his or her last turn and give Runner a tag.
export const proteusUnderworldMoleImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_053_underworld-mole",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: {
        kind: "runner_installed_resource_last_turn",
      },
      effects: [
        {
          kind: "trace",
          baseTraceStrength: 4,
          visibility: "public",
          onSuccess: [
            {
              kind: "trash_runner_resource_and_add_tag",
              target: "runner_resource_installed_last_turn",
              visibility: "public",
            },
          ],
        },
      ],
    },
  ],
};
