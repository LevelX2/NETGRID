import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

const variableRezX = capabilityKey("variable_rez_x");
const netDamageSubroutine = capabilityKey("net_damage_subroutine");
const endTheRunSubroutine = capabilityKey("end_the_run_subroutine");

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_020_digiconda"),
    title: "Digiconda",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*Do 2 Net damage. *End the run. Pay [X], above the rez cost, when you rez Digiconda. X is Digiconda 's strength, and X cannot be greater than 6.",
    capabilityText: [
      { capabilityKey: variableRezX, actionLabel: "X für Rezzen wählen" },
      {
        capabilityKey: netDamageSubroutine,
        actionLabel: "2 Net Damage verursachen",
      },
      {
        capabilityKey: endTheRunSubroutine,
        actionLabel: "Run beenden",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      { source: "card_text", reference: "onr_proteus_020_digiconda" },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["ap", "sentry", "sword"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 6,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: { kind: "paid_x", minimumStrength: 0, maximumStrength: 6 },
    },
    variableRez: {
      capabilityKey: variableRezX,
      addressability: ["plan", "choice", "quote", "debug"],
      kind: "x_strength",
      additionalCostPerValue: 1,
      minValue: 0,
      maxValue: 6,
      visibility: "public",
    },
    printedSubroutines: [
      {
        capabilityKey: netDamageSubroutine,
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage",
        damageType: "net",
        amount: 2,
        preventable: true,
      },
      {
        capabilityKey: endTheRunSubroutine,
        addressability: ["plan", "action", "quote", "debug"],
        kind: "end_the_run",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      { kind: "strategy_anchor", strategyKey: "corp.damage_kill" },
      { kind: "strategy_anchor", strategyKey: "corp.ice_tax_glacier" },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      { kind: "strategic_role", role: "tax_tool" },
      { kind: "plan_role", role: "protect_hq" },
      { kind: "plan_role", role: "protect_rnd" },
      { kind: "plan_role", role: "protect_remote" },
      {
        kind: "tactic_interpretation",
        signal: "damage.payoff",
        use: "damage.payoff.runner",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "rez_paid_scaling_ice",
        confidence: "medium",
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_020_digiconda",
      setId: "proteus",
      collectorNumber: "P020",
      rarity: "uncommon",
    },
  ],
  publication: { schemaVersion: "card-publication-v1", status: "active" },
} satisfies CardSpec;
