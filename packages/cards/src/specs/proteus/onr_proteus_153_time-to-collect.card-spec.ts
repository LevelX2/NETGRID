import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_153_time-to-collect"),
    title: "Time to Collect",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[T]: Prevent one or more of your other installed resources from being trashed. Use this ability only during the Corp 's turn. Hidden resources are installed face down, but are put into the trash face up.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_153_time-to-collect",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["hidden"],
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
    trashPreventionSources: [
      {
        capabilityKey: capabilityKey("trash_source_prevent_resource_trash"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "prevent_installed_card_trash",
        protectsCardTypes: ["resource"],
        excludesSelf: true,
        activeOnlyDuring: "corp_turn",
        mode: "one_or_more_simultaneous",
        cost: {
          kind: "trash_source",
        },
        priority: 30,
        visibility: "public",
      },
    ],
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
        kind: "target_preference",
        purpose: "prevent_resource_trash_during_corp_turn",
        preferences: [],
        avoid: ["hidden_info_dependent_choice"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_153_time-to-collect",
      setId: "proteus",
      collectorNumber: "P153",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
