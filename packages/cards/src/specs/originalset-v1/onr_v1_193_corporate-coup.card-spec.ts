import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_193_corporate-coup"),
    title: "Corporate Coup",
    side: "corp",
    cardType: "agenda",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Put 15 from the bank on Corporate Coup when you score it.\n[A]: Take 3 from Corporate Coup, if it has any bits.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_193_corporate-coup",
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
        advancementRequirement: 5,
        agendaPoints: 2,
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
          amount: 15,
          visibility: "public",
        },
      ],
    },
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_corp_main_take_hosted_credits",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "corp_main",
        costs: [
          {
            kind: "action",
            amount: 1,
          },
        ],
        condition: {
          kind: "source_has_hosted_credits",
        },
        effects: [
          {
            kind: "take_hosted_credits",
            source: "source",
            recipient: "controller",
            amount: 3,
            mode: "up_to_amount_if_available",
            visibility: "public",
          },
        ],
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "build_scoring_remote",
      },
      {
        kind: "plan_role",
        role: "score_next_turn",
      },
      {
        kind: "plan_role",
        role: "score_now",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "medium",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_193_corporate-coup",
      setId: "originalset-v1",
      collectorNumber: "193",
      rarity: "vital",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
