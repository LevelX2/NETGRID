import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_076_syd-meyer-superstores"),
    title: "Syd Meyer Superstores",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "A: Trash a rezzed piece of ice. Gain [4].",
    capabilityText: [
      {
        capabilityKey: capabilityKey("corp_main_trash_rezzed_ice_for_credits"),
        actionLabel:
          "Syd Meyer Superstores: gerezztes ICE trashen und 4 Credits erhalten",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_076_syd-meyer-superstores",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["asset", "node"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: 2,
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
        capabilityKey: capabilityKey("corp_main_trash_rezzed_ice_for_credits"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_main",
        costs: [
          {
            kind: "action",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "trash_own_rezzed_ice_for_credits",
            target: "chosen_own_rezzed_ice",
            gainCredits: 4,
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
        role: "find_economy",
      },
      {
        kind: "strategic_role",
        role: "support_tool",
      },
      {
        kind: "line_support",
        lineKey: "corp.asset_economy",
        support: "supports",
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
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "medium",
      },
      {
        kind: "strategic_exchange",
        exchange: "board_or_hand_sacrifice",
      },
      {
        kind: "risk_interpretation",
        risk: "installed_card_trash_cost",
        severity: "high",
      },
      {
        kind: "target_preference",
        purpose: "trash_rezzed_ice_for_credit_cashout",
        preferences: [
          "redundant_or_spent_installed_card",
          "lowest_near_term_value",
          "best_cards_for_current_state",
        ],
        avoid: [
          "option_with_no_visible_current_payoff",
          "next_turn_required_card",
        ],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_076_syd-meyer-superstores",
      setId: "proteus",
      collectorNumber: "P076",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
