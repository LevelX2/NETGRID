import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_286_corporate-detective-agency"),
    title: "Corporate Detective Agency",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Play only if Runner is tagged. Trash up to two Resources at no cost.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_286_corporate-detective-agency",
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
        credits: 1,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    corpUtility: {
      capabilityKey: capabilityKey(
        "corp_utility_trash_runner_resources_if_tagged",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "trash_runner_resources_if_tagged",
      max: 2,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "bait_runner",
      },
      {
        kind: "plan_role",
        role: "protect_hq",
      },
      {
        kind: "strategic_role",
        role: "punish_payoff",
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
        role: "punish_payoff",
        roleDetail: "tagged_runner_resource_trash",
        confidence: "high",
        rationale:
          "Operations Semantic Review v2: tagged_runner_payoff / resource_trash.",
      },
      {
        kind: "tactic_interpretation",
        signal: "tag.payoff",
        use: "tag.payoff",
      },
      {
        kind: "tactic_interpretation",
        signal: "punish.payoff",
        use: "punish.payoff",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "corp_utility_trash_runner_resources_if_tagged",
        ),
        annotations: [
          {
            kind: "strategy_support",
            strategyKey: "corp.tag_trace_punish",
            role: "payoff_anchor",
            roleDetail: "payoff_anchor_tag_payoff",
            evidenceAnchor: "tag.payoff",
            confidence: "high",
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_286_corporate-detective-agency",
      setId: "originalset-v1",
      collectorNumber: "286",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
