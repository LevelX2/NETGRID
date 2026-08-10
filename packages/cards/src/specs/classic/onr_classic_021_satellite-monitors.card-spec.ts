import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_021_satellite-monitors"),
    title: "Satellite Monitors",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "At the start of each of your turns, you may roll a die for each run Runner made during his or her last turn. Dor each 1, give Runner a tag.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_021_satellite-monitors",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["node"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 3,
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
      capabilityKey: capabilityKey("start_turn_tag_roll_per_runner_run"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "corp_start_turn_tag_roll_per_runner_run_last_turn",
      dieFaces: 6,
      tagOn: 1,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "punish_tagged_runner",
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
        roleDetail: "run_count_start_turn_tag_source",
        confidence: "medium",
        rationale:
          "Delayed probabilistic start-of-turn tag source that scales with the number of Runner runs last turn; not specifically a multiple-run-only condition.",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_021_satellite-monitors.",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("start_turn_tag_roll_per_runner_run"),
        annotations: [
          {
            kind: "strategy_support",
            strategyKey: "corp.tag_trace_punish",
            role: "anchor_evidence",
            roleDetail: "anchor_evidence_tag_source",
            evidenceAnchor: "tag.source",
            confidence: "high",
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_021_satellite-monitors",
      setId: "classic",
      collectorNumber: "C021",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
