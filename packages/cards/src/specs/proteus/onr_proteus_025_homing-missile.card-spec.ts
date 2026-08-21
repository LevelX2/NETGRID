import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

const rezWithXStrengthTrace = capabilityKey("rez_with_x_strength_trace");

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_025_homing-missile"),
    title: "Homing Missile",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*Trace x-If trace is successful, end the run, and Runner cannot make another run until Runner takes an action to pay [2]. Pay X, above the rez cost, when you rez Homing Missile. X is Homing Missile 's strength and trace limit, and X cannot be greater than 8.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_025_homing-missile",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["sentry"],
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
        kind: "paid_x",
        minimumStrength: 0,
        maximumStrength: 8,
      },
    },
    variableRez: {
      capabilityKey: rezWithXStrengthTrace,
      addressability: ["plan", "action", "quote", "debug"],
      kind: "x_strength",
      additionalCostPerValue: 1,
      minValue: 0,
      maxValue: 8,
      visibility: "public",
      traceLimitFromValue: true,
    },
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("subroutine_trace_x_end_run_and_run_lock"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "trace",
        traceLimit: 0,
        onSuccess: [
          {
            kind: "end_run",
            visibility: "public",
          },
          {
            kind: "runner_run_lock_until_action_paid",
            amount: 2,
            visibility: "public",
          },
        ],
      },
    ],
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
        roleDetail: "x_strength_trace_ice",
        evidenceProfile: "x_strength_trace_ice",
        confidence: "high",
        rationale:
          "ICE Semantic Review v1: Homing Missile bestätigt corp.ice_tax_glacier nur aus konkreten ICE-Funktionssignalen; Subtypen bleiben Kartendaten.",
      },
    ],
    capabilities: [
      {
        capabilityKey: rezWithXStrengthTrace,
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_x_strength_trace_and_rez_reserve",
            preferences: [
              "high_run_denial_payoff",
              "current_run_path_relevance",
              "use_choice_option_with_visible_board_payoff",
            ],
            avoid: [
              "option_with_no_visible_current_payoff",
              "insufficient_post_payment_reserve",
            ],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_025_homing-missile",
      setId: "proteus",
      collectorNumber: "P025",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
