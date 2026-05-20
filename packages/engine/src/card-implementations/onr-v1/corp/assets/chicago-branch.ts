import type { CardImplementationDefinition } from "../../../types";

// card name: Chicago Branch
// text: A, [3]: Add two advancement counters to an installed card that can be advanced.
export const chicagoBranchImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_312_chicago-branch",
  abilities: [
    {
      kind: "activated",
      timing: "corp_main",
      costs: [
        { kind: "action", amount: 1 },
        { kind: "credit", amount: 3 },
      ],
      label: "Chicago Branch: 2 Advancement-Counter legen",
      effects: [
        {
          kind: "distribute_advancement_counters",
          amount: 2,
          target: "installed_advanceable_cards",
          distribution: "single_target",
          visibility: "public",
        },
      ],
    },
  ],
};
