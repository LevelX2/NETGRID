import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_031_rent-i-con"),
    title: "Rent-I-Con",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[1]: Break ice subroutine. At the end of this run, trash Rent-I-Con. [1]: +1 strength",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_031_rent-i-con",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["icebreaker"],
      numeric: {
        installCost: 3,
        memoryCost: 2,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 2,
      },
    },
    icebreakerAbilities: [
      {
        capabilityKey: capabilityKey(
          "break_any_subroutine_and_trash_after_run",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "break_subroutine",
        cost: {
          kind: "credit",
          amount: 1,
        },
        matches: {
          kind: "any",
        },
        special: {
          kind: "run_end_trash_source_if_used",
        },
        visibility: "public",
      },
      {
        capabilityKey: capabilityKey("pump_strength_one"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "increase_strength",
        cost: {
          kind: "credit",
          amount: 1,
        },
        amount: 1,
        duration: "current_encounter",
        visibility: "public",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "strategic_exchange",
        exchange: "temporary_resource",
      },
      {
        kind: "tactic_interpretation",
        signal: "coverage.breaker",
        use: "coverage.breaker",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "high",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "medium",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_031_rent-i-con",
      setId: "classic",
      collectorNumber: "C031",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
