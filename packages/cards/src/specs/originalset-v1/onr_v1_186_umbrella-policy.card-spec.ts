import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_186_umbrella-policy"),
    title: "Umbrella Policy",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[T]: Prevent an installed program or hardware card from being trashed.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_186_umbrella-policy",
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
    trashPreventionSources: [
      {
        capabilityKey: capabilityKey(
          "trash_prevention_sources_prevent_installed_card_trash",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "prevent_installed_card_trash",
        protectsCardTypes: ["program", "hardware"],
        mode: "one_card",
        cost: {
          kind: "trash_source",
        },
        priority: 120,
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
        role: "protect_rig",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "trash_prevention_sources_prevent_installed_card_trash",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "prevent_program_or_hardware_trash",
            preferences: [
              "trash_prevention_high_value_program",
              "best_cards_for_current_plan",
            ],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_186_umbrella-policy",
      setId: "originalset-v1",
      collectorNumber: "186",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
