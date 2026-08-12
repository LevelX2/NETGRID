import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_059_self-modifying-code"),
    title: "Self-Modifying Code",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[T]: Search your stack for a program and install that program, if you can. Shuffle your stack afterwards. Use this ability only during a run.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_during_run_trash_source",
        ),
        actionLabel: "Self-Modifying Code: Programm aus Stack installieren",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_059_self-modifying-code",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
      numeric: {
        installCost: 2,
        memoryCost: 2,
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
          "abilities_activated_during_run_trash_source",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "during_run",
        costs: [{ kind: "trash_source", amount: 1 }],
        effects: [
          {
            kind: "search_stack_install",
            filter: "program",
            installCost: "normal",
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
        purpose: "install_program_that_answers_current_ice_or_setup_gap",
        preferences: [
          "program_breaks_current_ice",
          "program_repairs_missing_coverage",
          "program_affordable_after_install",
        ],
        avoid: ["hidden_info_dependent_choice"],
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_059_self-modifying-code",
      setId: "originalset-v1",
      collectorNumber: "059",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
