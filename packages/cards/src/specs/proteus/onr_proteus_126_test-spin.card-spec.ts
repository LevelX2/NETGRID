import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_126_test-spin"),
    title: "Test Spin",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Search your stack for a program, and install it, at no cost. Shuffle your stack. If you install a program in this way, make a run. After the run, shuffle the program into your stack, unless it is no longer in play, in which case, lose [4] plus its installation cost. If this is more than the number of bits in your pool, suffer the difference in meat damage.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_126_test-spin",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: [],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: {
        kind: "fixed",
        credits: 1,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    runnerEventLongtail: {
      capabilityKey: capabilityKey(
        "search_install_program_run_return_or_damage",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "search_stack_install_program_free_then_run_return_or_penalty",
      installCost: "free",
      shuffleAfterwards: true,
      penaltyBase: 4,
      penaltyDamageType: "meat",
      visibility: "hidden_info_barrier",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      { kind: "plan_role", role: "temporary_program_search" },
      {
        kind: "strategic_role",
        role: "enabler",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "runner.run_event_tempo",
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
        kind: "strategic_exchange",
        exchange: "self_damage",
      },
      {
        kind: "strategic_exchange",
        exchange: "temporary_resource",
      },
      {
        kind: "target_preference",
        purpose: "temporary_program_install_run",
        preferences: [
          "program_repairs_missing_coverage",
          "program_preserves_run_goal",
          "program_affordable_after_install",
          "low_mu_program",
        ],
        avoid: ["low_value_program", "insufficient_post_payment_reserve"],
      },
      {
        kind: "risk_interpretation",
        risk: "credit_reserve_cost",
        severity: "high",
      },
      {
        kind: "risk_interpretation",
        risk: "flatline_risk",
        severity: "high",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_126_test-spin",
      setId: "proteus",
      collectorNumber: "P126",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
