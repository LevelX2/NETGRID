import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_015_colonel-failure"),
    title: "Colonel Failure",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "*Trash a program. *Trash a program. *Trash a program. *End the run. *End the run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_015_colonel-failure",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["killer", "sentry"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 17,
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
        capabilityKey: capabilityKey("subroutine_trash_program_a"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "trash_program",
      },
      {
        capabilityKey: capabilityKey("subroutine_trash_program_b"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "trash_program",
      },
      {
        capabilityKey: capabilityKey("subroutine_trash_program_c"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "trash_program",
      },
      {
        capabilityKey: capabilityKey("subroutine_end_run_a"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "end_the_run",
      },
      {
        capabilityKey: capabilityKey("subroutine_end_run_b"),
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
        roleDetail: "multi_program_trash_tax_ice",
        evidenceProfile: "multi_program_trash_tax_ice",
        confidence: "high",
        rationale:
          "v2: Drei Program-Trash- und zwei ETR-Subroutinen erfüllen ausdrücklich die Guide-Schwelle für anchorfähigen Program-Trash.",
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
      printingId: "onr_proteus_015_colonel-failure",
      setId: "proteus",
      collectorNumber: "P015",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
