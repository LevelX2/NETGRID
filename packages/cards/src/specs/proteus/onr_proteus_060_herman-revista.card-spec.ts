import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_060_herman-revista"),
    title: "Herman Revista",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[0]: Rearrange the ice installed on this fort. Use this ability only at the start of a run on this data fort.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_060_herman-revista",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["sysop"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 1,
        trashCost: 4,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    corpUtility: {
      capabilityKey: capabilityKey("start_run_reorder_source_fort_ice"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "fort_start_reorder_ice",
      cost: {
        kind: "credit",
        amount: 0,
      },
      timing: "start_of_run",
      target: "source_fort",
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "build_scoring_remote",
      },
      {
        kind: "strategic_role",
        role: "tax_tool",
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
        roleDetail: "ice_order_control",
        evidenceProfile: "ice_order_control",
        confidence: "medium",
        rationale:
          "Start-of-run ICE reorder improves the tax/glacier run path.",
      },
      {
        kind: "target_preference",
        purpose: "rearrange_fort_ice",
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
      printingId: "onr_proteus_060_herman-revista",
      setId: "proteus",
      collectorNumber: "P060",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
