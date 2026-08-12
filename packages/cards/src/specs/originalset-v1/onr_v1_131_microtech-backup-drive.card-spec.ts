import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_131_microtech-backup-drive"),
    title: "Microtech Backup Drive",
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Whenever one or more installed programs are being sent to the trash at the same time, you may instead choose to put any or all of the programs on top of Microtech Backup Drive in any order you choose. If Backup Drive is removed from play, trash any cards on it.\nA: Bring the top card on Backup Drive into your hand.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_runner_main_move_top_hosted_program_to_grip",
        ),
        actionLabel:
          "Microtech Backup Drive: oberstes gesichertes Programm auf die Hand nehmen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_131_microtech-backup-drive",
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
        memoryCost: null,
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
        "runner_utility_longtail_replace_installed_program_trash_with_host_on_source",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "replace_installed_program_trash_with_host_on_source",
      visibility: "hidden_info_barrier",
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_runner_main_move_top_hosted_program_to_grip",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "runner_main",
        costs: [
          {
            kind: "action",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "move_top_hosted_program_to_grip",
            recipient: "runner",
            host: "source",
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "target_preference",
        purpose: "preserve_trashed_program_for_recovery",
        preferences: [
          "trash_prevention_high_value_program",
          "program_repairs_missing_coverage",
        ],
        avoid: ["low_value_program"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_131_microtech-backup-drive",
      setId: "originalset-v1",
      collectorNumber: "131",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
