import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_051_rabbit"),
    title: "Rabbit",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Ice that attempts to trace you has its trace limit reduced by 1.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_051_rabbit",
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
        "runner_utility_longtail_rabbit_ice_trace_limit_reduction",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "rabbit_ice_trace_limit_reduction",
      amount: 1,
      visibility: "public",
    },
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_051_rabbit",
      setId: "originalset-v1",
      collectorNumber: "051",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
