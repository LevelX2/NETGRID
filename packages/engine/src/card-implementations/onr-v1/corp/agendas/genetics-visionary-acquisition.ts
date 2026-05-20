import type { CardImplementationDefinition } from "../../../types";

// card name: Genetics-Visionary Acquisition
// text: Difficulty of Research agendas is reduced by 1.
export const geneticsVisionaryAcquisitionImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_v1_202_genetics-visionary-acquisition",
    modifiers: [
      {
        kind: "agenda_difficulty",
        operation: "reduce",
        amount: 1,
        activeWhile: "scored",
        sourceZone: "corp_scored_agenda",
        side: "corp",
        visibility: "public",
        appliesTo: { cardType: "agenda", subtype: "research" },
      },
    ],
  };
