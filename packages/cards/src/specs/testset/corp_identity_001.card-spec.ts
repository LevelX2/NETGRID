import { cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("corp_identity_001"),
    title: "Corp Identity",
    side: "corp",
    cardType: "identity",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Testidentität ohne aktive Fähigkeit.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "corp_identity_001",
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
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "corp_identity_001",
      setId: "testset",
      collectorNumber: "003",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
