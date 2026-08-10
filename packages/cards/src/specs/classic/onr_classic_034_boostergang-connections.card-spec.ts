import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId(
      "onr_classic_034_boostergang-connections",
    ),
    title: "Boostergang Connections",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Trash your hand. Search your stack for as many cards as were successfully trashed in this way and bring them into your hand. Shuffle your stack afterward.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_034_boostergang-connections",
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
        credits: 7,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    runnerEventLongtail: {
      capabilityKey: capabilityKey("trash_grip_search_equal_count"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "trash_grip_search_stack_to_grip_equal_count",
      shuffleAfterwards: true,
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "recover_key_card",
      },
      {
        kind: "plan_role",
        role: "repair_setup",
      },
      {
        kind: "strategic_role",
        role: "enabler",
      },
      {
        kind: "line_support",
        lineKey: "runner.search.breaker",
        support: "supports",
      },
      {
        kind: "strategic_exchange",
        exchange: "board_or_hand_sacrifice",
      },
      {
        kind: "target_preference",
        purpose: "choose_stack_cards_after_grip_trash",
        preferences: [
          "best_cards_for_current_plan",
          "best_cards_for_current_state",
        ],
        avoid: ["hidden_info_dependent_choice"],
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "high",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "high",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_034_boostergang-connections",
      setId: "classic",
      collectorNumber: "C034",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
