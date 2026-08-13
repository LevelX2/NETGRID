import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_293_netwatch-credit-voucher"),
    title: "Netwatch Credit Voucher",
    side: "corp",
    cardType: "operation",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Play only if Runner is tagged. Give Runner 1 tag and gain 1.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_293_netwatch-credit-voucher",
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
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: {
        kind: "fixed",
        credits: 0,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey("abilities_on_play_add_tags"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        condition: {
          kind: "runner_is_tagged",
        },
        effects: [
          {
            kind: "add_tags",
            recipient: "runner",
            amount: 1,
            visibility: "public",
          },
          {
            kind: "gain_credits",
            recipient: "controller",
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
        roleDetail: "additional_tag_minor_credit_followup",
        confidence: "medium",
        rationale:
          "Operations Semantic Review v2: tag_snowball_followup / minor_economy. Review-v2-Rolle tag_snowball_followup wird als validierbare Hauptrolle enabler mit roleDetail gespeichert.",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "low",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("abilities_on_play_add_tags"),
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
      printingId: "onr_v1_293_netwatch-credit-voucher",
      setId: "originalset-v1",
      collectorNumber: "293",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
