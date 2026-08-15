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
        kind: "plan_role",
        role: "corp_action_burst",
      },
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
        confidence: "medium",
        rationale:
          "Immediate action capacity supports Fast Advance only when a concrete same-turn score conversion is already bound; otherwise it is general action tempo.",
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
