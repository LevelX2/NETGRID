import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_088_fubar"),
    title: "Fubar",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[1]: Break a subroutine of the type chosen for Fubar. [2]: +1 strength. [0]: Choose whether Fubar breaks code gates, sentries, or walls. Use this ability only once. Whenever you break an ice subroutine with Fubar, lose [1] from a stealth card.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_088_fubar",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["icebreaker", "noisy"],
      numeric: {
        installCost: 10,
        memoryCost: 1,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 3,
      },
    },
    icebreakerSubtypeChange: {
      capabilityKey: capabilityKey("select_breaker_subtype_once"),
      addressability: ["plan", "action", "quote", "debug"],
      timing: "during_run",
      cost: {
        clicks: 0,
        credits: 0,
      },
      choices: ["code_gate", "sentry", "wall"],
      limit: "once_until_selected",
      visibility: "public",
    },
    icebreakerAbilities: [
      {
        capabilityKey: capabilityKey(
          "break_selected_subtype_with_stealth_tradeoff",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "break_subroutine",
        cost: {
          kind: "credit",
          amount: 1,
        },
        matches: {
          kind: "selected_ice_subtype",
        },
        onSuccessfulBreak: [
          {
            kind: "lose_bits_from_stealth_sources",
            amount: 1,
            sourceMode: "single_stealth_card",
            optionalIfUnavailable: true,
            trigger: "per_subroutine",
          },
        ],
        visibility: "public",
      },
      {
        capabilityKey: capabilityKey("pump_strength_one"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "increase_strength",
        cost: {
          kind: "credit",
          amount: 2,
        },
        amount: 1,
        duration: "current_encounter",
        visibility: "public",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "build_rig",
      },
      {
        kind: "plan_role",
        role: "safe_probe_run",
      },
      {
        kind: "tactic_interpretation",
        signal: "coverage.breaker",
        use: "coverage.breaker",
      },
      {
        kind: "risk_interpretation",
        risk: "stealth_credit_pool_loss",
        severity: "high",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("select_breaker_subtype_once"),
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_fixed_breaker_coverage",
            preferences: [
              "type_missing_in_current_rig",
              "type_blocking_relevant_run_path",
            ],
            avoid: ["unknown_low_information_target"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_088_fubar",
      setId: "proteus",
      collectorNumber: "P088",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
