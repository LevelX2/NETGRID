import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_330_krumz"),
    title: "Krumz",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Put [1] from the bank on Krumz when you rez it. Use this bit only to pay for traces. If you use this bit, replace it at the start of your next turn.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_330_krumz",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["ai"],
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
    lifecycle: {
      on_rez: [
        {
          kind: "add_hosted_credits",
          target: "source",
          amount: 1,
          visibility: "public",
        },
      ],
    },
    corpUtility: {
      capabilityKey: capabilityKey(
        "corp_utility_recurring_trace_credit_pool_bit",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "recurring_trace_credit_pool",
      amount: 1,
      counterType: "bit",
      spendWindow: "trace",
      refresh: "start_of_corp_turn_after_use",
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "remote_asset_pressure",
      },
      {
        kind: "strategic_role",
        role: "enabler",
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
        confidence: "low",
        rationale:
          "Small recurring trace-only credit support; not a tag source.",
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
      printingId: "onr_v1_330_krumz",
      setId: "originalset-v1",
      collectorNumber: "330",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
