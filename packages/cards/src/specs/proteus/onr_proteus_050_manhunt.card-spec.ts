import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_050_manhunt"),
    title: "Manhunt",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Play only if Runner attempted a run during his or her last turn. Trace 6-If trace is successful, give Runner one tag for each point by which your trace exceeded his or her link.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_050_manhunt",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["gray_ops"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: {
        kind: "fixed",
        credits: 4,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey("on_play_trace_six_tags_by_margin"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        condition: {
          kind: "runner_attempted_run_last_turn",
          minimumRuns: 1,
        },
        effects: [
          {
            kind: "trace",
            visibility: "public",
            onSuccess: [
              {
                kind: "add_tags_by_trace_margin_over_runner_link",
                recipient: "runner",
                visibility: "public",
              },
            ],
            traceLimit: 6,
          },
        ],
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
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
        roleDetail: "scaling_trace_margin_tag_source",
        evidenceProfile: "scaling_trace_margin_tag_source",
        confidence: "high",
        rationale:
          "Operations Semantic Review v2: scaling_trace_tag_source. Review-v2-Rolle trace_tag_source wird als validierbare Hauptrolle enabler mit roleDetail gespeichert.",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("on_play_trace_six_tags_by_margin"),
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
      printingId: "onr_proteus_050_manhunt",
      setId: "proteus",
      collectorNumber: "P050",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
