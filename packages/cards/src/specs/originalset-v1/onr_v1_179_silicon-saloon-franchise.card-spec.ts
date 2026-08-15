import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_179_silicon-saloon-franchise"),
    title: "Silicon Saloon Franchise",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "A: Gain [1] and draw one card.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_runner_main_gain_credits",
        ),
        actionLabel:
          "Silicon Saloon Franchise: 1 Credit nehmen und 1 Karte ziehen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_179_silicon-saloon-franchise",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["position"],
      numeric: {
        installCost: 8,
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
        capabilityKey: capabilityKey(
          "abilities_activated_runner_main_gain_credits",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "runner_main",
        costs: [
          {
            kind: "action",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "gain_credits",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          },
          {
            kind: "draw_cards",
            recipient: "controller",
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
        kind: "plan_role",
        role: "draw_for_answers",
      },
      {
        kind: "plan_role",
        role: "recover_economy",
      },
      {
        kind: "tactic_interpretation",
        signal: "draw.card",
        use: "draw.card",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "medium",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_179_silicon-saloon-franchise",
      setId: "originalset-v1",
      collectorNumber: "179",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
