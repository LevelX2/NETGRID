import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_050_sandbox-dig"),
    title: "Sandbox Dig",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[3], [T]: Look at the top three cards stored in R&D. Hidden resources are installed face down, but are put into the trash face up.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("trash_source_look_at_rd_top_three"),
        actionLabel: "Sandbox Dig: R&D-Spitze ansehen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_050_sandbox-dig",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["hidden"],
      numeric: {
        installCost: 0,
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
    abilities: [
      {
        capabilityKey: capabilityKey("trash_source_look_at_rd_top_three"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "runner_main",
        costs: [
          {
            kind: "credit",
            amount: 3,
          },
          {
            kind: "trash_source",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "private_look",
            zone: "rd",
            count: 3,
            visibility: "hidden_info_barrier",
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
        role: "pressure_rnd",
      },
      {
        kind: "strategic_role",
        role: "enabler",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.rnd_pressure",
      },
      {
        kind: "line_support",
        lineKey: "runner.rnd_pressure",
        support: "supports",
      },
      {
        kind: "target_preference",
        purpose: "private_rnd_top_three_information",
        preferences: ["use_choice_option_with_visible_board_payoff"],
        avoid: ["hidden_info_dependent_choice"],
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_050_sandbox-dig.",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_050_sandbox-dig.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_050_sandbox-dig",
      setId: "classic",
      collectorNumber: "C050",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
