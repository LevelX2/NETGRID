import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_194_corporate-downsizing"),
    title: "Corporate Downsizing",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "When you score Corporate Downsizing, show to Runner any number of agenda cards stored in HQ. Gain bits equal to twice the combined agenda points of these cards; then shuffle them into R&D.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_194_corporate-downsizing",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["gray-ops"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 3,
        agendaPoints: 2,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    scoredAgenda: {
      capabilityKey: capabilityKey(
        "scored_agenda_shuffle_selected_hq_agendas_into_rd_gain_credits",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "shuffle_selected_hq_agendas_into_rd_gain_credits",
      creditPerAgendaPoint: 2,
      shuffleSelectedIntoRnd: true,
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "strategic_role",
        role: "defensive_tool",
      },
      {
        kind: "line_support",
        lineKey: "corp.central_stabilize",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.central_stabilize",
        role: "defensive_tool",
        roleDetail: "hq_agenda_flood_cleanup",
        confidence: "medium",
        rationale:
          "Agenda Semantic Review v1 maps Corporate Downsizing to corp.central_stabilize as defensive_tool/hq_agenda_flood_cleanup.",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "target_preference",
        purpose: "reveal_and_shuffle_agendas_from_hq",
        preferences: ["protect_agenda_density", "lowest_near_term_value"],
        avoid: [],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_194_corporate-downsizing",
      setId: "originalset-v1",
      collectorNumber: "194",
      rarity: "vital",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
