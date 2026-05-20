import type { CardImplementationDefinition } from "../../../types";

// card name: Information Laundering
// text: You may advance Information Laundering before and after you rez it. A, T: Gain [4] for each advancement counter on Information Laundering.
export const informationLaunderingImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_328_information-laundering",
  advanceable: { while: "installed_before_and_after_rez" },
  abilities: [
    {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      label: "Information Laundering: Credits nehmen und trashen",
      effects: [
        {
          kind: "gain_credits_per_advancement_counter_on_source",
          recipient: "controller",
          amountPerCounter: 4,
          visibility: "public",
        },
        {
          kind: "trash_source",
          visibility: "public",
        },
      ],
    },
  ],
};
