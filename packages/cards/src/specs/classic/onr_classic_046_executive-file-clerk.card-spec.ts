import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_046_executive-file-clerk"),
    title: "Executive File Clerk",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[2],[T]: Look at all cards stored in HQ. Hidden resources are installed face down, but are put into the trash face up.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("trash_source_look_at_hq"),
        actionLabel: "Executive File Clerk: HQ ansehen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_046_executive-file-clerk",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["connection", "hidden"],
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
        capabilityKey: capabilityKey("trash_source_look_at_hq"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "runner_paid",
        costs: [
          {
            kind: "credit",
            amount: 2,
          },
          {
            kind: "trash_source",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "private_look",
            zone: "hq",
            count: "all",
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
        role: "pressure_hq",
      },
      {
        kind: "strategic_role",
        role: "enabler",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.hq_pressure",
      },
      {
        kind: "line_support",
        lineKey: "runner.hq_pressure",
        support: "supports",
      },
      {
        kind: "target_preference",
        purpose: "private_hq_full_information",
        preferences: ["use_choice_option_with_visible_board_payoff"],
        avoid: ["hidden_info_dependent_choice"],
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
      printingId: "onr_classic_046_executive-file-clerk",
      setId: "classic",
      collectorNumber: "C046",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
