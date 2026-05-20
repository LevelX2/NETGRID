import type { CardImplementationDefinition } from "../../../types";

// card name: Black Ice Quality Assurance
// text: All black ice has +2 strength.
export const blackIceQualityAssuranceImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_v1_191_black-ice-quality-assurance",
    modifiers: [
      {
        kind: "ice_strength",
        operation: "increase",
        amount: 2,
        activeWhile: "scored",
        sourceZone: "corp_scored_agenda",
        visibility: "public",
        appliesTo: {
          side: "corp",
          cardType: "ice",
          subtype: "black_ice",
        },
      },
    ],
  };
