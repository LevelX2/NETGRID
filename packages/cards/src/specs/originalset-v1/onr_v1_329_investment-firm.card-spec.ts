import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_329_investment-firm"),
    title: "Investment Firm",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Take [1] from Investment Firm, if it has any bits, at the start of each of your turns. Whenever [1] or more bits are added to your pool, you may put [2] from the bank on Investment Firm for each [1] you choose not to add to your pool. Effects that give you bits at the start of your turn cannot be used this way.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_329_investment-firm",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["transactions"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 1,
        trashCost: 2,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    remainingReplacementLongtail: {
      capabilityKey: capabilityKey(
        "remaining_replacement_longtail_basic_credit_diversion_to_recurring_credits",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "basic_credit_diversion_to_recurring_credits",
      counterType: "recurring_credit",
      hostedCreditsPerDivertedCredit: 2,
      startTurnTakeCredits: 1,
      excludeStartTurnCreditGains: true,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "remote_asset_economy",
      },
      {
        kind: "strategic_role",
        role: "engine_anchor",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.asset_economy",
      },
      {
        kind: "line_support",
        lineKey: "corp.asset_economy",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.asset_economy",
        role: "engine_anchor",
        roleDetail: "installed_economy_engine",
        confidence: "medium",
        rationale:
          "Banked installed economy supports asset economy; Transactions remains card data. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "remote_role",
        role: "asset_economy",
        threatLevel: "medium",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "medium",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "medium",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_329_investment-firm",
      setId: "originalset-v1",
      collectorNumber: "329",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
