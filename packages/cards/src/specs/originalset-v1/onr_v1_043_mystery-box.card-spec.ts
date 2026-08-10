import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_043_mystery-box"),
    title: "Mystery Box",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "0: Show the top five cards of your stack to the Corp. If any of those cards are programs, trash Mystery Box and then install one of those programs, at no cost. Shuffle your stack afterwards. Use this ability only during a run and only once each run.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_during_run_look_top_stack_show_to_corp_then_install_matching",
        ),
        actionLabel: "Mystery Box: Stack-Spitze zeigen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_043_mystery-box",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
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
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_during_run_look_top_stack_show_to_corp_then_install_matching",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "during_run",
        costs: [],
        effects: [
          {
            kind: "look_top_stack_show_to_corp_then_install_matching",
            count: 5,
            allowedTypes: ["program"],
            installCost: "free",
            trashSourceIfInstalled: true,
            shuffleAfterwards: true,
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
        kind: "plan_role",
        role: "build_rig",
      },
      {
        kind: "plan_role",
        role: "information",
      },
      {
        kind: "plan_role",
        role: "recover_rig",
      },
      {
        kind: "strategic_role",
        role: "engine_anchor",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.search.breaker",
      },
      {
        kind: "line_support",
        lineKey: "runner.search.breaker",
        support: "supports",
      },
      {
        kind: "target_preference",
        purpose: "install_best_program_for_current_rig_need",
        preferences: [
          "program_repairs_missing_coverage",
          "program_affordable_after_install",
          "program_preserves_run_goal",
        ],
        avoid: ["hidden_info_dependent_choice"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_043_mystery-box",
      setId: "originalset-v1",
      collectorNumber: "043",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
