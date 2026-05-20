import type { CardImplementationDefinition } from "../../../types";

// card name: Vapor Ops
// text: You may advance Vapor Ops before and after you rez it. Vapor Ops advancement Counter: Gain [1]. A: Move any number of advancement counters from Vapor Ops to another installed card that can be advanced.
export const vaporOpsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_347_vapor-ops",
  advanceable: { while: "installed_before_and_after_rez" },
  abilities: [
    {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "advancement_counter", amount: 1, source: "source" }],
      condition: { kind: "source_has_advancement_counters", minimum: 1 },
      label: "Vapor Ops: Advancement-Counter fuer 1 Credit ausgeben",
      effects: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 1,
          visibility: "public",
        },
      ],
    },
    {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      condition: { kind: "source_has_advancement_counters", minimum: 1 },
      label: "Vapor Ops: Advancement-Counter bewegen",
      effects: [
        {
          kind: "move_advancement_counters",
          source: "source_card",
          target: "chosen_installed_advanceable_card",
          maxAmount: "all",
          visibility: "public",
        },
      ],
    },
  ],
};
