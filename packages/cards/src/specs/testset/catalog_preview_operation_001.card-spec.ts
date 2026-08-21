import { cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("catalog_preview_operation_001"),
    title: "Catalog Preview Operation",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Fiktive Katalogkarte für Importtests. Nicht implementiert und nicht decklegal.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "catalog_preview_operation_001",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "neutral_demo",
      subtypes: [],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: {
        kind: "fixed",
        credits: 2,
      },
      strength: {
        kind: "not_applicable",
      },
    },
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "catalog_preview_operation_001",
      setId: "testset",
      collectorNumber: "001",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "experimental",
  },
} satisfies CardSpec;
