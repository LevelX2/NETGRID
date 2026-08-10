import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_247_haunting-inquisition"),
    title: "Haunting Inquisition",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[Subroutine] Runner cannot make another run during his or her next six actions.\n[Subroutine] End the run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_247_haunting-inquisition",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["code gate"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 8,
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
        capabilityKey: capabilityKey(
          "printed_subroutines_runner_run_lock_actions",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "runner_run_lock_actions",
        amount: 6,
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
        roleDetail: "run_lock_ice",
        confidence: "high",
        rationale:
          "ICE Semantic Review v1: Haunting Inquisition bestätigt corp.ice_tax_glacier nur aus konkreten ICE-Funktionssignalen; Subtypen bleiben Kartendaten.",
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
      printingId: "onr_v1_247_haunting-inquisition",
      setId: "originalset-v1",
      collectorNumber: "247",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
