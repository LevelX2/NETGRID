import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_003_corporate-headhunters"),
    title: "Corporate Headhunters",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Whenever Corporate Headhunters successfully does damage, Runner 's hand size is reduced by 1. A: Do 1 meat damage. Use this ability only if Runner is tagged.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_003_corporate-headhunters",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["asset"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 5,
        agendaPoints: 3,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    scoredAgenda: {
      capabilityKey: capabilityKey(
        "tagged_runner_meat_damage_reduce_hand_size_on_success",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "tagged_runner_meat_damage_reduce_hand_size_on_success",
      damageAmount: 1,
      handSizeReduction: 1,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "corp_score_agenda",
      },
      {
        kind: "plan_role",
        role: "score_next_turn",
      },
      {
        kind: "strategic_role",
        role: "engine_anchor",
      },
      {
        kind: "strategic_role",
        role: "punish_payoff",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.damage_kill",
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
        role: "engine_anchor",
        roleDetail: "tagged_meat_hand_size_pressure",
        evidenceProfile: "tagged_meat_hand_size_pressure",
        confidence: "high",
        rationale:
          "Agenda Semantic Review v1 maps Corporate Headhunters to corp.damage_kill as engine_anchor/tagged_meat_hand_size_pressure.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.tag_trace_punish",
        role: "punish_payoff",
        roleDetail: "tagged_runner_punish_payoff",
        evidenceProfile: "tagged_runner_punish_payoff",
        confidence: "high",
        rationale:
          "Agenda Semantic Review v1 maps Corporate Headhunters to corp.tag_trace_punish as punish_payoff/tagged_runner_punish_payoff.",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "tagged_runner_meat_damage_reduce_hand_size_on_success",
        ),
        annotations: [
          {
            kind: "strategy_support",
            strategyKey: "corp.damage_kill",
            role: "payoff_anchor",
            roleDetail: "payoff_anchor_damage_corp_tagged_meat_payoff",
            evidenceAnchor: "damage.corp_tagged_meat_payoff",
            confidence: "high",
          },
          {
            kind: "strategy_support",
            strategyKey: "corp.tag_trace_punish",
            role: "payoff_anchor",
            roleDetail: "payoff_anchor_damage_corp_tagged_meat_payoff",
            evidenceAnchor: "damage.corp_tagged_meat_payoff",
            confidence: "high",
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_003_corporate-headhunters",
      setId: "proteus",
      collectorNumber: "P003",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
