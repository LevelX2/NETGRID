import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_008_project-zurich"),
    title: "Project Zurich",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "For every two advancement counters over Project Zurich 's difficulty that are on Project Zurich when you score it, gain 1 at the start of each of your turns.",
    markCounterDisplay: {
      id: "project_zurich_credits_per_turn",
      label: "Credit/Zug",
      ariaLabelName: "Project Zurich zusätzlicher Credit pro Corp-Zug",
    },
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_008_project-zurich",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["asset"],
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
      capabilityKey: capabilityKey("overadvance_start_of_corp_turn_credits"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "overadvance_start_of_corp_turn_credits",
      perExcessAdvancementCounters: 2,
      creditPerGroup: 1,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "corp_score_agenda",
      },
      {
        kind: "plan_role",
        role: "score_next_turn",
      },
      {
        kind: "strategic_role",
        role: "payoff_anchor",
      },
      {
        kind: "line_support",
        lineKey: "corp.overadvance_value",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.overadvance_value",
        role: "payoff_anchor",
        roleDetail: "overadvance_recurring_credit_payoff",
        evidenceProfile: "overadvance_recurring_credit_payoff",
        confidence: "medium",
        rationale:
          "Overadvance turns extra advancement investment into recurring Corp economy value.",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_008_project-zurich",
      setId: "proteus",
      collectorNumber: "P008",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
