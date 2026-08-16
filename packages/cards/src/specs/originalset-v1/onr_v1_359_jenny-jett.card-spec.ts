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
      "Whenever the Runner passes the last piece of ice on this fort or declares a run on it when it has no ice, you may choose an ice card stored in HQ. Install that piece of ice on this fort in the innermost position, paying an installation cost of [1] for each piece of ice already on the fort. Runner is now considered to be approaching that piece of ice. Use this ability only once during each run on this fort.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_359_jenny-jett",
      },
      {
        source: "project_ruling",
        reference: "docs/source/Netrunner Errata 1.70.md#Jenny Jett",
        note: "Canonical trigger wording and normal ICE-install cost modifiers.",
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
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "medium",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "fort_run_windows_install_hq_ice_innermost_after_successful_run_before_successful_run_finalizes_on_this_fort",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_hq_ice_for_immediate_innermost_install",
            preferences: [
              "immediate_etr_damage_tag_trash_or_tax_value",
              "affordable_install_and_immediate_rez_route",
              "exploit_visible_runner_breaker_coverage_gap",
              "protect_current_fort_access_value",
            ],
            avoid: [
              "unaffordable_or_effectless_ice",
              "reveal_private_hq_ice_before_selected_install",
            ],
          },
        ],
      },
    ],
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
