import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId(
      "onr_v1_370_tesseract-fort-construction",
    ),
    title: "Tesseract Fort Construction",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      'All ice on this fort has an additional subroutine, "*End the run unless Runner pays [1]," after all other subroutines.',
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_370_tesseract-fort-construction",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 2,
        trashCost: 3,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    modifiers: [
      {
        kind: "additional_subroutine",
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
        appliesTo: {
          side: "corp",
          cardType: "ice",
          sameServerAsSource: true,
        },
        append: "after_existing",
        subroutine: {
          kind: "end_the_run_unless_runner_pays",
          amount: 1,
          visibility: "public",
        },
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "remote_upgrade_support",
      },
      {
        kind: "plan_role",
        role: "remote_upgrade_tax",
      },
      {
        kind: "strategic_role",
        role: "engine_anchor",
      },
      {
        kind: "strategic_role",
        role: "defensive_tool",
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
        kind: "line_support",
        lineKey: "corp.remote_scoring",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "engine_anchor",
        roleDetail: "fort_subroutine_tax_engine",
        confidence: "high",
        rationale:
          "Fort-wide pay-or-end-run subroutine on every ICE is deck-shaping tax/glacier support.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.remote_scoring",
        role: "defensive_tool",
        roleDetail: "fort_subroutine_remote_protection",
        confidence: "medium",
        rationale: "Additional subroutine directly protects scoring remotes.",
      },
      {
        kind: "tactic_interpretation",
        signal: "corp.remote_protection",
        use: "corp.remote_protection",
      },
      {
        kind: "remote_role",
        role: "scoring_protection",
        threatLevel: "high",
      },
      {
        kind: "target_preference",
        purpose: "add_etr_subroutine_to_fort_ice",
        preferences: [
          "protects_agenda_remote",
          "protects_central_access_pressure",
          "server_relevant_to_current_plan",
          "adds_relevant_encounter_tax",
        ],
        avoid: ["option_with_no_visible_current_payoff"],
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "medium",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_370_tesseract-fort-construction",
      setId: "originalset-v1",
      collectorNumber: "370",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
