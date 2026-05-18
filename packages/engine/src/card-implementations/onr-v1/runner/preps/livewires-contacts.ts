import type { CardImplementationDefinition } from "../../../types";

// card name: Livewire's Contacts
// text: Gain [3].
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
