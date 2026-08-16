import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_333_omniscience-foundation"),
    title: "Omniscience Foundation",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Give Runner a tag at the end of each turn during which Runner received a tag.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_333_omniscience-foundation",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["gray ops"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: 1,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    corpUtility: {
      capabilityKey: capabilityKey(
        "corp_utility_end_turn_tag_if_runner_received_tag",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "end_turn_tag_if_runner_received_tag",
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "remote_asset_pressure",
      },
      {
        kind: "strategic_role",
        role: "enabler",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.tag_trace_punish",
      },
      {
        kind: "line_support",
        lineKey: "corp.tag_trace_punish",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.tag_trace_punish",
        role: "enabler",
        roleDetail: "tag_snowball_followup",
        confidence: "medium",
        rationale:
          "Conditional additional-tag follow-up after Runner received a tag this turn; not an initial tag source and not generic tagged-runner payoff.",
      },
      {
        kind: "remote_role",
        role: "tag_punish_asset",
        threatLevel: "medium",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "corp_utility_end_turn_tag_if_runner_received_tag",
        ),
        annotations: [
          {
            kind: "strategy_support",
            strategyKey: "corp.tag_trace_punish",
            role: "enabler",
            roleDetail: "enabler_tag_additional_source",
            evidenceAnchor: "tag.additional_source",
            confidence: "medium",
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_333_omniscience-foundation",
      setId: "originalset-v1",
      collectorNumber: "333",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
