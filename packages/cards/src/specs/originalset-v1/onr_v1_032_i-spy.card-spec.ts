import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_032_i-spy"),
    title: "I Spy",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[T]: Put a Spy counter in a data fort. A Spy counter exposes all cards installed inside or on a fort containing it. The Corp may remove a Spy counter by taking an action to pay 4. Use this ability only immediately after a successful run on that fort.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_032_i-spy",
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
        "runner_utility_longtail_successful_run_fort_counter_expose",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "successful_run_fort_counter_expose",
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "information",
      },
      {
        kind: "plan_role",
        role: "pressure_remote",
      },
      {
        kind: "target_preference",
        purpose: "place_persistent_fort_expose",
        avoid: ["hidden_info_dependent_choice"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_032_i-spy",
      setId: "originalset-v1",
      collectorNumber: "032",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
