import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_036_do-the-drine"),
    title: "Do the 'Drine",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Suffer any amount of brain damage, but not enough to flatline you or to reduce your hand size to less than 0. Gain [4] for each point of brain damage you suffer in this way. This damage cannot be prevented.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_036_do-the-drine",
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
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: {
        kind: "fixed",
        credits: 0,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    runnerEventLongtail: {
      capabilityKey: capabilityKey("take_core_damage_for_credits"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "do_the_drine_unpreventable_core_damage_for_credits",
      creditsPerDamage: 4,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "emergency_economy",
      },
      {
        kind: "strategic_role",
        role: "emergency_tool",
      },
      {
        kind: "strategic_exchange",
        exchange: "self_damage",
      },
      {
        kind: "tactic_interpretation",
        signal: "damage.payoff",
        use: "damage.payoff.runner",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "target_preference",
        purpose: "choose_safe_brain_damage_amount_for_credit_burst",
        preferences: ["use_choice_option_with_visible_board_payoff"],
        avoid: ["option_with_no_visible_current_payoff"],
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "very_high",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_036_do-the-drine.",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "high",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_036_do-the-drine.",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "high",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_036_do-the-drine.",
      },
      {
        kind: "risk_interpretation",
        risk: "flatline_risk",
        severity: "high",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_036_do-the-drine.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_036_do-the-drine",
      setId: "classic",
      collectorNumber: "C036",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
