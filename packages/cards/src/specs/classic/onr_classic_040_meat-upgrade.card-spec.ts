import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_040_meat-upgrade"),
    title: "Meat Upgrade",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Remove up to two tags, at no cost, and draw three cards. Playing a double prep costs two consecutive actions this turn instead of one.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_040_meat-upgrade",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["double"],
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
        credits: 2,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey("on_play_remove_tags_and_draw"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: {
          kind: "printed",
          additionalClicks: 1,
        },
        effects: [
          {
            kind: "remove_tags",
            recipient: "runner",
            mode: "up_to_amount",
            amount: 2,
            visibility: "public",
          },
          {
            kind: "draw_cards",
            recipient: "controller",
            amount: 3,
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
        role: "draw_for_answers",
      },
      {
        kind: "strategic_role",
        role: "defensive_tool",
      },
      {
        kind: "line_support",
        lineKey: "runner.survival_defense",
        support: "supports",
      },
      {
        kind: "tactic_interpretation",
        signal: "draw.card",
        use: "draw.card",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_040_meat-upgrade.",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_040_meat-upgrade.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_040_meat-upgrade",
      setId: "classic",
      collectorNumber: "C040",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
