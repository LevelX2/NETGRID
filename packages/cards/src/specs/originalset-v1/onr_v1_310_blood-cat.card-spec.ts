import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_310_blood-cat"),
    title: "Blood Cat",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "A:Trace 5 -If trace is successful, give Runner a tag.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("abilities_activated_corp_main_trace"),
        actionLabel: "Blood Cat: Trace 5 starten",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_310_blood-cat",
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
        rezCost: 6,
        trashCost: 0,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey("abilities_activated_corp_main_trace"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_main",
        costs: [
          {
            kind: "action",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "trace",
            traceLimit: 5,
            visibility: "public",
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
    ],
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
        roleDetail: "trace_tag_source",
        confidence: "medium",
        rationale:
          "Trace 5 in Tag; kein Trace-Credit-Enabler. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.",
      },
      {
        kind: "remote_role",
        role: "tag_punish_asset",
        threatLevel: "medium",
      },
      {
        kind: "target_preference",
        purpose: "establish_tag_source_in_protected_empty_remote",
        preferences: [
          "best_cards_for_current_plan",
          "use_choice_option_with_visible_board_payoff",
        ],
        avoid: ["option_with_no_visible_current_payoff"],
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "high",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("abilities_activated_corp_main_trace"),
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
      printingId: "onr_v1_310_blood-cat",
      setId: "originalset-v1",
      collectorNumber: "310",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
