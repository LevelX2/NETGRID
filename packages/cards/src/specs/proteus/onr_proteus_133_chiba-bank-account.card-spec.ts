import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_133_chiba-bank-account"),
    title: "Chiba Bank Account",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[1], [T]: Gain [4]. You may use this ability whenever you pay any cost or penalty. Hidden resources are installed face down, but are put into the trash face up.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("pay_and_trash_source_gain_four_credits"),
        actionLabel: "Chiba Bank Account: 4 Credits nehmen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_133_chiba-bank-account",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["hidden"],
      numeric: {
        installCost: 0,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey("pay_and_trash_source_gain_four_credits"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "runner_cost_penalty_support",
        costs: [
          {
            kind: "credit",
            amount: 1,
          },
          {
            kind: "trash_source",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "gain_credits",
            recipient: "runner",
            amount: 4,
            visibility: "hidden_info_barrier",
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
        role: "emergency_payment",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
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
      printingId: "onr_proteus_133_chiba-bank-account",
      setId: "proteus",
      collectorNumber: "P133",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
