import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_051_vintage-camaro"),
    title: "Vintage Camaro",
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "[1], Forgo your next action: Avoid receiving a tag.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_051_vintage-camaro",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["vehicle"],
      numeric: {
        installCost: 1,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    tagPreventionSources: [
      {
        capabilityKey: capabilityKey("pay_and_forgo_action_avoid_tag"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "avoid_tag",
        amount: 1,
        cost: {
          kind: "credit_and_forgo_next_action",
          amount: 1,
        },
        priority: 130,
        visibility: "public",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "avoid_tags",
      },
      {
        kind: "strategic_role",
        role: "defensive_tool",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "medium",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_051_vintage-camaro",
      setId: "classic",
      collectorNumber: "C051",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
