import type { CardImplementationDefinition } from "../../../types";

// card name: Government Contract
// text: You may advance Government Contract before and after you rez it. Government Contract advancement counter: Gain [3]. Use these bits only to pay for installing or rezzing cards. When the turn ends, return to the bank any of the [3] you did not spend.
export const proteusGovernmentContractImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_059_government-contract",
  advanceable: {
    while: "installed_before_and_after_rez",
  },
  abilities: [
    {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "advancement_counter", amount: 1, source: "source" }],
      condition: { kind: "source_has_advancement_counters", minimum: 1 },
      effects: [
        {
          kind: "gain_temporary_corp_credits",
          recipient: "corp",
          amount: 3,
          usableFor: "install_or_rez",
          cleanup: "end_of_turn",
          visibility: "public",
        },
      ],
    },
  ],
};
