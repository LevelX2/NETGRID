import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_354_crybaby"),
    title: "Crybaby",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "When Runner accesses Crybaby, give Runner a Crying counter. Each Crying counter reduces Runner's link by 2 during each trace attempt. Runner can remove a Crying counter by taking an action to pay [2].",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_354_crybaby",
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
        rezCost: 1,
        trashCost: 2,
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
          "access_effects_on_access_add_runner_counter",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_access",
        sourceZones: ["installed"],
        effects: [
          {
            kind: "add_runner_counter",
            counterType: "crying",
            amount: 1,
            visibility: "hidden_info_barrier",
          },
        ],
        visibility: "hidden_info_barrier",
      },
    ],
    runnerCounterEffects: [
      {
        capabilityKey: capabilityKey("runner_counter_effects_crying"),
        addressability: ["plan", "action", "quote", "debug"],
        counterType: "crying",
        removeCost: 2,
      },
    ],
    remainingReplacementLongtail: {
      capabilityKey: capabilityKey(
        "remaining_replacement_longtail_link_reduction_counter_upgrade",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "link_reduction_counter_upgrade",
      counterType: "crying",
      linkReductionPerCounter: 2,
      removeCost: 2,
      visibility: "public",
    },
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
        kind: "strategic_role",
        role: "enabler",
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
        kind: "line_support",
        lineKey: "corp.tag_trace_punish",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ambush_bluff",
        role: "punish_payoff",
        roleDetail: "access_trace_link_counter",
        confidence: "medium",
        rationale: "Access gives a persistent link penalty counter.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.tag_trace_punish",
        role: "enabler",
        roleDetail: "persistent_trace_link_penalty",
        confidence: "medium",
        rationale:
          "Link reduction strengthens later trace/tag lines without creating tags itself.",
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
        rating: "medium",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_354_crybaby",
      setId: "originalset-v1",
      collectorNumber: "354",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
