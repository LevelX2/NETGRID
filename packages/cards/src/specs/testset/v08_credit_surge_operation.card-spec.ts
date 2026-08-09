import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("v08_credit_surge_operation"),
    title: "Credit Surge Operation",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Erhalte 7 Credits.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "v08_credit_surge_operation",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "neutral_demo",
      subtypes: [],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: {
        kind: "fixed",
        credits: 1,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        kind: "on_play",
        capabilityKey: capabilityKey("v08_credit_surge_operation_on_play"),
        addressability: ["plan", "action", "quote", "debug"],
        costs: "printed",
        effects: [
          {
            kind: "gain_credits",
            recipient: "corp",
            amount: 7,
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
        role: "recover_economy",
      },
      {
        kind: "plan_role",
        role: "tempo",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "high",
        rationale:
          "Migrated from reviewed Testset hint v08_credit_surge_operation.",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "v08_credit_surge_operation",
      setId: "testset",
      collectorNumber: "V08-008",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
