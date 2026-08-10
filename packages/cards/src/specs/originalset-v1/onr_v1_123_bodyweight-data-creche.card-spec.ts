import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_123_bodyweight-data-creche"),
    title: "Bodyweight™ Data Crèche",
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Provides +1 MU. Once per turn, right after making a successful run, you can choose to make another run without taking an action to do so. Only one deck can be in play at a time. Trash any older decks.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_123_bodyweight-data-creche",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["deck"],
      numeric: {
        installCost: 3,
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
    successfulRunFollowups: [
      {
        capabilityKey: capabilityKey(
          "successful_run_followups_optional_make_run_after_successful_run",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "optional_make_run_after_successful_run",
        limit: "once_per_turn_per_source",
        cost: "none",
        visibility: "public",
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_123_bodyweight-data-creche",
      setId: "originalset-v1",
      collectorNumber: "123",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
