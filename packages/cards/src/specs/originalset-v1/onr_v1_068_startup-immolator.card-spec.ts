import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_068_startup-immolator"),
    title: "Startup Immolator",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[T]: Pay the rez cost of a piece of ice to trash that piece of ice. Use this ability only if you have just broken all the subroutines of that piece of ice.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_068_startup-immolator",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
      numeric: {
        installCost: 0,
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
      capabilityKey: capabilityKey(
        "runner_utility_longtail_trash_fully_broken_passed_ice_after_passing_fully_broken_ice",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "trash_fully_broken_passed_ice",
      timing: "after_passing_fully_broken_ice",
      target: "that_ice",
      costs: [
        { kind: "trash_source", amount: 1 },
        { kind: "target_rez_cost", target: "that_ice" },
      ],
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "target_preference",
        purpose: "trash_fully_broken_ice",
        preferences: ["current_encounter_ice"],
        avoid: ["hidden_info_dependent_choice"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_068_startup-immolator",
      setId: "originalset-v1",
      collectorNumber: "068",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
