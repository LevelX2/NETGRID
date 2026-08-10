import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_274_tutor"),
    title: "Tutor",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      '[Subroutine] For the remainder of the run, all ice encountered has an additional subroutine, "[Subroutine] End the run," after all other subroutines.',
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_274_tutor",
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
        rezCost: 4,
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
        capabilityKey: capabilityKey(
          "printed_subroutines_run_duration_additional_subroutine",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "run_duration_additional_subroutine",
        append: "after_existing",
        subroutine: {
          kind: "end_the_run",
          visibility: "public",
        },
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
        kind: "line_support",
        lineKey: "corp.ice_tax_glacier",
        support: "supports",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.ice_tax_glacier",
        role: "tax_tool",
        roleDetail: "future_etr_subroutine_tax_ice",
        confidence: "high",
        rationale:
          "v2: Tutor fügt künftigen ICE ETR-Subroutinen hinzu; das ist kein Jackout-Tax.",
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
      printingId: "onr_v1_274_tutor",
      setId: "originalset-v1",
      collectorNumber: "274",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
