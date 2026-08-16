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
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "scored_agenda_shuffle_selected_hq_agendas_into_rd_gain_credits",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_hq_agenda_subset_for_reveal_credit_and_shuffle",
            preferences: [
              "meet_bound_credit_need_with_smallest_sufficient_subset",
              "reduce_hq_agenda_exposure_under_current_hq_pressure",
              "prefer_already_known_agenda_when_plan_value_is_equal",
              "preserve_bound_or_immediately_scoreable_agenda",
              "account_for_runner_matchpoint_and_rnd_pressure",
            ],
            avoid: [
              "unnecessary_private_agenda_information_reveal",
              "shuffle_agenda_required_by_current_score_route",
            ],
          },
        ],
      },
    ],
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
