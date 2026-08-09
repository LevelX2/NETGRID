import { cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("catalog_preview_resource_001"),
    title: "Catalog Preview Resource",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Fiktive Katalogkarte mit absichtlich nicht unterstütztem Typ für Blocked-Status.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "catalog_preview_resource_001",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "neutral_demo",
      subtypes: [],
      numeric: {
        installCost: 1,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "catalog_preview_resource_001",
      setId: "testset",
      collectorNumber: "002",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "experimental",
    catalogBlockReason: "Intentionally blocked catalog-only test fixture.",
  },
} satisfies CardSpec;
