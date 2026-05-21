import type { CardImplementationDefinition } from "../../../types";

// card name: Synchronized Attack on HQ
// text: Play only if you made a successful run on HQ this turn. The Corp discards all cards. The Corp can retain cards by paying [2] for each card not discarded.
export const synchronizedAttackOnHqImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_113_synchronized-attack-on-hq",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: {
        kind: "runner_made_successful_run_on_server_this_turn",
        server: "hq",
      },
      effects: [
        {
          kind: "corp_discard_hq_with_retain_payment",
          retainCostPerCard: 2,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
