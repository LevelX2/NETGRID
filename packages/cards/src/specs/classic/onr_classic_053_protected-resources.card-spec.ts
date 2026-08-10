import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_053_protected-resources"),
    title: "Protected Resources",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[1]: Move any number of bits from your bit pool to Protected Resources. A: Move any number of bits from Protected Resources to your bit pool.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("deposit_hosted_credits"),
        actionLabel: "Protected Resources: Bits einlagern",
      },
      {
        capabilityKey: capabilityKey("withdraw_hosted_credits"),
        actionLabel: "Protected Resources: Bits entnehmen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_053_protected-resources",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["transactions"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: 8,
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
        capabilityKey: capabilityKey("deposit_hosted_credits"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_main",
        costs: [
          {
            kind: "credit",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "transfer_hosted_credits",
            direction: "controller_to_source",
            amount: {
              kind: "x_value",
              min: 1,
            },
            visibility: "public",
          },
        ],
      },
      {
        capabilityKey: capabilityKey("withdraw_hosted_credits"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_main",
        costs: [
          {
            kind: "action",
            amount: 1,
          },
        ],
        condition: {
          kind: "source_has_hosted_credits",
        },
        effects: [
          {
            kind: "transfer_hosted_credits",
            direction: "source_to_controller",
            amount: {
              kind: "x_value",
              min: 1,
            },
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
        role: "remote_asset_economy",
      },
      {
        kind: "strategic_role",
        role: "support_tool",
      },
      {
        kind: "line_support",
        lineKey: "corp.asset_economy",
        support: "supports",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_053_protected-resources.",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_053_protected-resources.",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_053_protected-resources.",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "high",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_053_protected-resources.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_053_protected-resources",
      setId: "classic",
      collectorNumber: "C053",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
