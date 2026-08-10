import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_199_employee-empowerment"),
    title: "Employee Empowerment",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "You may choose to draw an additional card at the start of each of your turns. [A]: Draw two cards.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_corp_main_draw_cards",
        ),
        actionLabel: "Employee Empowerment: 2 Karten ziehen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_199_employee-empowerment",
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
        advancementRequirement: 4,
        agendaPoints: 3,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    scoredAgenda: {
      capabilityKey: capabilityKey(
        "scored_agenda_corp_start_turn_optional_draw",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "corp_start_turn_optional_draw",
      drawCount: 1,
      visibility: "public",
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_corp_main_draw_cards",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_main",
        costs: [
          {
            kind: "action",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "draw_cards",
            recipient: "corp",
            amount: 2,
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
        role: "engine_anchor",
      },
      {
        kind: "line_support",
        lineKey: "corp.draw_engine",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.draw_engine",
        role: "engine_anchor",
        roleDetail: "scored_optional_draw_engine",
        confidence: "medium",
        rationale:
          "Optional recurring scored-agenda draw is a durable draw-engine anchor when the deck can use added card velocity.",
      },
      {
        kind: "tactic_interpretation",
        signal: "draw.card",
        use: "draw.card",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "low",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_199_employee-empowerment",
      setId: "originalset-v1",
      collectorNumber: "199",
      rarity: "vital",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
