import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_026_street-enforcer"),
    title: "Street Enforcer",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "At the start of each run on this data fort, Runner loses [X], where X is equal to the number of tags Runner has.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_026_street-enforcer",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["sysop"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 1,
        trashCost: 3,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    corpUtility: {
      capabilityKey: capabilityKey("run_start_lose_runner_credits_per_tag"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "run_start_lose_runner_credits_per_tag",
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "protect_hq",
      },
      {
        kind: "plan_role",
        role: "protect_rnd",
      },
      {
        kind: "plan_role",
        role: "protect_remote",
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
        roleDetail: "tag_count_credit_loss_payoff",
        confidence: "high",
        rationale:
          "Start-of-run credit loss scales with Runner tag count; this is primarily a tag payoff, not a generic glacier or remote-scoring card.",
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
        capabilityKey: capabilityKey("run_start_lose_runner_credits_per_tag"),
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
      printingId: "onr_classic_026_street-enforcer",
      setId: "classic",
      collectorNumber: "C026",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
