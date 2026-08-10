import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_358_dr-dreff"),
    title: "Dr. Dreff",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Whenever Runner makes a successful run on this fort, you may choose an ice card stored in HQ. Pay half of that card's rez cost, rounded down, to force Runner to encounter it; the run is not considered successful unless Runner passes that piece of ice. Trash that ice after the encounter ends. Use this ability only once during each run on this fort.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_358_dr-dreff",
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
        rezCost: 0,
        trashCost: 3,
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
          "fort_run_windows_temporary_hq_ice_encounter_after_successful_run_before_successful_run_finalizes_on_this_fort",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "temporary_hq_ice_encounter_after_successful_run",
        timing: "before_successful_run_finalizes_on_this_fort",
        hqCard: "ice",
        cost: "half_rez_cost_rounded_down",
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
        role: "remote_upgrade_tax",
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
        roleDetail: "successful_run_temporary_hq_ice_encounter",
        confidence: "medium",
        rationale:
          "Forces an additional temporary ICE encounter from HQ after an apparent successful run; taxes the run path without actually installing the ICE.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.remote_scoring",
        role: "defensive_tool",
        roleDetail: "successful_run_temporary_hq_ice_encounter_defense",
        confidence: "high",
        rationale:
          "Can revoke a successful remote run unless the Runner also passes the temporary HQ ICE encounter.",
      },
      {
        kind: "remote_role",
        role: "run_tax",
        threatLevel: "medium",
      },
      {
        kind: "target_preference",
        purpose: "choose_hq_ice_for_temporary_encounter",
        preferences: [],
        avoid: ["hidden_info_dependent_choice"],
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_358_dr-dreff",
      setId: "originalset-v1",
      collectorNumber: "358",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
