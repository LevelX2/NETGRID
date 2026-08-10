import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_215_security-net-optimization"),
    title: "Security Net Optimization",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Choose a fort when scored. Ice installed on that fort gets +1 strength.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_215_security-net-optimization",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["gray-ops"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 5,
        agendaPoints: 3,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    scoredAgenda: {
      capabilityKey: capabilityKey(
        "scored_agenda_choose_fort_ice_strength_bonus",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "choose_fort_ice_strength_bonus",
      amount: 1,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
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
        role: "protect_rnd",
      },
      {
        kind: "strategic_role",
        role: "tax_tool",
      },
      {
        kind: "strategic_role",
        role: "defensive_tool",
      },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      {
        kind: "line_support",
        lineKey: "corp.remote_scoring",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "fort_tax_anchor",
        confidence: "high",
        rationale:
          "Agenda Semantic Review v1 maps Security Net Optimization to corp.ice_tax_glacier as tax_tool/fort_tax_anchor.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.remote_scoring",
        role: "defensive_tool",
        roleDetail: "remote_defense_anchor",
        confidence: "medium",
        rationale:
          "Agenda Semantic Review v1 maps Security Net Optimization to corp.remote_scoring as defensive_tool/remote_defense_anchor.",
      },
      {
        kind: "target_preference",
        purpose: "strengthen_ice_on_most_relevant_fort",
        preferences: [
          "protects_agenda_remote",
          "protects_central_access_pressure",
        ],
        avoid: ["hidden_info_dependent_choice"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_215_security-net-optimization",
      setId: "originalset-v1",
      collectorNumber: "215",
      rarity: "vital",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
