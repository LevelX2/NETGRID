import { cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("corp_identity_001"),
    title: "Korp",
    side: "corp",
    cardType: "identity",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Technische Seitenidentität ohne aktive Fähigkeit.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "project_ruling",
        reference: "system.corp_identity",
        note: "Das Originalset besitzt keine eigene Identitätskarte; die Engine benötigt eine neutrale Seitenidentität.",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "system",
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
      setId: "system",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
