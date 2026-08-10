import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_353_chimera"),
    title: "Chimera",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "When Runner accesses Chimera, trash a daemon.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_353_chimera",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["ambush"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 2,
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
        capabilityKey: capabilityKey(
          "access_effects_on_access_trash_installed_runner_cards",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_access",
        sourceZones: ["installed"],
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "trash_installed_runner_cards",
            target: "daemon",
            amount: 1,
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
        role: "build_scoring_remote",
      },
      {
        kind: "plan_role",
        role: "bait_runner",
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
        roleDetail: "access_daemon_trash",
        confidence: "medium",
        rationale:
          "Access punish against Daemon programs fits ambush/bluff but is target-dependent.",
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
        kind: "target_preference",
        purpose: "trash_daemon",
        preferences: [],
        avoid: ["hidden_info_dependent_choice"],
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "high",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_353_chimera",
      setId: "originalset-v1",
      collectorNumber: "353",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
