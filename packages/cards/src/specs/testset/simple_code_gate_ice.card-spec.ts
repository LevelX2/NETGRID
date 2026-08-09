import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("simple_code_gate_ice"),
    title: "Simple Code Gate ICE",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Die Corp erhält 1 Credit. End the run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "simple_code_gate_ice",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "neutral_demo",
      subtypes: ["code_gate"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 2,
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
    printedSubroutines: [
      {
        capabilityKey: capabilityKey("simple_code_gate_ice_gain_credit"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "corp_gain_credit",
        amount: 1,
      },
      {
        capabilityKey: capabilityKey("simple_code_gate_ice_etr"),
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
        role: "protect_rnd",
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "simple_code_gate_ice",
      setId: "testset",
      collectorNumber: "008",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
