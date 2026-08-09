import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("simple_run_event"),
    title: "Simple Run Event",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Mache einen Run auf einen Server deiner Wahl. Wenn der Run erfolgreich ist, erhältst du 2 Credits.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "simple_run_event",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "neutral_demo",
      subtypes: [],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: {
        kind: "fixed",
        credits: 0,
      },
      strength: {
        kind: "not_applicable",
      },
    },
    abilities: [
      {
        kind: "on_play",
        capabilityKey: capabilityKey("simple_run_event_on_play"),
        addressability: ["plan", "action", "quote", "debug"],
        costs: "printed",
        effects: [
          {
            kind: "make_run",
            target: {
              kind: "chosen_server",
            },
            successfulRunRunnerCreditGain: 2,
            visibility: "public",
          },
        ],
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "simple_run_event",
      setId: "testset",
      collectorNumber: "018",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
