import { cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("simple_economy_asset"),
    title: "Simple Economy Asset",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Wenn diese Karte gerezzt wird, erhält die Corp 3 Credits.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "simple_economy_asset",
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
        rezCost: 1,
        trashCost: 3,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    corpRootRezCreditOutcome: {
      timing: "after_runner_rez_interrupt_window",
      effect: {
        kind: "gain_credits",
        recipient: "corp",
        amount: 3,
        visibility: "public",
      },
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "bait_runner",
      },
      {
        kind: "plan_role",
        role: "recover_economy",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "high",
        rationale: "Migrated from reviewed Testset hint simple_economy_asset.",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "high",
        rationale: "Migrated from reviewed Testset hint simple_economy_asset.",
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
      printingId: "simple_economy_asset",
      setId: "testset",
      collectorNumber: "012",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
