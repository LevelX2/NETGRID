import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_016_badtimes"),
    title: "Badtimes",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Play only if Runner is tagged. Runner's MU is reduced by 2 until end of turn.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_016_badtimes",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["virus"],
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
    corpUtility: {
      capabilityKey: capabilityKey(
        "reduce_tagged_runner_memory_until_end_turn",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "runner_memory_limit_modifier_until_end_of_turn",
      operation: "reduce",
      amount: 2,
      condition: "runner_tagged",
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "disrupt_runner_rig",
      },
      {
        kind: "plan_role",
        role: "punish_tagged_runner",
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
        roleDetail: "tagged_runner_memory_pressure",
        confidence: "medium",
        rationale:
          "Operations Semantic Review v2: tagged_runner_payoff / memory_pressure.",
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
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "medium",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "reduce_tagged_runner_memory_until_end_turn",
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
      printingId: "onr_classic_016_badtimes",
      setId: "classic",
      collectorNumber: "C016",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
