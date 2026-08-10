import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_004_fetal-ai"),
    title: "Fetal AI",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "When Runner accesses Fetal AI, do 2 Net damage, even if it is not installed. Ignore this effect if Runner accesses Fetal AI from the Archives. If Fetal AI is accessed from R&D, Runner must show it to you. Runner must pay 2 to steal Fetal AI, in addition to any other costs.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_004_fetal-ai",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["ai", "ambush", "asset"],
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
    accessEffects: [
      {
        capabilityKey: capabilityKey("access_damage"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_access",
        sourceZones: ["installed", "hq", "rd"],
        ignoreIfAccessedFrom: ["archives"],
        revealIfAccessedFrom: ["rd"],
        effects: [
          {
            kind: "damage",
            recipient: "runner",
            damageType: "net",
            amount: 2,
            preventable: true,
            visibility: "hidden_info_barrier",
          },
        ],
        visibility: "hidden_info_barrier",
      },
    ],
    selfStealCosts: [
      {
        kind: "current_access_self_steal_cost",
        amount: 2,
        sourceZones: ["installed", "hq", "rd"],
        ignoreIfAccessedFrom: ["archives"],
        visibility: "hidden_info_barrier",
      },
    ],
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
        role: "punish_payoff",
      },
      {
        kind: "line_support",
        lineKey: "corp.ambush_bluff",
        support: "supports",
      },
      {
        kind: "line_support",
        lineKey: "corp.damage_kill",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.damage_kill",
        role: "punish_payoff",
        roleDetail: "net_damage_steal_tax",
        evidenceProfile: "net_damage_steal_tax",
        confidence: "high",
        rationale:
          "Agenda Semantic Review v1 maps Fetal AI to corp.damage_kill as punish_payoff/net_damage_steal_tax.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ambush_bluff",
        role: "punish_payoff",
        roleDetail: "agenda_net_damage_ambush",
        evidenceProfile: "agenda_net_damage_ambush",
        confidence: "high",
        rationale:
          "Agenda Semantic Review v1 maps Fetal AI to corp.ambush_bluff as punish_payoff/agenda_net_damage_ambush.",
      },
      {
        kind: "tactic_interpretation",
        signal: "damage.payoff",
        use: "damage.payoff.runner",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_004_fetal-ai",
      setId: "proteus",
      collectorNumber: "P004",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
