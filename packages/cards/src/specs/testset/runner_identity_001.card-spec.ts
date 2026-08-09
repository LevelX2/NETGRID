import { cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("runner_identity_001"),
    title: "Runner Identity",
    side: "runner",
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
        reference: "runner_identity_001",
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
      baseLink: 0,
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "runner_identity_001",
      setId: "testset",
      collectorNumber: "005",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
