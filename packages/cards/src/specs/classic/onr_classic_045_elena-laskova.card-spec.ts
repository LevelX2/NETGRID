import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_045_elena-laskova"),
    title: "Elena Laskova",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Whenever you play a prep, gain an additional [1] the first time you gain bits from its effect. Only one unique card of a particular name can be in play at a time. If for some reason more than one is in play, trash all but one.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_045_elena-laskova",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["connection", "unique"],
      numeric: {
        installCost: 3,
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
    unique: {
      kind: "unique_by_title",
      controller: "runner",
    },
    runnerUtilityLongtail: {
      capabilityKey: capabilityKey("first_prep_credit_gain_bonus"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "first_prep_credit_gain_bonus",
      amount: 1,
      limit: "once_per_prep",
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "find_economy",
      },
      {
        kind: "strategic_role",
        role: "support_tool",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_045_elena-laskova.",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_045_elena-laskova.",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "low",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_045_elena-laskova.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_045_elena-laskova",
      setId: "classic",
      collectorNumber: "C045",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
