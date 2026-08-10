import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_357_dieter-esslin"),
    title: "Dieter Esslin",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "When Runner accesses Dieter Esslin, Dieter does 1 Net damage.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_357_dieter-esslin",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["ambush", "sysop"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: 3,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    accessEffects: [
      {
        capabilityKey: capabilityKey("access_effects_on_access_damage"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_access",
        sourceZones: ["installed"],
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "damage",
            recipient: "runner",
            damageType: "net",
            amount: 1,
            preventable: true,
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "remote_upgrade_trap",
      },
      {
        kind: "strategic_role",
        role: "punish_payoff",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.ambush_bluff",
      },
      {
        kind: "line_support",
        lineKey: "corp.ambush_bluff",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ambush_bluff",
        role: "punish_payoff",
        roleDetail: "access_net_damage_payoff",
        confidence: "medium",
        rationale:
          "One net damage is an access ambush payoff, not a damage-kill anchor by itself.",
      },
      {
        kind: "tactic_interpretation",
        signal: "remote.ambush",
        use: "remote.ambush",
      },
      {
        kind: "tactic_interpretation",
        signal: "access.punish",
        use: "access.punish",
      },
      {
        kind: "tactic_interpretation",
        signal: "damage.payoff",
        use: "damage.payoff.runner",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_357_dieter-esslin",
      setId: "originalset-v1",
      collectorNumber: "357",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
