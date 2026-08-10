import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_042_panzer-run"),
    title: "Panzer Run",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Gain [4] and draw two cards. Playing a double prep costs two consecutive actions this turn instead of one.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_042_panzer-run",
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
        credits: 1,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        capabilityKey: capabilityKey("on_play_gain_credits_and_draw"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: {
          kind: "printed",
          additionalClicks: 1,
        },
        effects: [
          {
            kind: "gain_credits",
            recipient: "controller",
            amount: 4,
            visibility: "public",
          },
          {
            kind: "draw_cards",
            recipient: "controller",
            amount: 2,
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
        role: "find_economy",
      },
      {
        kind: "plan_role",
        role: "draw_for_answers",
      },
      {
        kind: "tactic_interpretation",
        signal: "draw.card",
        use: "draw.card",
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
          "Migrated from reviewed Classic hint onr_classic_042_panzer-run.",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_042_panzer-run.",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "low",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_042_panzer-run.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_042_panzer-run",
      setId: "classic",
      collectorNumber: "C042",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
