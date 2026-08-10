import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_218_subsidiary-branch"),
    title: "Subsidiary Branch",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Gain an action during each of your turns.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_218_subsidiary-branch",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["gray-ops"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 6,
        agendaPoints: 1,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    lifecycle: {
      start_of_corp_turn: [
        {
          effects: [
            {
              kind: "gain_actions",
              recipient: "controller",
              amount: 1,
              visibility: "public",
            },
          ],
        },
      ],
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "strategic_role",
        role: "engine_anchor",
      },
      {
        kind: "line_support",
        lineKey: "corp.action_tempo",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.action_tempo",
        role: "engine_anchor",
        roleDetail: "recurring_extra_action_engine",
        confidence: "medium",
        rationale:
          "A recurring extra Corp action is a reusable action-tempo engine after the agenda is scored.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_218_subsidiary-branch",
      setId: "originalset-v1",
      collectorNumber: "218",
      rarity: "vital",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
