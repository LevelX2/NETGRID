import type { CardImplementationDefinition } from "../../../types";

// card name: Prearranged Drop
// text: The next time you access an agenda this turn, gain [6].
export const proteusPrearrangedDropImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_118_prearranged-drop",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "mark_next_agenda_access_credit_gain",
          amount: 6,
          visibility: "public",
        },
      ],
    },
  ],
};
