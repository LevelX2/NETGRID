import type { CardImplementationDefinition } from "../../../types";

// card name: Self-Modifying Code
// text: [T]: Search your stack for a program and install that program, if you can. Shuffle your stack afterwards. Use this ability only during a run.
export const selfModifyingCodeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_059_self-modifying-code",
  abilities: [
    {
      kind: "activated",
      timing: "during_run",
      costs: [],
      label: "Self-Modifying Code: Programm aus Stack installieren",
      effects: [
        {
          kind: "trash_source",
          visibility: "public",
        },
        {
          kind: "search_stack_install",
          filter: "program",
          installCost: "normal",
          shuffleAfterwards: true,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
