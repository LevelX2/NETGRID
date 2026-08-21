import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_192_corporate-boon"),
    title: "Corporate Boon",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Put four Boon counters on Corporate Boon when you score it.\nBoon counter: Gain an action. Use this ability only once per turn and only during your turn.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_corp_main_gain_actions",
        ),
        actionLabel: "Corporate Boon: Boon-Counter für Aktion ausgeben",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_192_corporate-boon",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["asset"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 6,
        agendaPoints: 2,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    scoredAgenda: {
      capabilityKey: capabilityKey("scored_agenda_add_counters_on_score_boon"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "add_counters_on_score",
      counterType: "boon",
      amount: 4,
      visibility: "public",
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_corp_main_gain_actions",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_main",
        costs: [
          {
            kind: "source_counter",
            counterType: "boon",
            amount: 1,
            source: "source",
          },
        ],
        limit: {
          kind: "once_per_turn_per_source",
          scope: "any_ability_on_source",
        },
        effects: [
          {
            kind: "gain_actions",
            recipient: "corp",
            amount: 1,
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
        role: "payoff_anchor",
      },
      {
        kind: "line_support",
        lineKey: "corp.action_tempo",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.action_tempo",
        role: "payoff_anchor",
        roleDetail: "extra_action_counter_bank",
        confidence: "medium",
        rationale:
          "The scored counter bank converts into extra Corp actions and belongs under action-tempo rather than remote scoring.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_192_corporate-boon",
      setId: "originalset-v1",
      collectorNumber: "192",
      rarity: "vital",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
