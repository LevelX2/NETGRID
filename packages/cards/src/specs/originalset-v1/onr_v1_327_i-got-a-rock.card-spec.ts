import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_327_i-got-a-rock"),
    title: "I Got a Rock",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "A, 3 agenda points: Do 15 meat damage to Runner. Use this ability only if Runner has two or more tags.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_327_i-got-a-rock",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["black ops"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 3,
        trashCost: 2,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    uniqueDirectLongtail: {
      capabilityKey: capabilityKey(
        "unique_direct_longtail_tagged_meat_damage_meat",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "tagged_meat_damage",
      requiredRunnerTags: 2,
      agendaPointCost: 3,
      damageType: "meat",
      damageAmount: 15,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "remote_asset_finisher",
      },
      {
        kind: "strategic_role",
        role: "win_condition",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.tag_trace_punish",
      },
      {
        kind: "line_support",
        lineKey: "corp.damage_kill",
        support: "supports",
      },
      {
        kind: "line_support",
        lineKey: "corp.tag_trace_punish",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.damage_kill",
        role: "win_condition",
        roleDetail: "tagged_meat_payoff",
        confidence: "medium",
        rationale:
          "Massive meat damage payoff, but two-tag requirement and 3 agenda-point cost reduce confidence.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.tag_trace_punish",
        role: "win_condition",
        roleDetail: "tagged_meat_payoff",
        confidence: "medium",
        rationale:
          "Tag payoff requiring at least two tags and agenda-point payment; not a tag source.",
      },
      {
        kind: "tactic_interpretation",
        signal: "damage.payoff",
        use: "damage.payoff.runner",
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
        kind: "remote_role",
        role: "tag_punish_asset",
        threatLevel: "medium",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "unique_direct_longtail_tagged_meat_damage_meat",
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
      printingId: "onr_v1_327_i-got-a-rock",
      setId: "originalset-v1",
      collectorNumber: "327",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
