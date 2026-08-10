import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_016_coyote"),
    title: "Coyote",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*For the remainder of the run, all further ice is encountered at +1 strength, unless Runner pays [2] while passing Coyote. Gain [3] when you rez Coyote.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_016_coyote",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["sentry", "watchdog"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 3,
      },
    },
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("subroutine_run_duration_ice_strength"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "run_duration_ice_strength",
        amount: 1,
        runnerMayCancelOnPassingSource: {
          amount: 2,
        },
      },
    ],
    lifecycle: {
      on_rez: [
        {
          kind: "gain_credits",
          recipient: "corp",
          amount: 3,
          visibility: "public",
        },
      ],
    },
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
        roleDetail: "future_strength_tax_ice",
        evidenceProfile: "future_strength_tax_ice",
        confidence: "medium",
        rationale:
          "ICE Semantic Review v1: Coyote bestätigt corp.ice_tax_glacier nur aus konkreten ICE-Funktionssignalen; Subtypen bleiben Kartendaten.",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_016_coyote",
      setId: "proteus",
      collectorNumber: "P016",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
