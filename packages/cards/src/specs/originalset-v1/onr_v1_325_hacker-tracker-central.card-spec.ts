import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_325_hacker-tracker-central"),
    title: "Hacker Tracker Central",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "After each trace attempt, whether successful or not, put 1 from the bank on Hacker Tracker Central. During a trace attempt, each bit you spend from Hacker Tracker Central increases by 1 both your trace strength and your trace limit.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_325_hacker-tracker-central",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["asset"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: 2,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    remainingReplacementLongtail: {
      capabilityKey: capabilityKey(
        "remaining_replacement_longtail_trace_bit_counter_pool_asset",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "trace_bit_counter_pool_asset",
      counterType: "bit",
      addAfterTrace: 1,
      visibility: "public",
      traceValueAndLimitPerBit: 1,
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "remote_asset_modifier",
      },
      {
        kind: "strategic_role",
        role: "enabler",
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
        role: "enabler",
        roleDetail: "trace_credit_enabler",
        confidence: "medium",
        rationale:
          "Trace-specific credit/limit support enables trace lines but is not a tag source itself.",
      },
      {
        kind: "remote_role",
        role: "tag_punish_asset",
        threatLevel: "medium",
      },
      {
        kind: "target_preference",
        purpose: "establish_fort_trace_support",
        preferences: ["protects_agenda_remote"],
        avoid: [],
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
      printingId: "onr_v1_325_hacker-tracker-central",
      setId: "originalset-v1",
      collectorNumber: "325",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
