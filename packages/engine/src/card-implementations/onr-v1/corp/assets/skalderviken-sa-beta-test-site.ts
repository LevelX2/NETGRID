import type { CardImplementationDefinition } from "../../../types";

export const skaldervikenSaBetaTestSiteImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_v1_341_skalderviken-sa-beta-test-site",
    modifiers: [
      {
        kind: "rez_cost",
        operation: "reduce",
        amount: 2,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
        appliesTo: { cardType: "ice", subtype: "black_ice" },
      },
    ],
  };
