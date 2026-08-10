import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_267_sentinels-prime"),
    title: "Sentinels Prime",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "[Subroutine] Trash a program.\n[Subroutine] End the run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_267_sentinels-prime",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["killer", "sentry"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 8,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 4,
      },
    },
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("printed_subroutines_trash_program"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "trash_program",
      },
      {
        capabilityKey: capabilityKey("printed_subroutines_end_the_run"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "end_the_run",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "protect_hq",
      },
      {
        kind: "plan_role",
        role: "protect_rnd",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.ice_tax_glacier",
      },
      {
        kind: "tactic_interpretation",
        signal: "corp.remote_protection",
        use: "corp.remote_protection",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_267_sentinels-prime",
      setId: "originalset-v1",
      collectorNumber: "267",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
