import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_102_open-ended-mileage-program"),
    title: "Open-Ended® Mileage Program",
    side: "runner",
    cardType: "event",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Remove a tag, at no cost. You may pay [1] when you play Open-Ended® Mileage Program to take it back into your hand instead of trashing it.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_102_open-ended-mileage-program",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
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
        capabilityKey: capabilityKey("abilities_on_play_remove_tags"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "on_play",
        costs: "printed",
        condition: {
          kind: "runner_is_tagged",
        },
        sourceDisposition: {
          kind: "return_to_grip_instead_of_trash",
          additionalCreditCost: 1,
          decisionTiming: "when_played",
        },
        effects: [
          {
            kind: "remove_tags",
            recipient: "runner",
            mode: "amount",
            amount: 1,
            visibility: "public",
          },
        ],
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      { kind: "plan_role", role: "tag_clear" },
      { kind: "plan_role", role: "tag_defense" },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_102_open-ended-mileage-program",
      setId: "originalset-v1",
      collectorNumber: "102",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
