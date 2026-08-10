import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_029_gremlins"),
    title: "Gremlins",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Whenever you make a successful run on HQ, give the Corp a Gremlin counter. Every two Gremlin counters decrease the Corp’s hand size by 1. The Corp may remove all Virus counters by forgoing its next three actions.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_029_gremlins",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["virus"],
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
    virusCounter: {
      capabilityKey: capabilityKey("virus_counter"),
      addressability: ["plan", "action", "quote", "debug"],
      counterKind: "gremlin",
      addOnSuccessfulRun: {
        server: "hq",
        target: "source",
        amount: 1,
        visibility: "public",
      },
      continuousEffect: {
        kind: "corp_hand_size_reduce_per_two_counters",
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
        kind: "plan_role",
        role: "remote_upgrade_modifier",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_029_gremlins",
      setId: "originalset-v1",
      collectorNumber: "029",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
