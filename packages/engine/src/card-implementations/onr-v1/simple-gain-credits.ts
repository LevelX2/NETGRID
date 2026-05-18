import type { CardImplementationDefinition } from "../types";

export const livewiresContactsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_097_livewires-contacts",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 3,
          visibility: "public",
        },
      ],
    },
  ],
};

export const scoreImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_108_score",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 9,
          visibility: "public",
        },
      ],
    },
  ],
};

export const accountsReceivableImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_281_accounts-receivable",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 9,
          visibility: "public",
        },
      ],
    },
  ],
};

export const efficiencyExpertsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_290_efficiency-experts",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 3,
          visibility: "public",
        },
      ],
    },
  ],
};

export const onrV1SimpleGainCreditsImplementations = [
  livewiresContactsImplementation,
  scoreImplementation,
  accountsReceivableImplementation,
  efficiencyExpertsImplementation,
] as const satisfies readonly CardImplementationDefinition[];
