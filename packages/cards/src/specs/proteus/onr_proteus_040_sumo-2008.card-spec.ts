import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_040_sumo-2008"),
    title: "Sumo 2008",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*End the run. When you rez Sumo 2008, you may pay [1], above the rez cost, to make it a wall instead of a sentry.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_040_sumo-2008",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["sentry"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 8,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 5,
      },
    },
    variableRez: {
      capabilityKey: capabilityKey("rez_as_sentry_or_wall"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "alternate_subtype",
      additionalCost: 1,
      baseSubtypes: ["sentry"],
      alternateSubtypes: ["wall"],
      visibility: "public",
    },
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("subroutine_end_run"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "end_the_run",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "protect_hq",
      },
      {
        kind: "plan_role",
        role: "protect_rnd",
      },
      {
        kind: "plan_role",
        role: "protect_remote",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("rez_as_sentry_or_wall"),
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_ice_type_or_mode_from_legal_options",
            preferences: [
              "type_missing_in_current_rig",
              "type_blocking_relevant_run_path",
              "prefer_option_relevant_to_current_run_path",
            ],
            avoid: ["insufficient_post_payment_reserve"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_040_sumo-2008",
      setId: "proteus",
      collectorNumber: "P040",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
