import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_258_neural-blade"),
    title: "Neural Blade",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[Subroutine] Do 1 net damage.\n[Subroutine] The Runner cannot break any subroutines of the next piece of ice encountered during this run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_258_neural-blade",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["ap", "sentry", "sword"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 4,
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
        capabilityKey: capabilityKey("printed_subroutines_damage_net"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage",
        damageType: "net",
        amount: 1,
        preventable: true,
      },
      {
        capabilityKey: capabilityKey(
          "printed_subroutines_prohibit_break_next_ice",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "prohibit_break_next_ice",
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
        role: "tax_tool",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.ice_tax_glacier",
      },
      {
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "next_ice_break_lock_ice",
        confidence: "high",
        rationale:
          "v2: Auch mit nur 1 Net damage ist die Break-Lock-Funktion für die nächste ICE ein starker Tax-/Lock-Baustein.",
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
      printingId: "onr_v1_258_neural-blade",
      setId: "originalset-v1",
      collectorNumber: "258",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
