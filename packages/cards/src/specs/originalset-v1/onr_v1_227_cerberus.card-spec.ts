import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_227_cerberus"),
    title: "Cerberus",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[Subroutine] Do 3 Net damage.\n[Subroutine] Trace 5 - If trace is successful, give Runner a Cerberus counter. Each Cerberus counter does 2 Net damage at the start of each run. Runner may remove a Cerberus counter by taking an action to spend [4].\n[Subroutine] End the run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_227_cerberus",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["ap", "black ice", "hellhound", "sentry"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 11,
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
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("printed_subroutines_damage_net"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage",
        damageType: "net",
        amount: 3,
        preventable: true,
      },
      {
        capabilityKey: capabilityKey("printed_subroutines_trace"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "trace",
        onSuccess: [
          {
            kind: "add_counter",
            recipient: "runner",
            counterType: "cerberus",
            amount: 1,
            visibility: "public",
          },
        ],
        traceLimit: 5,
      },
      {
        capabilityKey: capabilityKey("printed_subroutines_end_the_run"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "end_the_run",
      },
    ],
    runnerCounterEffects: [
      {
        capabilityKey: capabilityKey("runner_counter_effects_cerberus"),
        addressability: ["plan", "action", "quote", "debug"],
        counterType: "cerberus",
        removeCost: 4,
        runStart: {
          kind: "damage",
          damageType: "net",
          amountPerCounter: 2,
          preventable: true,
          visibility: "public",
        },
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "defend_server",
      },
      {
        kind: "plan_role",
        role: "trace_pressure",
      },
      {
        kind: "plan_role",
        role: "run_start_damage",
      },
      {
        kind: "strategic_role",
        role: "punish_payoff",
      },
      {
        kind: "line_support",
        lineKey: "corp.damage_kill",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.damage_kill",
        role: "punish_payoff",
        roleDetail: "persistent_damage_counter_ice",
        confidence: "high",
        rationale:
          "v2: Cerberus-Counter erzeugen wiederkehrenden Net-Damage am Start jedes Runs.",
      },
      {
        kind: "tactic_interpretation",
        signal: "damage.payoff",
        use: "damage.payoff.runner",
      },
      {
        kind: "tactic_interpretation",
        signal: "corp.remote_protection",
        use: "corp.remote_protection",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_227_cerberus",
      setId: "originalset-v1",
      collectorNumber: "227",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
