import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_119_arasaka-portable-prototype"),
    title: "Arasaka Portable Prototype",
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Provides +3 MU. Installing Arasaka Portable Prototype costs 1 agenda point, in addition to the normal cost. Put [3] from the bank on Arasaka Portable Prototype when it is installed. Use these bits only to pay for using icebreakers during runs. If you use any of these bits, replace them at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_119_arasaka-portable-prototype",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["deck"],
      numeric: {
        installCost: 11,
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
      memoryLimitBonus: 3,
      recurringCredits: 3,
    },
    hardwareDeck: true,
    modifiers: [
      {
        kind: "memory_units",
        operation: "increase",
        amount: 3,
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
      usableFor: ["using_icebreaker_during_run"],
      refresh: {
        timing: "start_of_runner_turn",
        mode: "refill_to_capacity_if_used",
      },
    },
    installAdditionalCosts: [
      {
        kind: "agenda_point",
        amount: 1,
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "run_pressure",
      },
      {
        kind: "strategic_exchange",
        exchange: "score_progress",
      },
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
      printingId: "onr_v1_119_arasaka-portable-prototype",
      setId: "originalset-v1",
      collectorNumber: "119",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
