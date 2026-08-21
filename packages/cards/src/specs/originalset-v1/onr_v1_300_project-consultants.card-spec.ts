import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

const distributeAdvancementCounters = capabilityKey(
  "abilities_on_play_distribute_advancement_counters",
);

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_300_project-consultants"),
    title: "Project Consultants",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Add four advancement counters to any combination of installed cards that can be advanced.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_300_project-consultants",
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
        credits: 12,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: distributeAdvancementCounters,
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "distribute_advancement_counters",
            amount: 4,
            target: "installed_advanceable_cards",
            distribution: "any_combination",
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
        kind: "strategy_anchor",
        strategyKey: "corp.fast_advance",
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
        roleDetail: "advance_counter_burst",
        confidence: "high",
        rationale:
          "Operations Semantic Review v2: advancement_counter_burst / fast_advance / overadvance_candidate.",
      },
    ],
    capabilities: [
      {
        capabilityKey: distributeAdvancementCounters,
        annotations: [
          { kind: "plan_owner", owner: "corp.score_agenda" },
          {
            kind: "target_preference",
            purpose: "advance_high_value_corp_card_distribution",
            preferences: [
              "advancement_target_in_current_plan",
              "advanceable_ambush_with_access_payoff",
              "best_cards_for_current_plan",
            ],
            avoid: [
              "nonconverting_advancement_target",
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
      printingId: "onr_v1_300_project-consultants",
      setId: "originalset-v1",
      collectorNumber: "300",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
