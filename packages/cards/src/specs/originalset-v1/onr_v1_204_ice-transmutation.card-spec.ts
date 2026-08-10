import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_204_ice-transmutation"),
    title: "Ice Transmutation",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Choose a piece of rezzed ice when you score Ice Transmutation. That ice now has +1 strength, and each subroutine on it is repeated once. Treat this as if each repeated subroutine appeared immediately after the original subroutine.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_204_ice-transmutation",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["research"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 5,
        agendaPoints: 3,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    scoredAgenda: {
      capabilityKey: capabilityKey(
        "scored_agenda_select_rezzed_ice_mark_modifier_mark",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "select_rezzed_ice_mark_modifier",
      target: "rezzed_installed_ice",
      counterType: "mark",
      counterAmount: 1,
      strengthBonusPerCounter: 1,
      duplicateEachPrintedSubroutinePerCounter: true,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "strategic_role",
        role: "payoff_anchor",
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
        role: "payoff_anchor",
        roleDetail: "ice_upgrade_payoff",
        confidence: "high",
        rationale:
          "Agenda Semantic Review v1 maps Ice Transmutation to corp.ice_tax_glacier as payoff_anchor/ice_upgrade_payoff.",
      },
      {
        kind: "tactic_interpretation",
        signal: "corp.remote_protection",
        use: "corp.remote_protection",
      },
      {
        kind: "target_preference",
        purpose: "strengthen_and_repeat_best_ice_subroutine",
        preferences: ["multi_subroutine_ice", "blocks_relevant_run_path"],
        avoid: ["hidden_info_dependent_choice"],
      },
      {
        kind: "target_preference",
        purpose: "repeat_highest_impact_subroutine",
        preferences: ["high_run_denial_payoff", "current_run_path_relevance"],
        avoid: [],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_204_ice-transmutation",
      setId: "originalset-v1",
      collectorNumber: "204",
      rarity: "vital",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
