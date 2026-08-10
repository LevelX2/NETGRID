import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_015_vortex"),
    title: "Vortex",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*If you pay [2], Runner is now encountering the outermost piece of rezzed ice on a data fort of your choice, instead of passing Vortex. The run is now considered to be a run on that data fort. If there is no rezzed ice on that fort, Runner is considered to have passed the last piece of ice on that fort.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_015_vortex",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["code_gate", "deflector"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 2,
      },
    },
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("subroutine_paid_deflect_to_data_fort"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "deflect_run",
        target: "any_data_fort",
        cost: {
          kind: "credit",
          amount: 2,
        },
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "build_scoring_remote",
      },
      {
        kind: "plan_role",
        role: "protect_hq",
      },
      {
        kind: "plan_role",
        role: "protect_rnd",
      },
      {
        kind: "strategic_role",
        role: "tax_tool",
      },
      {
        kind: "strategic_role",
        role: "defensive_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.central_stabilize",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.ice_tax_glacier",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.remote_scoring",
      },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      {
        kind: "line_support",
        lineKey: "corp.remote_scoring",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "run_redirect_tax_ice",
        confidence: "high",
        rationale:
          "v2: Redirect erzeugt zusätzliche Encounter-/Tax-Struktur; die Zahlung ist Corp-Kosten-/LegalAction-Semantik, kein Runner-pay-or-end-run.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.remote_scoring",
        role: "defensive_tool",
        roleDetail: "remote_run_redirect_defense",
        confidence: "medium",
        rationale:
          "v2: Redirect kann einen Scoring-Remote verteidigen, bleibt aber fort-/zielabhängig.",
      },
      {
        kind: "target_preference",
        purpose: "redirect_run_to_best_data_fort",
        preferences: [
          "protects_agenda_remote",
          "protects_central_access_pressure",
          "adds_relevant_encounter_tax",
        ],
        avoid: ["hidden_info_dependent_choice", "no_rezzed_ice_target"],
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
      printingId: "onr_classic_015_vortex",
      setId: "classic",
      collectorNumber: "C015",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
