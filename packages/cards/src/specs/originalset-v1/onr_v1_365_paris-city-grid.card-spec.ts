import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_365_paris-city-grid"),
    title: "Paris City Grid",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Put [3] from the bank on Paris City Grid when you rez it. Use these bits only to pay for traces made during runs on this fort. If you use any of these bits, replace them at the start of your next turn. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_365_paris-city-grid",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["region"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 2,
        trashCost: 6,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    fortRunWindows: [
      {
        capabilityKey: capabilityKey(
          "fort_run_windows_corp_trace_bits_during_runs_on_this_fort_bit_during_run_on_this_fort",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "corp_trace_bits_during_runs_on_this_fort",
        timing: "during_run_on_this_fort",
        amount: 3,
        counterType: "bit",
        refresh: "start_of_corp_turn_after_use",
        visibility: "public",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "remote_upgrade_tax",
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
        confidence: "high",
        rationale:
          "Recurring trace-credit pool on this fort strengthens trace/tag strategies.",
      },
      {
        kind: "remote_role",
        role: "run_tax",
        threatLevel: "medium",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "low",
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
      printingId: "onr_v1_365_paris-city-grid",
      setId: "originalset-v1",
      collectorNumber: "365",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
