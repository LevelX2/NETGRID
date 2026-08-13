import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_280_zombie"),
    title: "Zombie",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[Subroutine] Do 1 brain damage.\n[Subroutine] Do 1 brain damage.\n[Subroutine] End the run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_280_zombie",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["black ice", "sentry"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 9,
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
        capabilityKey: capabilityKey("printed_subroutines_damage_brain_a"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage",
        damageType: "brain",
        amount: 1,
        preventable: true,
      },
      {
        capabilityKey: capabilityKey("printed_subroutines_end_the_run"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "end_the_run",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
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
        roleDetail: "brain_damage_ice",
        confidence: "high",
        rationale:
          "ICE Semantic Review v1: Zombie bestätigt corp.damage_kill nur aus konkreten ICE-Funktionssignalen; Subtypen bleiben Kartendaten.",
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
      printingId: "onr_v1_280_zombie",
      setId: "originalset-v1",
      collectorNumber: "280",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
