import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_002_superserum"),
    title: "Superserum",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "When you score Superserum, remove all Virus counters, and avoid receiving the next two Virus counters Runner gives to you.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_002_superserum",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["research"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 3,
        agendaPoints: 2,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    scoredAgenda: {
      capabilityKey: capabilityKey("on_score_purge_virus_and_prevent_next"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "purge_runner_virus_counters_and_prevent_next",
      preventCount: 2,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "strategic_role",
        role: "defensive_tool",
      },
      {
        kind: "line_support",
        lineKey: "corp.central_stabilize",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.central_stabilize",
        role: "defensive_tool",
        roleDetail: "virus_counter_defense",
        confidence: "medium",
        rationale:
          "Agenda Semantic Review v1 maps Superserum to corp.central_stabilize as defensive_tool/virus_counter_defense.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_002_superserum",
      setId: "classic",
      collectorNumber: "C002",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
