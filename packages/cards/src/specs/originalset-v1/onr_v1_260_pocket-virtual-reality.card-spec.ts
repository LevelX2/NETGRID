import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_260_pocket-virtual-reality"),
    title: "Pocket Virtual Reality",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[Subroutine] Trace 6 - If trace is successful, give Runner a tag.\n[Subroutine] Trace 6 - If trace is successful, give Runner a tag.\nWhenever Pocket Virtual Reality is encountered, gain [4]. Use these bits only to pay for the above traces. When the encounter ends, return to the bank any of the [4] you did not spend.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_260_pocket-virtual-reality",
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
        rezCost: 7,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 4,
      },
    },
    iceEncounter: {
      capabilityKey: capabilityKey(
        "ice_encounter_add_encounter_temporary_credits",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "add_encounter_temporary_credits",
      side: "corp",
      amount: 4,
      usableFor: "this_ice_printed_trace_subroutines",
      returnUnusedAtEncounterEnd: true,
      visibility: "public",
    },
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("printed_subroutines_trace"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "trace",
        traceLimit: 6,
        onSuccess: [
          {
            kind: "add_tags",
            recipient: "runner",
            amount: 1,
            visibility: "public",
          },
        ],
      },
      {
        capabilityKey: capabilityKey("printed_subroutines_trace_a"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "trace",
        traceLimit: 6,
        onSuccess: [
          {
            kind: "add_tags",
            recipient: "runner",
            amount: 1,
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
        role: "defend_server",
      },
      {
        kind: "plan_role",
        role: "tag_pressure",
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
        roleDetail: "encounter_trace_tag_credit_ice",
        confidence: "high",
        rationale:
          "v2: Zwei Trace-6-Tag-Subroutinen mit encounter-lokalem Trace-Credit-Pool sind ein klarer Tag/Trace-Enabler.",
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
        ],
      },
      {
        capabilityKey: capabilityKey("printed_subroutines_trace_a"),
        annotations: [
          {
            kind: "strategy_support",
            strategyKey: "corp.tag_trace_punish",
            role: "anchor_evidence",
            roleDetail: "anchor_evidence_tag_source",
            evidenceAnchor: "tag.source",
            confidence: "high",
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_260_pocket-virtual-reality",
      setId: "originalset-v1",
      collectorNumber: "260",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
