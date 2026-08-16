import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_028_lesser-arcana"),
    title: "Lesser Arcana",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*End the run. When you rez Lesser Arcana, you may pay 1, above the rez cost, to make it a wall instead of a sentry.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_028_lesser-arcana",
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
        rezCost: 7,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 4,
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
      {
        kind: "strategy_anchor",
        strategyKey: "corp.ice_tax_glacier",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("rez_as_sentry_or_wall"),
        annotations: [
          {
            kind: "target_preference",
            purpose: "choose_sentry_or_wall_rez_mode",
            preferences: [
              "exploit_visible_killer_or_fracter_coverage_gap",
              "maximize_visible_break_cost_on_protected_server",
              "pay_extra_credit_only_for_material_defensive_gain",
            ],
            avoid: [
              "use_unknown_runner_hand_or_stack_information",
              "pay_for_mode_without_visible_break_cost_gain",
            ],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_028_lesser-arcana",
      setId: "proteus",
      collectorNumber: "P028",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
