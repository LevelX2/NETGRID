import { cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("simple_upgrade"),
    title: "Simple Upgrade",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Einfache Root-Karte ohne aktive Fähigkeit.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "simple_upgrade",
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
        rezCost: 0,
        trashCost: 4,
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
    card: [
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
        rationale: "Migrated from reviewed Testset hint simple_upgrade.",
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "simple_upgrade",
      setId: "testset",
      collectorNumber: "024",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
