import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_305_team-restructuring"),
    title: "Team Restructuring",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Add one advancement counter to each of up to two installed cards that can be advanced.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_305_team-restructuring",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
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
        credits: 1,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_on_play_distribute_advancement_counters",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "distribute_advancement_counters",
            amount: 2,
            target: "installed_advanceable_cards",
            distribution: "up_to_distinct_targets_one_each",
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
        kind: "strategic_role",
        role: "scoring_tool",
      },
      {
        kind: "line_support",
        lineKey: "corp.fast_advance",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.fast_advance",
        role: "scoring_tool",
        roleDetail: "distributed_advance_counter_support",
        confidence: "medium",
        rationale:
          "Operations Semantic Review v2: distributed_advancement / fast_advance.",
      },
      {
        kind: "plan_role",
        role: "advance_score_window_support",
      },
      {
        kind: "target_preference",
        purpose: "advance_up_to_two_distinct_corp_cards",
        preferences: [
          "advancement_target_in_current_plan",
          "advanceable_ambush_with_access_payoff",
          "protects_agenda_remote",
        ],
        avoid: ["nonconverting_advancement_target"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_305_team-restructuring",
      setId: "originalset-v1",
      collectorNumber: "305",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
