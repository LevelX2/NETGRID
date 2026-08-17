import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_299_power-grid-overload"),
    title: "Power Grid Overload",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Play only if Runner is tagged. Trash X pieces of hardware, other than cybernetics.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_299_power-grid-overload",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["gray ops"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: {
        kind: "variable_x",
        minimumX: 0,
        creditsPerX: 1,
        maximumX: {
          kind: "context",
        },
      },
      strength: {
        kind: "not_applicable",
      },
    },
    corpUtility: {
      capabilityKey: capabilityKey(
        "corp_utility_installed_hardware_trash_by_counter",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "installed_hardware_trash_by_counter",
      excludesSubtype: "cybernetics",
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "tag_punish",
      },
      {
        kind: "strategic_role",
        role: "punish_payoff",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.tag_trace_punish",
      },
      {
        kind: "line_support",
        lineKey: "corp.tag_trace_punish",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.tag_trace_punish",
        role: "punish_payoff",
        roleDetail: "tagged_runner_hardware_trash",
        confidence: "high",
        rationale:
          "Operations Semantic Review v2: tagged_runner_payoff / hardware_trash.",
      },
      {
        kind: "tactic_interpretation",
        signal: "tag.payoff",
        use: "tag.payoff",
      },
      {
        kind: "tactic_interpretation",
        signal: "punish.payoff",
        use: "punish.payoff",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "corp_utility_installed_hardware_trash_by_counter",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_x_visible_non_cybernetics_hardware_to_trash",
            preferences: [
              "best_cards_for_current_plan",
              "best_cards_for_current_state",
              "use_choice_option_with_visible_board_payoff",
            ],
            avoid: [
              "option_with_no_visible_current_payoff",
              "insufficient_post_payment_reserve",
            ],
          },
          {
            kind: "strategy_support",
            strategyKey: "corp.tag_trace_punish",
            role: "payoff_anchor",
            roleDetail: "payoff_anchor_tag_payoff",
            evidenceAnchor: "tag.payoff",
            confidence: "high",
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_299_power-grid-overload",
      setId: "originalset-v1",
      collectorNumber: "299",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
