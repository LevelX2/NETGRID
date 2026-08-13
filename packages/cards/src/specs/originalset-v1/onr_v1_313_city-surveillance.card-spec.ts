import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_313_city-surveillance"),
    title: "City Surveillance",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "For each card Runner draws, give Runner a tag unless Runner pays 1, in addition to any other costs, to avoid receiving that tag. You may rez City Surveillance just before the card is drawn.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_313_city-surveillance",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["gray ops"],
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
    remainingReplacementLongtail: {
      capabilityKey: capabilityKey(
        "remaining_replacement_longtail_runner_draw_tax_tag",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "runner_draw_tax_tag",
      avoidTagCost: 1,
      visibility: "public",
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
        roleDetail: "persistent_tag_source",
        confidence: "high",
        rationale:
          "Persistent draw-linked tag pressure is a tag source, not a tagged payoff. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.",
      },
      {
        kind: "remote_role",
        role: "tag_punish_asset",
        threatLevel: "medium",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "remaining_replacement_longtail_runner_draw_tax_tag",
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
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_313_city-surveillance",
      setId: "originalset-v1",
      collectorNumber: "313",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
