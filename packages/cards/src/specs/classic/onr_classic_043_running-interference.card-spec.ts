import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_043_running-interference"),
    title: "Running Interference",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Make a run. During that run, the Corp must pay [X], in addition to the normal cost, to rez each piece of ice, where X is the rez cost of that piece of ice. Playing a double prep costs two consecutive actions this turn instead of one.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_043_running-interference",
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
        capabilityKey: capabilityKey("on_play_run_with_rez_surcharge"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: {
          kind: "printed",
          additionalClicks: 1,
        },
        effects: [
          {
            kind: "make_run",
            target: {
              kind: "chosen_server",
            },
            corpRezCostSurcharge: {
              kind: "matching_printed_rez_cost",
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
        role: "pressure_remote",
      },
      {
        kind: "plan_role",
        role: "tax_corp_rez",
      },
      {
        kind: "strategic_role",
        role: "tax_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.run_event_tempo",
      },
      {
        kind: "line_support",
        lineKey: "runner.remote_contest",
        support: "supports",
      },
      {
        kind: "line_support",
        lineKey: "runner.run_event_tempo",
        support: "supports",
      },
      {
        kind: "target_preference",
        purpose: "choose_server_for_rez_surcharge_run",
        preferences: [
          "protects_agenda_remote",
          "current_run_path_relevance",
          "high_rez_cost_relief",
        ],
        avoid: ["hidden_info_dependent_choice", "irrelevant_server_ice"],
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_043_running-interference.",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "medium",
        rationale:
          "Migrated from reviewed Classic hint onr_classic_043_running-interference.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_043_running-interference",
      setId: "classic",
      collectorNumber: "C043",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
