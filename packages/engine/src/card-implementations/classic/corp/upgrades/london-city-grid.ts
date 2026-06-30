import type { CardImplementationDefinition } from "../../../types";

// card name: London City Grid
// text: Runner must pay [1], in addition to the normal cost, to use each subroutine of a noisy icebreaker during runs on this fort. Region baseline applies.
export const classicLondonCityGridImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_classic_020_london-city-grid",
    regionBaseline: {
      kind: "region_baseline",
      rezOnInstall: true,
      installOnlyIfRezAffordable: true,
      oneRegionPerFort: true,
      trashOlderRegions: true,
    },
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
        appliesToRunner: {
          cardType: "program",
          subtype: "noisy",
        },
        sameServerAsSource: true,
      },
    ],
  };
