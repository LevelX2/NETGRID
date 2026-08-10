import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_025_fait-accompli"),
    title: "Fait Accompli",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Whenever you make a successful run on a subsidiary data fort, put a Fait counter in that fort. Every two Fait counters in a fort give +1 difficulty to all agendas installed inside that fort. The Corp may remove all Virus counters by forgoing its next three actions.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_025_fait-accompli",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["virus"],
      numeric: {
        installCost: 1,
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
      counterKind: "fait",
      addOnSuccessfulRun: {
        server: "subsidiary_data_fort",
        target: "successful_run_server",
        amount: 1,
        visibility: "public",
      },
      continuousEffect: {
        kind: "agenda_difficulty_increase_per_two_fort_counters",
        perCounters: 2,
        amountPerGroup: 1,
        visibility: "public",
      },
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "tactic_interpretation",
        signal: "corp.remote_protection",
        use: "corp.remote_protection",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_025_fait-accompli",
      setId: "originalset-v1",
      collectorNumber: "025",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
