import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_201_executive-extraction"),
    title: "Executive Extraction",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Difficulty of Gray Ops agendas is reduced by 1.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_201_executive-extraction",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["black-ops"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 3,
        agendaPoints: 1,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    modifiers: [
      {
        kind: "agenda_difficulty",
        operation: "reduce",
        amount: 1,
        activeWhile: "scored",
        sourceZone: "corp_scored_agenda",
        side: "corp",
        visibility: "public",
        appliesTo: {
          cardType: "agenda",
          subtype: "gray_ops",
        },
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "build_scoring_remote",
      },
      {
        kind: "plan_role",
        role: "score_next_turn",
      },
      {
        kind: "plan_role",
        role: "score_now",
      },
      {
        kind: "strategic_role",
        role: "enabler",
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
        role: "enabler",
        roleDetail: "gray_ops_difficulty_enabler",
        confidence: "medium",
        rationale:
          "Agenda Semantic Review v1 maps Executive Extraction to corp.fast_advance as enabler/gray_ops_difficulty_enabler.",
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
      printingId: "onr_v1_201_executive-extraction",
      setId: "originalset-v1",
      collectorNumber: "201",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
