import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_038_joan-of-arc"),
    title: "Joan of Arc",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[T]: Prevent one or more of your other installed programs from being trashed.\n1 credit: Prevent one or more of your other installed programs from being trashed, and bring Joan of Arc into your hand.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_038_joan-of-arc",
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
    trashPreventionSources: [
      {
        capabilityKey: capabilityKey(
          "trash_prevention_sources_prevent_installed_card_trash",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "prevent_installed_card_trash",
        protectsCardTypes: ["program"],
        excludesSelf: true,
        mode: "one_or_more_simultaneous",
        cost: {
          kind: "trash_source",
        },
        priority: 118,
        visibility: "public",
      },
      {
        capabilityKey: capabilityKey(
          "trash_prevention_sources_prevent_installed_card_trash_a",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "prevent_installed_card_trash",
        protectsCardTypes: ["program"],
        excludesSelf: true,
        mode: "one_or_more_simultaneous",
        cost: {
          kind: "credit_return_source_to_grip",
          amount: 1,
        },
        priority: 119,
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
      {
        kind: "target_preference",
        purpose: "prevent_program_trash",
        preferences: ["trash_prevention_high_value_program"],
        avoid: ["low_value_program"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_038_joan-of-arc",
      setId: "originalset-v1",
      collectorNumber: "038",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
