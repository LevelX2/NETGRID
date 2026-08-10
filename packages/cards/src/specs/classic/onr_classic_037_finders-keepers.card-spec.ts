import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_037_finders-keepers"),
    title: "Finders Keepers",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Roll three dice. Gain that many bits.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_037_finders-keepers",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["random"],
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
        credits: 7,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    runnerEventLongtail: {
      capabilityKey: capabilityKey("roll_three_dice_gain_credits"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "three_dice_gain_credits",
      dieFaces: 6,
      diceCount: 3,
      recipient: "runner",
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
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "very_high",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_037_finders-keepers.",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "low",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_037_finders-keepers.",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "low",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_037_finders-keepers.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_037_finders-keepers",
      setId: "classic",
      collectorNumber: "C037",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
