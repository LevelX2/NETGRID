import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_036_sandstorm"),
    title: "Sandstorm",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      'Sandstorm has one "*End the run" subroutine for every [2] you pay, above the rez cost, when you rez it.',
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_036_sandstorm",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["wall"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 4,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 4,
      },
    },
    variableRez: {
      capabilityKey: capabilityKey("rez_with_paid_end_run_subroutines"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "paid_end_the_run_subroutines",
      additionalCostPerSubroutine: 2,
      minSubroutines: 0,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "protect_hq",
      },
      {
        kind: "plan_role",
        role: "protect_rnd",
      },
      {
        kind: "plan_role",
        role: "protect_remote",
      },
      {
        kind: "strategic_role",
        role: "tax_tool",
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
        roleDetail: "rez_paid_scaling_ice",
        evidenceProfile: "rez_paid_scaling_ice",
        confidence: "medium",
        rationale:
          "ICE Semantic Review v1: Sandstorm bestätigt corp.ice_tax_glacier nur aus konkreten ICE-Funktionssignalen; Subtypen bleiben Kartendaten.",
      },
      {
        kind: "risk_interpretation",
        risk: "credit_reserve_cost",
        severity: "high",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("rez_with_paid_end_run_subroutines"),
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_paid_end_the_run_subroutine_count",
            preferences: [
              "high_run_denial_payoff",
              "prefer_option_relevant_to_current_run_path",
            ],
            avoid: [
              "insufficient_post_payment_reserve",
              "option_with_no_visible_current_payoff",
            ],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_036_sandstorm",
      setId: "proteus",
      collectorNumber: "P036",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
