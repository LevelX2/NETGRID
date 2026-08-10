import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_061_ldl-traffic-analyzers"),
    title: "LDL Traffic Analyzers",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "You may advance LDL Traffic Analyzers before and after you rez it. You may rez LDL Traffic Analyzers during a trace attempt. LDL Traffic Analyzers advancement counter: Gain [5]. Use this ability only during a trace attempt. When the trace attempt ends, return to the bank any of the [5] you did not spend.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "trace_window_spend_advancement_for_trace_credits",
        ),
        actionLabel:
          "LDL Traffic Analyzers: 1 Advancement-Counter für 5 Trace-Credits ausgeben",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_061_ldl-traffic-analyzers",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["asset", "node"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: 4,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    advanceable: {
      while: "installed_before_and_after_rez",
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "trace_window_spend_advancement_for_trace_credits",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_trace_window",
        costs: [
          {
            kind: "advancement_counter",
            amount: 1,
            source: "source",
          },
        ],
        condition: {
          kind: "source_has_advancement_counters",
          minimum: 1,
        },
        effects: [
          {
            kind: "gain_temporary_trace_credits",
            recipient: "corp",
            amount: 5,
            usableFor: "current_trace",
            cleanup: "trace_end",
            visibility: "public",
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
        role: "recover_economy",
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
        evidenceProfile: "trace_credit_enabler",
        confidence: "medium",
        rationale:
          "Advancement counters convert to trace-only temporary credits; not a tag source.",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "medium",
        rationale:
          "Migrated from reviewed Proteus hint onr_proteus_061_ldl-traffic-analyzers.",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "medium",
        rationale:
          "Migrated from reviewed Proteus hint onr_proteus_061_ldl-traffic-analyzers.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_061_ldl-traffic-analyzers",
      setId: "proteus",
      collectorNumber: "P061",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
