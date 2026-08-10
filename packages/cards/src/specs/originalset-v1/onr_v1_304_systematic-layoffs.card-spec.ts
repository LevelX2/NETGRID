import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_304_systematic-layoffs"),
    title: "Systematic Layoffs",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Add two advancement counters to any combination of installed cards that can be advanced.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_304_systematic-layoffs",
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
        credits: 5,
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
      {
        kind: "remote_role",
        role: "score_acceleration",
        threatLevel: "medium",
      },
      {
        kind: "target_preference",
        purpose: "advance_high_value_corp_card",
        preferences: [
          "prefer_option_that_protects_agenda_or_remote_pressure",
          "central_or_remote_plan_enabler",
        ],
        avoid: ["hidden_info_dependent_choice"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_304_systematic-layoffs",
      setId: "originalset-v1",
      collectorNumber: "304",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
