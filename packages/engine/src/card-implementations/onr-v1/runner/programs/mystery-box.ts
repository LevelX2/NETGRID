import type { CardImplementationDefinition } from "../../../types";

// card name: Mystery Box
// text: [0]: Show the top five cards of your stack to the Corp. If any of those cards are programs, trash Mystery Box and then install one of those programs, at no cost. Shuffle your stack afterwards. Use this ability only during a run and only once each run.
export const mysteryBoxImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_043_mystery-box",
  abilities: [
    {
      kind: "activated",
      timing: "during_run",
      costs: [],
      label: "Mystery Box: Stack-Spitze zeigen",
      effects: [
        {
          kind: "look_top_stack_show_to_corp_then_install_matching",
          count: 5,
          allowedTypes: ["program"],
          installCost: "free",
          trashSourceIfInstalled: true,
          shuffleAfterwards: true,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
