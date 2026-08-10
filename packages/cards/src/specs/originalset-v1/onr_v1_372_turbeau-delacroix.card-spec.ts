import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_372_turbeau-delacroix"),
    title: "Turbeau Delacroix",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Trace 10-If trace is successful, give Runner a tag. Use this ability only when Runner accesses Turbeau Delacroix, and only once during each run on this fort.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_372_turbeau-delacroix",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["ambush", "sysop"],
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
        capabilityKey: capabilityKey("access_effects_on_access_trace"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_access",
        sourceZones: ["installed"],
        effects: [
          {
            kind: "trace",
            onSuccess: [
              {
                kind: "add_tags",
                recipient: "runner",
                amount: 1,
                visibility: "public",
              },
            ],
            limit: "once_per_run_on_this_fort_per_source",
            visibility: "hidden_info_barrier",
            traceLimit: 10,
          },
        ],
        visibility: "hidden_info_barrier",
      },
    ],
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
        roleDetail: "access_trace_tag_source",
        confidence: "high",
        rationale:
          "Trace 10 on access can give a tag and is a clear tag/trace enabler.",
      },
      {
        kind: "tactic_interpretation",
        signal: "remote.ambush",
        use: "remote.ambush",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "very_high",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("access_effects_on_access_trace"),
        annotations: [
          {
            kind: "strategy_support",
            strategyKey: "corp.tag_trace_punish",
            role: "anchor_evidence",
            roleDetail: "anchor_evidence_tag_source",
            evidenceAnchor: "tag.source",
            confidence: "medium",
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_372_turbeau-delacroix",
      setId: "originalset-v1",
      collectorNumber: "372",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
