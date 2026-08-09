import { cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_317_data-masons"),
    title: "Data Masons",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Walls cost 2 less to rez and get +1 strength while Data Masons is rezzed.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [{ source: "card_text", reference: "onr_v1_317_data-masons" }],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 1,
        trashCost: 1,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: { kind: "not_applicable" },
    },
    modifiers: [
      {
        kind: "rez_cost",
        operation: "reduce",
        amount: 2,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
        appliesTo: { cardType: "ice", subtype: "wall" },
      },
      {
        kind: "ice_strength",
        operation: "increase",
        amount: 1,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
        appliesTo: { side: "corp", cardType: "ice", subtype: "wall" },
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      { kind: "strategy_anchor", strategyKey: "corp.economy_rez_reserve" },
      { kind: "strategy_anchor", strategyKey: "corp.ice_tax_glacier" },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      { kind: "strategic_role", role: "tax_tool" },
      { kind: "plan_role", role: "protect_rnd" },
      { kind: "plan_role", role: "protect_hq" },
      { kind: "plan_role", role: "bait_runner" },
      { kind: "remote_role", role: "ice_modifier", threatLevel: "medium" },
      {
        kind: "tactic_interpretation",
        signal: "corp.remote_protection",
        use: "corp.remote_protection",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "ice_tax_support",
        confidence: "high",
      },
      { kind: "value_interpretation", axis: "economy", rating: "medium" },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "medium",
      },
      {
        kind: "target_preference",
        purpose: "rez_best_defensive_ice",
        preferences: [
          "high_rez_cost_relief",
          "blocks_relevant_run_path",
          "protects_agenda_remote",
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_317_data-masons",
      setId: "originalset-v1",
      collectorNumber: "317",
      rarity: "rare",
    },
  ],
  publication: { schemaVersion: "card-publication-v1", status: "active" },
} satisfies CardSpec;
