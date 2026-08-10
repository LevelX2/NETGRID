import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_297_overtime-incentives"),
    title: "Overtime Incentives",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Gain two actions.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_297_overtime-incentives",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
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
        credits: 4,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey("abilities_on_play_gain_actions"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "gain_actions",
            recipient: "corp",
            amount: 2,
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
        kind: "strategic_role",
        role: "enabler",
      },
      {
        kind: "line_support",
        lineKey: "corp.fast_advance",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.fast_advance",
        role: "enabler",
        roleDetail: "extra_action_burst",
        confidence: "high",
        rationale:
          "Immediate action capacity can complete an otherwise click-blocked same-turn score-conversion path; legality and the gained amount remain Engine/LegalAction facts.",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "high",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_297_overtime-incentives",
      setId: "originalset-v1",
      collectorNumber: "297",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
