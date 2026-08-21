import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_005_baskerville"),
    title: "Baskerville",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*Do 2 Net damage. *Trace5 - If trace is successful, give Runner a Baskerville counter. Each counter does 2 Net damage at the start of each run. Runner may remove a Baskerville counter by taking an action to spend [3]. *End the run. If Runner has used a noisy icebreaker during this run, the cost to rez Baskerville is reduced by [5].",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_005_baskerville",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["sentry", "ap", "hellhound", "sleepy"],
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
        value: 4,
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
        capabilityKey: capabilityKey("subroutine_net_damage_2"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage",
        damageType: "net",
        amount: 2,
        preventable: true,
      },
      {
        capabilityKey: capabilityKey("subroutine_trace_baskerville_counter"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "trace",
        onSuccess: [
          {
            kind: "add_counter",
            recipient: "runner",
            counterType: "baskerville",
            amount: 1,
            visibility: "public",
          },
        ],
        traceLimit: 5,
      },
      {
        capabilityKey: capabilityKey("subroutine_end_run"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "end_the_run",
      },
    ],
    runnerCounterEffects: [
      {
        capabilityKey: capabilityKey("baskerville_counter_run_start_damage"),
        addressability: ["plan", "action", "quote", "debug"],
        counterType: "baskerville",
        removeCost: 3,
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
        kind: "strategic_role",
        role: "punish_payoff",
      },
      {
        kind: "strategic_role",
        role: "tax_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.damage_kill",
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
        roleDetail: "persistent_damage_counter_ice",
        confidence: "high",
        rationale:
          "v2: Baskerville-Counter erzeugen wiederkehrenden Net-Damage am Start jedes Runs.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "ice_tax_or_lock_piece",
        confidence: "medium",
        rationale:
          "v2: ETR plus Damage-Druck und noisy-rez discount unterstützen ICE-Tax/Glacier.",
      },
      {
        kind: "tactic_interpretation",
        signal: "damage.payoff",
        use: "damage.payoff.runner",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "medium",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey("subroutine_trace_baskerville_counter"),
        annotations: [
          {
            kind: "strategy_support",
            strategyKey: "corp.tag_trace_punish",
            role: "anchor_evidence",
            roleDetail: "anchor_evidence_trace_source",
            evidenceAnchor: "trace.source",
            confidence: "high",
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_005_baskerville",
      setId: "classic",
      collectorNumber: "C005",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
