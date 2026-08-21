import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_369_singapore-city-grid"),
    title: "Singapore City Grid",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Swap a piece of unrezzed ice on this fort with an ice card stored in HQ. The new ice card comes into play concealed. Use this ability only once during each run on this fort.\nRez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_369_singapore-city-grid",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["region"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: 5,
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
          "fort_run_windows_swap_unrezzed_fort_ice_with_hq_ice_during_run_on_this_fort",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "swap_unrezzed_fort_ice_with_hq_ice",
        timing: "during_run_on_this_fort",
        target: "unrezzed_ice_on_this_fort",
        hqCard: "ice",
        replacementEnters: "concealed_unrezzed",
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
        roleDetail: "hq_ice_swap_support",
        confidence: "medium",
        rationale:
          "Region version of HQ ICE swap; improves run-path control without inserting an additional ICE.",
      },
      {
        kind: "remote_role",
        role: "run_tax",
        threatLevel: "medium",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "fort_run_windows_swap_unrezzed_fort_ice_with_hq_ice_during_run_on_this_fort",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "swap_unrezzed_fort_ice_with_hq_ice",
            preferences: [
              "relevant_server_ice",
              "blocks_relevant_run_path",
              "adds_relevant_encounter_tax",
              "protects_agenda_remote",
            ],
            avoid: ["irrelevant_server_ice", "low_impact_ice"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_369_singapore-city-grid",
      setId: "originalset-v1",
      collectorNumber: "369",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
