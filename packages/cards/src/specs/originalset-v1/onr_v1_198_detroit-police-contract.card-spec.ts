import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_198_detroit-police-contract"),
    title: "Detroit Police Contract",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Put [12] from the bank on Detroit Police Contract when you score it. Take [2] from Detroit Police Contract, if it has any bits, at the start of each of your turns.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_198_detroit-police-contract",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["black-ops"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: 4,
        agendaPoints: 1,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    lifecycle: {
      on_score: [
        {
          kind: "add_hosted_credits",
          target: "source",
          amount: 12,
          visibility: "public",
        },
      ],
      start_of_corp_turn: [
        {
          condition: {
            kind: "source_has_hosted_credits",
          },
          effects: [
            {
              kind: "take_hosted_credits",
              source: "source",
              recipient: "controller",
              amount: 2,
              mode: "up_to_amount_if_available",
              visibility: "public",
            },
          ],
        },
      ],
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "low",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_198_detroit-police-contract",
      setId: "originalset-v1",
      collectorNumber: "198",
      rarity: "vital",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
