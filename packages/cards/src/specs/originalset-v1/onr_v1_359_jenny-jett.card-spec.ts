import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_359_jenny-jett"),
    title: "Jenny Jett",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Whenever Runner makes a successful run on this fort, you may choose an ice card stored in HQ. Install that piece of ice on this fort in the innermost position, \tpaying an installation cost of [1] for each piece of ice already on the fort. Runner is now considered to be approaching that piece of ice. Use this ability only once during each run on this fort.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_359_jenny-jett",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["sysop"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 1,
        trashCost: 1,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    fortRunWindows: [
      {
        capabilityKey: capabilityKey(
          "fort_run_windows_install_hq_ice_innermost_after_successful_run_before_successful_run_finalizes_on_this_fort",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "install_hq_ice_innermost_after_successful_run",
        timing: "before_successful_run_finalizes_on_this_fort",
        hqCard: "ice",
        installCost: "one_per_existing_ice_on_fort",
        limit: "once_per_run_per_source",
        visibility: "hidden_info_barrier",
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
        role: "remote_upgrade_reactive_defense",
      },
      {
        kind: "plan_role",
        role: "build_scoring_remote",
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
        roleDetail: "successful_run_hq_ice_insert",
        confidence: "medium",
        rationale:
          "Installs HQ ICE during the run and increases server structure.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.remote_scoring",
        role: "defensive_tool",
        roleDetail: "successful_run_hq_ice_insert_defense",
        confidence: "high",
        rationale:
          "Can block or tax access after an apparently successful remote run.",
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
        purpose: "install_hq_ice_innermost_on_fort",
        preferences: [],
        avoid: ["hidden_info_dependent_choice"],
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
      printingId: "onr_v1_359_jenny-jett",
      setId: "originalset-v1",
      collectorNumber: "359",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
