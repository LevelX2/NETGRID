import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_022_emergency-self-construct"),
    title: "Emergency Self-Construct",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[T]: Prevent yourself from being flatlined, though you still lose all cards in your hand. Remove all brain damage. For the remainder of the game, you have only three actions per turn, instead of four; your hand size is reduced by 1; and all meat damage is automatically prevented.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_022_emergency-self-construct",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
      numeric: {
        installCost: 0,
        memoryCost: 1,
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
    flatlineReplacementSources: [
      {
        capabilityKey: capabilityKey(
          "flatline_replacement_sources_flatline_replacement_installed",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "flatline_replacement_installed",
        replacement: "installed_flatline_prevention",
        cost: {
          kind: "trash_source",
        },
        visibility: "public",
        resolution: {
          trashAllGrip: true,
          removeAllCoreDamage: true,
          maxHandSizeModifier: -1,
          runnerActionsPerTurnOverride: 3,
          permanentMeatDamagePrevention: true,
        },
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "strategic_role",
        role: "emergency_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.survival_defense",
      },
      {
        kind: "line_support",
        lineKey: "runner.survival_defense",
        support: "supports",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_022_emergency-self-construct",
      setId: "originalset-v1",
      collectorNumber: "022",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
