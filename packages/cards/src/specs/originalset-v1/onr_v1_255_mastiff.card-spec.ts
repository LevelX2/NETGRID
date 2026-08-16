import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_255_mastiff"),
    title: "Mastiff",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*Do 1 brain damage. *Do 1 Net damage. *For the remainder of the run, all ice is encountered at +1 strength. *Trace 5-If trace is successful, give Runner a Mastiff counter. Each Mastiff counter does 1 brain damage at the start of each run. Runner may remove a Mastiff counter by taking an action to spend [4]. *End the run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_255_mastiff",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["ap", "black ice", "hellhound", "sentry", "watchdog"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 12,
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
        capabilityKey: capabilityKey("printed_subroutines_damage_brain"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage",
        damageType: "brain",
        amount: 1,
        preventable: true,
      },
      {
        capabilityKey: capabilityKey("printed_subroutines_damage_net"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage",
        damageType: "net",
        amount: 1,
        preventable: true,
      },
      {
        capabilityKey: capabilityKey(
          "printed_subroutines_run_duration_ice_strength",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "run_duration_ice_strength",
        amount: 1,
      },
      {
        capabilityKey: capabilityKey("printed_subroutines_trace"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "trace",
        onSuccess: [
          {
            kind: "add_counter",
            recipient: "runner",
            counterType: "mastiff",
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
        capabilityKey: capabilityKey("runner_counter_effects_mastiff"),
        addressability: ["plan", "action", "quote", "debug"],
        counterType: "mastiff",
        removeCost: 4,
        runStart: {
          kind: "damage",
          damageType: "brain",
          amountPerCounter: 1,
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
        kind: "strategic_role",
        role: "punish_payoff",
      },
      {
        kind: "strategic_role",
        role: "tax_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.ice_tax_glacier",
      },
      {
        kind: "line_support",
        lineKey: "corp.damage_kill",
        support: "supports",
      },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.damage_kill",
        role: "punish_payoff",
        roleDetail: "persistent_brain_damage_counter_ice",
        confidence: "high",
        rationale:
          "v2: Brain+Net damage plus persistenter Brain-Damage-Counter ist ein starker Damage-Payoff.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "future_strength_buff_tax_ice",
        confidence: "medium",
        rationale:
          "v2: Die Karte stärkt alle weiteren ICE im Run und ist damit auch Glacier-/Tax-Support.",
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
      printingId: "onr_v1_255_mastiff",
      setId: "originalset-v1",
      collectorNumber: "255",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
