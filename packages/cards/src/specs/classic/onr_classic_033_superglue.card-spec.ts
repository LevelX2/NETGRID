import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_033_superglue"),
    title: "Superglue",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[T]: Derez a piece of ice. Use this ability only if you have just broken all the subroutines of that piece of ice.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_033_superglue",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: [],
      numeric: {
        installCost: 2,
        memoryCost: 1,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    runnerUtilityLongtail: {
      capabilityKey: capabilityKey("derez_fully_broken_passed_ice"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "derez_fully_broken_passed_ice",
      cost: {
        kind: "trash_source",
      },
      timing: "after_passing_fully_broken_ice",
      target: "that_ice",
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "target_preference",
        purpose: "derez_just_fully_broken_ice",
        preferences: [
          "current_encounter_ice",
          "known_or_rezzed_ice",
          "high_rez_cost_relief",
          "blocks_relevant_run_path",
        ],
        avoid: [
          "unknown_low_information_target",
          "irrelevant_server_ice",
          "hidden_info_dependent_choice",
        ],
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "low",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_033_superglue",
      setId: "classic",
      collectorNumber: "C033",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
