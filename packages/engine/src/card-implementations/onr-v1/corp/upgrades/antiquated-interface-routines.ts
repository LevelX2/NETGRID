import type { CardImplementationDefinition } from "../../../types";

// card name: Antiquated Interface Routines
// text: All ice on this fort has +1 strength.
export const antiquatedInterfaceRoutinesImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_v1_350_antiquated-interface-routines",
    modifiers: [
      {
        kind: "ice_strength",
        operation: "increase",
        amount: 1,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
        appliesTo: {
          side: "corp",
          cardType: "ice",
          sameServerAsSource: true,
        },
      },
    ],
  };
