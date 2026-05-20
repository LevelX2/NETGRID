import type { CardImplementationDefinition } from "../../../types";

// card name: Crystal Palace Station Grid
// text: Runner must pay [1], in addition to the normal cost, to break each subroutine of each piece of ice encountered during runs on this fort.
// text: Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.
export const crystalPalaceStationGridImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_v1_355_crystal-palace-station-grid",
    modifiers: [
      {
        kind: "break_subroutine_cost",
        operation: "increase",
        amount: 1,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        side: "corp",
        visibility: "public",
        appliesTo: {
          cardType: "ice",
        },
        sameServerAsSource: true,
      },
    ],
  };
