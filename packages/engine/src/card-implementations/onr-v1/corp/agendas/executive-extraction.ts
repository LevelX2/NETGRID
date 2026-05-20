import type { CardImplementationDefinition } from "../../../types";

// card name: Executive Extraction
// text: Difficulty of Gray Ops agendas is reduced by 1.
export const executiveExtractionImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_201_executive-extraction",
  modifiers: [
    {
      kind: "agenda_difficulty",
      operation: "reduce",
      amount: 1,
      activeWhile: "scored",
      sourceZone: "corp_scored_agenda",
      side: "corp",
      visibility: "public",
      appliesTo: { cardType: "agenda", subtype: "gray_ops" },
    },
  ],
};
