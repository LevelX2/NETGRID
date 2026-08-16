import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_024_sterdroid"),
    title: "Sterdroid",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[3], [T]: Choose a piece of ice. That ice's strength is doubled until end of turn. If this would raise the ice's strength above 10, its strength becomes 10.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("corp_main_double_chosen_ice_strength"),
        actionLabel: "Sterdroid: ICE-Stärke verdoppeln",
      },
      {
        capabilityKey: capabilityKey("during_run_double_chosen_ice_strength"),
        actionLabel: "Sterdroid: ICE-Stärke verdoppeln",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_024_sterdroid",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: [],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: 0,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey("corp_main_double_chosen_ice_strength"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        costs: [
          {
            kind: "credit",
            amount: 3,
          },
          {
            kind: "trash_source",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "double_chosen_ice_strength_until_end_of_turn",
            target: "chosen_installed_ice",
            maxStrength: 10,
            visibility: "public",
          },
        ],
        timing: "corp_main",
      },
      {
        capabilityKey: capabilityKey("during_run_double_chosen_ice_strength"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        costs: [
          {
            kind: "credit",
            amount: 3,
          },
          {
            kind: "trash_source",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "double_chosen_ice_strength_until_end_of_turn",
            target: "chosen_installed_ice",
            maxStrength: 10,
            visibility: "public",
          },
        ],
        timing: "corp_during_run",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "build_scoring_remote",
      },
      {
        kind: "plan_role",
        role: "protect_hq",
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
        roleDetail: "targeted_ice_strength_burst",
        confidence: "medium",
        rationale:
          "Temporary targeted strength boost can increase break cost on a key ICE, but it is not inherently remote-scoring protection.",
      },
      {
        kind: "tactic_interpretation",
        signal: "corp.remote_protection",
        use: "corp.remote_protection",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "high",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "medium",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("corp_main_double_chosen_ice_strength"),
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_ice_for_one_shot_strength_double",
            preferences: [
              "maximize_effective_strength_gain_below_cap_ten",
              "exploit_visible_breaker_coverage_and_runner_credit_gap",
              "protect_current_high_value_server",
            ],
            avoid: ["irrelevant_server_ice", "strength_already_at_cap_ten"],
          },
        ],
      },
      {
        capabilityKey: capabilityKey("during_run_double_chosen_ice_strength"),
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_current_run_ice_for_one_shot_strength_double",
            preferences: [
              "current_run_path_relevance",
              "maximize_effective_strength_gain_below_cap_ten",
              "exploit_visible_breaker_coverage_and_runner_credit_gap",
            ],
            avoid: ["irrelevant_server_ice", "strength_already_at_cap_ten"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_024_sterdroid",
      setId: "classic",
      collectorNumber: "C024",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
