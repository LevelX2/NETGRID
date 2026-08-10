import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_144_tycho-mem-chip"),
    title: "Tycho Mem Chip",
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Provides +3 MU.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_144_tycho-mem-chip",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["chip"],
      numeric: {
        installCost: 5,
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
    },
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
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "build_rig",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_144_tycho-mem-chip",
      setId: "originalset-v1",
      collectorNumber: "144",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
