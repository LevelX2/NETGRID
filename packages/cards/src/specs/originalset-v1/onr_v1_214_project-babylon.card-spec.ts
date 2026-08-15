import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_214_project-babylon"),
    title: "Project Babylon",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Score 1 additional agenda point for every two advancement counters over Project Babylon's difficulty that are on Project Babylon when you score it.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_214_project-babylon",
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
    scoredAgenda: {
      capabilityKey: capabilityKey(
        "scored_agenda_overadvance_bonus_agenda_points",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "overadvance_bonus_agenda_points",
      perExcessAdvancementCounters: 2,
      visibility: "public",
    },
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
        role: "overadvance_for_bonus_points",
      },
      {
        kind: "strategic_role",
        role: "win_condition",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.overadvance_value",
      },
      {
        kind: "line_support",
        lineKey: "corp.overadvance_value",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.overadvance_value",
        role: "win_condition",
        roleDetail: "overadvance_agenda_point_payoff",
        confidence: "high",
        rationale:
          "The payoff is specifically overadvance agenda-point conversion, not generic remote scoring.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_214_project-babylon",
      setId: "originalset-v1",
      collectorNumber: "214",
      rarity: "vital",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
