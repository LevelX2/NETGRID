import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_134_mram-chip"),
    title: "MRAM Chip",
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Hand size +2.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_134_mram-chip",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["chip", "cybernetics"],
      numeric: {
        installCost: 1,
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
      maxHandSizeBonus: 2,
    },
    modifiers: [
      {
        kind: "hand_size",
        operation: "increase",
        amount: 2,
        activeWhile: "installed",
        sourceZone: "runner_installed",
        side: "runner",
        visibility: "public",
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_134_mram-chip",
      setId: "originalset-v1",
      collectorNumber: "134",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
