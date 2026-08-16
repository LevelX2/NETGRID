import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_012_imperial-guard"),
    title: "Imperial Guard",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*Trash a program. *End the run. If Runner has used a noisy icebreaker during this run, the cost to rez Imperial Guard is reduced by [5].",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_012_imperial-guard",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["sentry", "killer", "sleepy"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 10,
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
    selfRezCostModifiers: [
      {
        kind: "self_rez_cost_reduction_during_run_after_noisy_icebreaker",
        amount: 5,
        visibility: "public",
      },
    ],
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("subroutine_trash_program"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "trash_program",
      },
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
        role: "build_scoring_remote",
      },
      {
        kind: "plan_role",
        role: "protect_hq",
      },
      {
        kind: "plan_role",
        role: "protect_rnd",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("subroutine_trash_program"),
        annotations: [
          {
            kind: "target_preference",
            purpose: "trash_high_value_installed_program",
            preferences: [
              "breaker_covers_current_server",
              "high_install_cost_or_memory",
              "central_or_remote_plan_enabler",
            ],
            avoid: ["low_value_program"],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_012_imperial-guard",
      setId: "classic",
      collectorNumber: "C012",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
