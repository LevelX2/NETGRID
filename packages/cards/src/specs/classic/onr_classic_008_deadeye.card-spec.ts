import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_008_deadeye"),
    title: "Deadeye",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*Trash a program. *End the run. If Runner has used a noisy icebreaker during this run, the cost to rez Deadeye is reduced by [5].",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_008_deadeye",
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
        rezCost: 5,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 0,
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
      {
        kind: "strategy_anchor",
        strategyKey: "corp.economy_rez_reserve",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.ice_tax_glacier",
      },
      {
        kind: "target_preference",
        purpose: "trash_high_value_installed_program",
        preferences: [
          "breaker_covers_current_server",
          "high_install_cost_or_memory",
          "central_or_remote_plan_enabler",
        ],
        avoid: ["hidden_info_dependent_choice", "low_value_program"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_008_deadeye",
      setId: "classic",
      collectorNumber: "C008",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
