import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_007_project-venice"),
    title: "Project Venice",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "For every three advancement counters over Project Venice 's difficulty that are on Project Venice when you score it, gain an action during each of your turns.",
    markCounterDisplay: {
      id: "project_venice_actions_per_turn",
      label: "Aktion/Zug",
      ariaLabelName: "Project Venice zusätzliche Aktion pro Corp-Zug",
    },
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_007_project-venice",
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
        advancementRequirement: 4,
        agendaPoints: 2,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    scoredAgenda: {
      capabilityKey: capabilityKey("overadvance_start_of_corp_turn_actions"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "overadvance_start_of_corp_turn_actions",
      perExcessAdvancementCounters: 3,
      actionPerGroup: 1,
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
        role: "win_condition",
      },
      {
        kind: "strategic_role",
        role: "payoff_anchor",
      },
      {
        kind: "line_support",
        lineKey: "corp.action_tempo",
        support: "supports",
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
        roleDetail: "overadvance_extra_action_payoff",
        evidenceProfile: "overadvance_extra_action_payoff",
        confidence: "high",
        rationale:
          "Overadvance creates the recurring extra-action payoff, so the core strategic anchor is overadvance value.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.action_tempo",
        role: "payoff_anchor",
        roleDetail: "recurring_extra_action_payoff",
        evidenceProfile: "recurring_extra_action_payoff",
        confidence: "medium",
        rationale:
          "The resulting recurring extra action also materially supports action-tempo sequencing.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_007_project-venice",
      setId: "proteus",
      collectorNumber: "P007",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
