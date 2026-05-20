import type { CardImplementationDefinition } from "../../../types";

// card name: Artificial Security Directors
// text: Difficulty of Black Ops agendas is reduced by 1.
export const artificialSecurityDirectorsImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_v1_189_artificial-security-directors",
    modifiers: [
      {
        kind: "agenda_difficulty",
        operation: "reduce",
        amount: 1,
        activeWhile: "scored",
        sourceZone: "corp_scored_agenda",
        side: "corp",
        visibility: "public",
        appliesTo: { cardType: "agenda", subtype: "black_ops" },
      },
    ],
  };
