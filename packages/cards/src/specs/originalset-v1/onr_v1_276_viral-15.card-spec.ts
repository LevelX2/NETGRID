import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_276_viral-15"),
    title: "Viral 15",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[Subroutine] For the remainder of the run, Runner must pay [1] to jack out, in addition to any other costs.\n[Subroutine] For the remainder of the run, Runner trashes an installed program after passing each piece of rezzed ice, including Viral 15, unless Runner jacks out.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_276_viral-15",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["sentry"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 5,
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
        capabilityKey: capabilityKey(
          "printed_subroutines_run_duration_jack_out_cost",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "run_duration_jack_out_cost",
        amount: 1,
      },
      {
        capabilityKey: capabilityKey(
          "printed_subroutines_run_duration_trash_program_after_passing_rezzed_ice_unless_jack_out",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "run_duration_trash_program_after_passing_rezzed_ice_unless_jack_out",
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
          "ICE Semantic Review v1: Viral 15 bestätigt corp.ice_tax_glacier nur aus konkreten ICE-Funktionssignalen; Subtypen bleiben Kartendaten.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_276_viral-15",
      setId: "originalset-v1",
      collectorNumber: "276",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
