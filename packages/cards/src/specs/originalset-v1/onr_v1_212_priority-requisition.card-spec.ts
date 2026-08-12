import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_212_priority-requisition"),
    title: "Priority Requisition",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "You may rez a piece of ice, at no cost, when you score Priority Requisition.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_212_priority-requisition",
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
        "scored_agenda_score_rez_installed_ice_at_no_cost",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "score_rez_installed_ice_at_no_cost",
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
        role: "rez_expensive_ice_after_score",
      },
      {
        kind: "strategic_role",
        role: "payoff_anchor",
      },
      {
        kind: "strategic_role",
        role: "scoring_tool",
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
        role: "payoff_anchor",
        roleDetail: "free_rez_ice_payoff",
        confidence: "high",
        rationale:
          "Agenda Semantic Review v1 maps Priority Requisition to corp.ice_tax_glacier as payoff_anchor/free_rez_ice_payoff.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.remote_scoring",
        role: "scoring_tool",
        roleDetail: "free_rez_remote_defense",
        confidence: "medium",
        rationale:
          "Agenda Semantic Review v1 maps Priority Requisition to corp.remote_scoring as scoring_tool/free_rez_remote_defense.",
      },
      {
        kind: "target_preference",
        purpose: "rez_best_defensive_ice",
        preferences: [
          "high_rez_cost_relief",
          "blocks_relevant_run_path",
          "protects_agenda_remote",
        ],
        avoid: ["hidden_info_dependent_choice"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_212_priority-requisition",
      setId: "originalset-v1",
      collectorNumber: "212",
      rarity: "vital",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
