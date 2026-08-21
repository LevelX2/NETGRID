import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_011_glacier"),
    title: "Glacier",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Rezzing Glacier cost 1 agenda point, in addition to the normal cost. *End the run. *End the run. [1]: Move Glacier to the outermost position of any other data fort. Use this ability only at the start of a run. You may use this ability even if Glacier is unrezzed, in which case, you reveal it.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_011_glacier",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["wall"],
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
        value: 5,
      },
    },
    selfRezAdditionalCosts: [
      {
        kind: "agenda_point",
        amount: 1,
        visibility: "public",
      },
    ],
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("subroutine_end_run_a"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "end_the_run",
      },
      {
        capabilityKey: capabilityKey("subroutine_end_run_b"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "end_the_run",
      },
    ],
    fortRunWindows: [
      {
        capabilityKey: capabilityKey("start_run_move_to_other_fort"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "move_self_to_outermost_position_on_other_fort",
        timing: "start_of_run",
        cost: {
          kind: "credit",
          amount: 1,
        },
        target: "outermost_position_on_other_data_fort",
        revealIfUnrezzed: true,
        visibility: "public",
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
        kind: "strategy_anchor",
        strategyKey: "corp.ice_tax_glacier",
      },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "mobile_fort_ice",
        confidence: "medium",
        rationale:
          "v2: Mobile Fort-ICE ist ein klarer Glacier-/Tax-Baustein; central/remote sind Einsatzorte, keine eigenständigen Strategieanker.",
      },
      {
        kind: "target_preference",
        purpose: "move_mobile_ice_to_relevant_server_position",
        preferences: [
          "protects_agenda_remote",
          "protects_central_access_pressure",
          "current_run_path_relevance",
        ],
        avoid: ["irrelevant_server_ice"],
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "high",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "high",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_011_glacier",
      setId: "classic",
      collectorNumber: "C011",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
