import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_014_trapdoor"),
    title: "Trapdoor",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Install Trapdoor only on R&D or HQ. *Runner is now encountering the outermost piece of rezzed ice on a subsidiary data fort of your choice, instead of passing Trapdoor. The run is now considered to be a run on that data fort. If there is no rezzed ice on that fort, Runner is considered to have passed the last piece of ice on that fort. Runner automatically breaks this subroutine if there are no subsidiary data forts.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_014_trapdoor",
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
        rezCost: 3,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 3,
      },
    },
    installCapabilities: [
      {
        kind: "install_only_in_hq_or_rd",
        visibility: "public",
      },
    ],
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("subroutine_deflect_to_subsidiary_fort"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "deflect_run",
        target: "subsidiary_data_fort",
        autoBreakIfNoTarget: true,
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
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
        role: "defensive_tool",
      },
      {
        kind: "strategic_role",
        role: "tax_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.central_stabilize",
      },
      {
        kind: "line_support",
        lineKey: "corp.central_stabilize",
        support: "supports",
      },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.central_stabilize",
        role: "defensive_tool",
        roleDetail: "central_run_redirect_defense",
        confidence: "medium",
        rationale:
          "v2: Trapdoor ist nur auf HQ/R&D installierbar und schützt damit tatsächlich zentrale Server.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "run_redirect_tax_ice",
        confidence: "low",
        rationale:
          "The redirect only adds tax when the chosen subsidiary fort actually presents useful known ICE before its newly opened access.",
      },
      {
        kind: "target_preference",
        purpose: "redirect_central_run_to_safe_subsidiary_fort",
        preferences: [
          "reduces_current_run_payoff",
          "adds_relevant_encounter_tax",
          "known_or_rezzed_ice",
        ],
        avoid: ["low_value_accessed_card", "no_subsidiary_fort_target"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_014_trapdoor",
      setId: "classic",
      collectorNumber: "C014",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
