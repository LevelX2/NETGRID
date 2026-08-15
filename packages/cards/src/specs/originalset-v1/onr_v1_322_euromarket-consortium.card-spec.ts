import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_322_euromarket-consortium"),
    title: "Euromarket Consortium",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Hand size +2; A, [1]: Draw two cards.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_corp_main_draw_cards",
        ),
        actionLabel: "Euromarket Consortium: 2 Karten ziehen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_322_euromarket-consortium",
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
        rezCost: 2,
        trashCost: 4,
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
        kind: "hand_size",
        side: "corp",
        operation: "increase",
        amount: 2,
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
      },
    ],
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
          {
            kind: "credit",
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
        kind: "plan_role",
        role: "corp_hand_size_support",
      },
      {
        kind: "plan_role",
        role: "corp_repeatable_draw",
      },
      {
        kind: "tactic_interpretation",
        signal: "draw.card",
        use: "draw.card",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_322_euromarket-consortium",
      setId: "originalset-v1",
      collectorNumber: "322",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
