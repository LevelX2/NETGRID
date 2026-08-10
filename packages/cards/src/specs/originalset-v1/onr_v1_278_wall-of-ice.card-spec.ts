import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_278_wall-of-ice"),
    title: "Wall of Ice",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[Subroutine] Do 2 net damage.\n[Subroutine] Do 2 net damage.\n[Subroutine] End the run.\n[Subroutine] End the run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_278_wall-of-ice",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["wall"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 13,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 6,
      },
    },
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("printed_subroutines_damage_net"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage",
        damageType: "net",
        amount: 2,
        preventable: true,
      },
      {
        capabilityKey: capabilityKey("printed_subroutines_damage_net_a"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage",
        damageType: "net",
        amount: 2,
        preventable: true,
      },
      {
        capabilityKey: capabilityKey("printed_subroutines_end_the_run"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "end_the_run",
      },
      {
        capabilityKey: capabilityKey("printed_subroutines_end_the_run_a"),
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
        roleDetail: "net_damage_ice",
        confidence: "high",
        rationale:
          "ICE Semantic Review v1: Wall of Ice bestätigt corp.damage_kill nur aus konkreten ICE-Funktionssignalen; Subtypen bleiben Kartendaten.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "multi_end_run_tax_ice",
        confidence: "medium",
        rationale:
          "ICE Semantic Review v1: Wall of Ice bestätigt corp.ice_tax_glacier nur aus konkreten ICE-Funktionssignalen; Subtypen bleiben Kartendaten.",
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
      printingId: "onr_v1_278_wall-of-ice",
      setId: "originalset-v1",
      collectorNumber: "278",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
