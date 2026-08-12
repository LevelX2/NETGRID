import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_013_cockroach"),
    title: "Cockroach",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Whenever you make a successful run on HQ, give the Corp a Cockroach counter. Two or more Cockroach counters cause all discards from HQ to become random. The Corp may remove all Virus counters by forgoing its next three actions.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_013_cockroach",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["virus"],
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
    virusCounter: {
      capabilityKey: capabilityKey("virus_counter"),
      addressability: ["plan", "action", "quote", "debug"],
      counterKind: "cockroach",
      addOnSuccessfulRun: {
        server: "hq",
        counterScope: { kind: "shared_corp_pool" },
        amount: 1,
        visibility: "public",
      },
      continuousEffect: {
        kind: "randomize_corp_hq_discards_at_threshold",
        threshold: 2,
        visibility: "public",
      },
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "build_rig",
      },
      {
        kind: "plan_role",
        role: "pressure_hq",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_013_cockroach",
      setId: "originalset-v1",
      collectorNumber: "013",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
