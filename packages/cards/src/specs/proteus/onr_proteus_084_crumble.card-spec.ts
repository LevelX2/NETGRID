import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_084_crumble"),
    title: "Crumble",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "After each successful run on HQ, give the Corp a Crumble counter. Two or more Crumble counters allow you trash, at no cost, any cards accessed from HQ, even if the cards cannot normally be trashed. The Corp may remove all Virus counters at any time, but must then forgo its next three actions.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_084_crumble",
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
      capabilityKey: capabilityKey("hq_success_add_crumble_counter"),
      addressability: ["plan", "action", "quote", "debug"],
      counterKind: "crumble",
      addOnSuccessfulRun: {
        server: "hq",
        counterScope: { kind: "shared_corp_pool" },
        amount: 1,
        visibility: "public",
      },
      accessTrash: {
        kind: "free_trash_accessed_card_at_counter_threshold",
        server: "hq",
        counterSource: "corp_purgeable_runner_virus_counter",
        threshold: 2,
        includeNormallyUntrashable: true,
        counterRemoval: { timing: "none" },
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
        kind: "strategic_role",
        role: "payoff_anchor",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.hq_pressure",
      },
      {
        kind: "line_support",
        lineKey: "runner.hq_pressure",
        support: "supports",
      },
      {
        kind: "target_preference",
        purpose: "trash_hq_access_card_without_trash_cost",
        preferences: [
          "high_value_accessed_card",
          "denies_corp_economy_or_combo_piece",
          "normally_untrashable_payoff",
        ],
        avoid: ["low_value_accessed_card", "hidden_info_dependent_choice"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_084_crumble",
      setId: "proteus",
      collectorNumber: "P084",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
