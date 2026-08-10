import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_219_superior-net-barriers"),
    title: "Superior Net Barriers",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "All walls have +1 strength. When you score Superior Net Barriers, reveal as many walls as you wish. Then, gain 1 for each revealed or rezzed wall.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_219_superior-net-barriers",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["research"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 6,
        agendaPoints: 3,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    modifiers: [
      {
        kind: "ice_strength",
        operation: "increase",
        amount: 1,
        activeWhile: "scored",
        sourceZone: "corp_scored_agenda",
        visibility: "public",
        appliesTo: {
          side: "corp",
          cardType: "ice",
          subtype: "wall",
        },
      },
    ],
    scoredAgenda: {
      capabilityKey: capabilityKey(
        "scored_agenda_reveal_installed_ice_subtype_for_credits",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "reveal_installed_ice_subtype_for_credits",
      subtype: "wall",
      creditPerRevealedOrRezzed: 1,
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "score_now",
      },
      {
        kind: "plan_role",
        role: "score_next_turn",
      },
      {
        kind: "plan_role",
        role: "build_scoring_remote",
      },
      {
        kind: "plan_role",
        role: "wall_remote_plan",
      },
      {
        kind: "strategic_role",
        role: "tax_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.ice_tax_glacier",
      },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "wall_tax_anchor",
        confidence: "high",
        rationale:
          "Agenda Semantic Review v1 maps Superior Net Barriers to corp.ice_tax_glacier as tax_tool/wall_tax_anchor.",
      },
      {
        kind: "tactic_interpretation",
        signal: "corp.remote_protection",
        use: "corp.remote_protection",
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
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_219_superior-net-barriers",
      setId: "originalset-v1",
      collectorNumber: "219",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
