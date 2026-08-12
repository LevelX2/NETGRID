import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_138_pk-6089a"),
    title: "PK-6089a",
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Provides +1 MU. Put [3] from the bank on PK-6089a when it is installed. Use these bits only to pay for increasing your link. If you use any of these bits, replace them from the bank at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_138_pk-6089a",
      },
      {
        source: "project_ruling",
        reference: "docs/source/Netrunner Errata 1.70.md#PK-6089a",
        note: "Official errata adds ‘from the bank’ to the refill instruction.",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["deck"],
      numeric: {
        installCost: 4,
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
      memoryLimitBonus: 1,
      recurringCredits: 3,
    },
    hardwareDeck: true,
    modifiers: [
      {
        kind: "memory_units",
        operation: "increase",
        amount: 1,
        activeWhile: "installed",
        sourceZone: "runner_installed",
        side: "runner",
        visibility: "public",
      },
    ],
    lifecycle: {
      on_install: [
        {
          kind: "add_hosted_credits",
          target: "source",
          amount: 3,
          visibility: "public",
        },
      ],
    },
    restrictedHostedCreditSource: {
      capacity: 3,
      counterType: "bit",
      usableFor: ["increase_link"],
      refresh: {
        timing: "start_of_runner_turn",
        mode: "refill_to_capacity_if_used",
      },
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_138_pk-6089a",
      setId: "originalset-v1",
      collectorNumber: "138",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
