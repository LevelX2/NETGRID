import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_030_mastermind"),
    title: "Mastermind",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*Do 1 brain damage for each rezzed piece of ice installed outside Mastermind. *End the run. Mastermind has +1 strength for each rezzed piece of ice installed outside it.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_030_mastermind",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["ap", "black_ice", "sentry", "zombie"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 7,
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
    relativeIce: {
      capabilityKey: capabilityKey(
        "outside_rezzed_ice_strength_and_core_damage",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "rezzed_ice_outside_this_ice",
      strengthBonusPerCount: 1,
      dynamicDamageSubroutine: {
        subroutineId: "subroutine_relative_brain_damage",
        amountPerCount: 1,
        visibility: "public",
      },
    },
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("subroutine_relative_brain_damage"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage",
        damageType: "brain",
        amount: 0,
        preventable: true,
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
        role: "protect_hq",
      },
      {
        kind: "plan_role",
        role: "protect_rnd",
      },
      {
        kind: "plan_role",
        role: "protect_remote",
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
        roleDetail: "brain_damage_ice",
        evidenceProfile: "brain_damage_ice",
        confidence: "high",
        rationale:
          "ICE Semantic Review v1: Mastermind bestätigt corp.damage_kill nur aus konkreten ICE-Funktionssignalen; Subtypen bleiben Kartendaten.",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "position_scaling_tax_ice",
        evidenceProfile: "position_scaling_tax_ice",
        confidence: "medium",
        rationale:
          "ICE Semantic Review v1: Mastermind bestätigt corp.ice_tax_glacier nur aus konkreten ICE-Funktionssignalen; Subtypen bleiben Kartendaten.",
      },
      {
        kind: "tactic_interpretation",
        signal: "damage.payoff",
        use: "damage.payoff.runner",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_030_mastermind",
      setId: "proteus",
      collectorNumber: "P030",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
