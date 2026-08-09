import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("simple_tag_ice"),
    title: "Simple Tag ICE",
    side: "corp",
    cardType: "ice",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText: "Gib dem Runner 1 Tag. End the run.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "simple_tag_ice",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "neutral_demo",
      subtypes: ["sentry"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 3,
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
        capabilityKey: capabilityKey("simple_tag_ice_tag"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "give_runner_tag",
        amount: 1,
      },
      {
        capabilityKey: capabilityKey("simple_tag_ice_etr"),
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
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "simple_tag_ice",
      setId: "testset",
      collectorNumber: "021",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
