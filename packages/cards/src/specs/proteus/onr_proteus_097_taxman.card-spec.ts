import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_097_taxman"),
    title: "Taxman",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "After each successful run on HQ, give the Corp a Tax counter. Every two Tax counters cause the Corp to lose [1] at the start of each of its turns. The Corp may remove all Virus counters at any time, but must then forgo its next three actions.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_097_taxman",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["virus"],
      numeric: {
        installCost: 3,
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
      capabilityKey: capabilityKey("hq_success_add_tax_counter"),
      addressability: ["plan", "action", "quote", "debug"],
      counterKind: "tax",
      addOnSuccessfulRun: {
        server: "hq",
        counterScope: { kind: "shared_corp_pool" },
        amount: 1,
        visibility: "public",
      },
      startOfCorpTurn: {
        kind: "lose_credits_per_counter_group",
        counterSource: "corp_purgeable_runner_virus_counter",
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
        role: "build_rig",
      },
      {
        kind: "plan_role",
        role: "safe_probe_run",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_097_taxman",
      setId: "proteus",
      collectorNumber: "P097",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
