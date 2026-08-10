import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_236_data-raven"),
    title: "Data Raven",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[Subroutine] Trace 5 - If trace is successful, give Runner a tag and a Data Raven counter. Each Data Raven counter gives Runner a tag at the start of each Runner turn. Runner may remove a Data Raven counter by taking an action to pay 1.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_236_data-raven",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["sentry"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 5,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 5,
      },
    },
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("printed_subroutines_trace"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "trace",
        onSuccess: [
          {
            kind: "add_tags",
            recipient: "runner",
            amount: 1,
            visibility: "public",
          },
          {
            kind: "add_counter",
            recipient: "runner",
            counterType: "trace_tag_counter",
            amount: 1,
            visibility: "public",
          },
        ],
        traceLimit: 5,
      },
    ],
    runnerCounterEffects: [
      {
        capabilityKey: capabilityKey(
          "runner_counter_effects_trace_tag_counter",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        counterType: "trace_tag_counter",
        removeCost: 1,
        startOfRunnerTurn: {
          kind: "add_tags",
          amountPerCounter: 1,
          visibility: "public",
        },
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "protect_hq",
      },
      {
        kind: "plan_role",
        role: "protect_rnd",
      },
      {
        kind: "plan_role",
        role: "build_scoring_remote",
      },
      {
        kind: "strategic_role",
        role: "engine_anchor",
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
        role: "engine_anchor",
        roleDetail: "persistent_tag_engine_ice",
        confidence: "high",
        rationale:
          "ICE Semantic Review v1: Data Raven bestätigt corp.tag_trace_punish nur aus konkreten ICE-Funktionssignalen; Subtypen bleiben Kartendaten.",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("printed_subroutines_trace"),
        annotations: [
          {
            kind: "strategy_support",
            strategyKey: "corp.tag_trace_punish",
            role: "anchor_evidence",
            roleDetail: "anchor_evidence_tag_source",
            evidenceAnchor: "tag.source",
            confidence: "high",
          },
          {
            kind: "strategy_support",
            strategyKey: "corp.tag_trace_punish",
            role: "anchor_evidence",
            roleDetail: "anchor_evidence_trace_source",
            evidenceAnchor: "trace.source",
            confidence: "high",
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_236_data-raven",
      setId: "originalset-v1",
      collectorNumber: "236",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
