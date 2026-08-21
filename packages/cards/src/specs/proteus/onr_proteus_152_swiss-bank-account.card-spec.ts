import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_152_swiss-bank-account"),
    title: "Swiss Bank Account",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "You may use the following abilities whenever you pay any cost or penalty. [T]: Gain [2]. [3], [T]: Gain [6]. Hidden resources are installed face down, but are put into the trash face up.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("trash_source_gain_two_credits"),
        actionLabel: "Swiss Bank Account: 2 Credits nehmen",
      },
      {
        capabilityKey: capabilityKey("pay_three_trash_source_gain_six"),
        actionLabel: "Swiss Bank Account: 6 Credits nehmen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_152_swiss-bank-account",
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
        capabilityKey: capabilityKey("trash_source_gain_two_credits"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "runner_cost_penalty_support",
        costs: [
          {
            kind: "trash_source",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "gain_credits",
            recipient: "runner",
            amount: 2,
            visibility: "hidden_info_barrier",
          },
        ],
      },
      {
        capabilityKey: capabilityKey("pay_three_trash_source_gain_six"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "runner_cost_penalty_support",
        costs: [
          {
            kind: "credit",
            amount: 3,
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
            amount: 6,
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
        role: "recover_economy",
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
      printingId: "onr_proteus_152_swiss-bank-account",
      setId: "proteus",
      collectorNumber: "P152",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
