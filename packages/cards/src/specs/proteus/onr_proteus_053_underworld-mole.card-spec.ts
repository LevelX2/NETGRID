import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_053_underworld-mole"),
    title: "Underworld Mole",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Play only if Runner installed any resources during his or her last turn. Trace 4-If trace is successful, trash a resource Runner installed during his or her last turn and give Runner a tag.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_053_underworld-mole",
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
        credits: 6,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "on_play_trace_trash_recent_resource_add_tag",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        condition: {
          kind: "runner_installed_resource_last_turn",
        },
        effects: [
          {
            kind: "trace",
            baseTraceStrength: 4,
            visibility: "public",
            onSuccess: [
              {
                kind: "trash_runner_resource_and_add_tag",
                target: "runner_resource_installed_last_turn",
                visibility: "public",
              },
            ],
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
        kind: "strategic_role",
        role: "enabler",
      },
      {
        kind: "strategic_role",
        role: "support_tool",
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
        roleDetail: "resource_install_retaliatory_trace_tag_source",
        evidenceProfile: "resource_install_retaliatory_trace_tag_source",
        confidence: "medium",
        rationale:
          "Operations Semantic Review v2: conditional_trace_tag_source / resource_trash. Review-v2-Rolle trace_tag_source wird als validierbare Hauptrolle enabler mit roleDetail gespeichert.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.tag_trace_punish",
        role: "support_tool",
        roleDetail: "trace_success_recent_resource_trash",
        evidenceProfile: "trace_success_recent_resource_trash",
        confidence: "medium",
        rationale:
          "Operations Semantic Review v2: conditional_trace_tag_source / resource_trash. Review-v2-Rolle disruption_tool wird als validierbare Hauptrolle support_tool mit roleDetail gespeichert.",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "on_play_trace_trash_recent_resource_add_tag",
        ),
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
      printingId: "onr_proteus_053_underworld-mole",
      setId: "proteus",
      collectorNumber: "P053",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
