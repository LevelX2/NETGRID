import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_001_ai-board-member"),
    title: "AI Board Member",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "You may gain an action during each of your turns. At the start of each of your turns, roll a die to see what the action will be for that turn, and then decide whether to take it. On a 1, you may use the action only to install a card; on a 2 or 3, only to gain 1; on a 4, 5, or 6, only to draw a card.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_001_ai-board-member",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["ai", "random", "research"],
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
        "corp_start_turn_random_restricted_optional_action",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "corp_start_turn_random_restricted_optional_action",
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
        role: "utility",
      },
      {
        kind: "line_support",
        lineKey: "corp.action_tempo",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.action_tempo",
        role: "utility",
        roleDetail: "random_recurring_action_mode",
        evidenceProfile: "random_recurring_action_mode",
        confidence: "medium",
        rationale:
          "Random recurring action modes create action-tempo flexibility but carry mode variance risk.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_001_ai-board-member",
      setId: "proteus",
      collectorNumber: "P001",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
