import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_339_schlaghund"),
    title: "Schlaghund",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "A: Roll a die. If you roll less than or equal to the number of tags Runner has, Schlaghund does 10 meat damage and you trash Schlaghund.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_339_schlaghund",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["black ops", "random"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 2,
        trashCost: 4,
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
        "unique_direct_longtail_tag_threshold_meat_damage_asset_meat",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "tag_threshold_meat_damage_asset",
      damageType: "meat",
      damageAmount: 10,
      trashSourceOnSuccess: true,
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
          "Tagged meat damage payoff with die-roll success condition; random outcome lowers confidence.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.tag_trace_punish",
        role: "win_condition",
        roleDetail: "tagged_meat_payoff",
        confidence: "medium",
        rationale: "Tag payoff, but stochastic; not a tag source.",
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
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "very_high",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "unique_direct_longtail_tag_threshold_meat_damage_asset_meat",
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
      printingId: "onr_v1_339_schlaghund",
      setId: "originalset-v1",
      collectorNumber: "339",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
