import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_010_cascade"),
    title: "Cascade",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Whenever you make a successful run on R&D, give the Corp a Cascade counter. Every two Cascade counters require the Corp to trash faceup one card stored in R&D at the start of each of its turns. The Corp may remove all Virus counters by forgoing its next three actions.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_010_cascade",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["virus"],
      numeric: {
        installCost: 4,
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
      counterKind: "cascade",
      addOnSuccessfulRun: {
        server: "rd",
        counterScope: { kind: "shared_corp_pool" },
        amount: 1,
        visibility: "public",
      },
      startOfCorpTurn: {
        kind: "trash_top_rd_cards_faceup_per_two_counters",
        perCounters: 2,
        countPerGroup: 1,
        visibility: "hidden_info_barrier",
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
        role: "pressure_rnd",
      },
      {
        kind: "plan_role",
        role: "rnd_deck_denial",
      },
      {
        kind: "plan_role",
        role: "threshold_virus_pressure",
      },
      {
        kind: "risk_interpretation",
        risk: "virus_purge_risk",
        severity: "medium",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_010_cascade",
      setId: "originalset-v1",
      collectorNumber: "010",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
