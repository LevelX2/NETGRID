import type { CardImplementationDefinition } from "../types";

export const dataMasonsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_317_data-masons",
  modifiers: [
    {
      kind: "rez_cost",
      operation: "reduce",
      amount: 2,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      visibility: "public",
      appliesTo: { cardType: "ice", subtype: "wall" },
    },
  ],
};

export const encoderIncImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_320_encoder-inc",
  modifiers: [
    {
      kind: "rez_cost",
      operation: "reduce",
      amount: 2,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      visibility: "public",
      appliesTo: { cardType: "ice", subtype: "code_gate" },
    },
  ],
};

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

export const fortressArchitectsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_324_fortress-architects",
  modifiers: [
    {
      kind: "rez_cost",
      operation: "reduce",
      amount: 1,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      visibility: "public",
      appliesTo: { cardType: "ice" },
    },
  ],
};

export const jerusalemCityGridImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_360_jerusalem-city-grid",
  modifiers: [
    {
      kind: "rez_cost",
      operation: "reduce",
      amount: 9,
      activeWhile: "rezzed",
      sourceZone: "corp_root",
      visibility: "public",
      appliesTo: {
        cardType: "ice",
        subtype: "wall",
        sameServerAsSource: true,
      },
    },
  ],
};

export const onrV1RezCostModifierImplementations = [
  dataMasonsImplementation,
  encoderIncImplementation,
  skaldervikenSaBetaTestSiteImplementation,
  fortressArchitectsImplementation,
  jerusalemCityGridImplementation,
] as const satisfies readonly CardImplementationDefinition[];
