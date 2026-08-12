import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_089_garbage-in"),
    title: "Garbage In",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "After each successful run on R&D, give the Corp a Garbage counter. Two or more Garbage counters allow you to trash, at no cost, any cards accessed from R&D, even if the cards cannot normally be trashed. The Corp loses two Garbage counters after any run during which this ability is used. The Corp may remove all Virus counters at any time, but must then forgo its next three actions.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_089_garbage-in",
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
      capabilityKey: capabilityKey("rd_success_add_garbage_counter"),
      addressability: ["plan", "action", "quote", "debug"],
      counterKind: "garbage",
      addOnSuccessfulRun: {
        server: "rd",
        target: "corp_purgeable_runner_virus_counter",
        amount: 1,
        visibility: "public",
      },
      accessTrash: {
        kind: "free_trash_accessed_card_at_counter_threshold",
        server: "rd",
        counterSource: "corp_purgeable_runner_virus_counter",
        threshold: 2,
        includeNormallyUntrashable: true,
        counterRemoval: { timing: "run_end_if_used", amount: 2 },
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
        strategyKey: "runner.rnd_pressure",
      },
      {
        kind: "line_support",
        lineKey: "runner.rnd_pressure",
        support: "supports",
      },
      {
        kind: "target_preference",
        purpose: "trash_rnd_access_card_without_trash_cost",
        preferences: [
          "high_value_accessed_card",
          "denies_corp_agenda_or_combo_piece",
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
      printingId: "onr_proteus_089_garbage-in",
      setId: "proteus",
      collectorNumber: "P089",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
