import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_320_encoder-inc"),
    title: "Encoder, Inc.",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      'Code gates cost 1 less to rez while Encoder, Inc. is rezzed. All code gates have an additional "End the run" subroutine after all other subroutines.',
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_320_encoder-inc",
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
        rezCost: 0,
        trashCost: 1,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    modifiers: [
      {
        kind: "rez_cost",
        operation: "reduce",
        amount: 1,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
        appliesTo: {
          cardType: "ice",
          subtype: "code_gate",
        },
      },
      {
        kind: "additional_subroutine",
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
        appliesTo: {
          side: "corp",
          cardType: "ice",
          subtype: "code_gate",
        },
        append: "after_existing",
        subroutine: {
          kind: "end_the_run",
          visibility: "public",
        },
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "protect_rnd",
      },
      {
        kind: "plan_role",
        role: "protect_hq",
      },
      {
        kind: "plan_role",
        role: "bait_runner",
      },
      {
        kind: "strategic_role",
        role: "tax_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.economy_rez_reserve",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.remote_scoring",
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
        roleDetail: "ice_tax_support",
        confidence: "high",
        rationale:
          "Code-Gate scope is a hard structured target-profile constraint; subtype data remains card data and is not mirrored as a tactic signal.",
      },
      {
        kind: "tactic_interpretation",
        signal: "corp.remote_protection",
        use: "corp.remote_protection",
      },
      {
        kind: "remote_role",
        role: "scoring_protection",
        threatLevel: "high",
      },
      {
        kind: "target_preference",
        purpose: "rez_best_defensive_ice",
        preferences: [
          "high_rez_cost_relief",
          "blocks_relevant_run_path",
          "protects_agenda_remote",
        ],
        avoid: ["hidden_info_dependent_choice"],
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
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_320_encoder-inc",
      setId: "originalset-v1",
      collectorNumber: "320",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
