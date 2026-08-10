import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_041_toughoniumtm-wall"),
    title: "Toughonium™ Wall",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "*End the run.\n*End the run.\n*End the run.\n*End the run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_041_toughoniumtm-wall",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["wall"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 13,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "fixed",
        value: 7,
      },
    },
    printedSubroutines: [
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
      {
        capabilityKey: capabilityKey("subroutine_end_run_c"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "end_the_run",
      },
      {
        capabilityKey: capabilityKey("subroutine_end_run_d"),
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
        kind: "strategy_anchor",
        strategyKey: "corp.ice_tax_glacier",
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
      printingId: "onr_proteus_041_toughoniumtm-wall",
      setId: "proteus",
      collectorNumber: "P041",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
