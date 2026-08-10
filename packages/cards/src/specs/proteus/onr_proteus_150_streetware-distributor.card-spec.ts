import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId(
      "onr_proteus_150_streetware-distributor",
    ),
    title: "Streetware Distributor",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Take [1] from Streetware Distributor, if it has any bits, at the start of each of your turns. A: Put [3] from the bank on Streetware Distributor.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("runner_main_add_three_hosted_credits"),
        actionLabel: "Streetware Distributor: 3 Credits auflegen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_150_streetware-distributor",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["bbs", "position"],
      numeric: {
        installCost: 1,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    lifecycle: {
      start_of_runner_turn: [
        {
          condition: {
            kind: "source_has_hosted_credits",
          },
          effects: [
            {
              kind: "take_hosted_credits",
              source: "source",
              recipient: "controller",
              amount: 1,
              mode: "up_to_amount_if_available",
              visibility: "public",
            },
          ],
        },
      ],
    },
    abilities: [
      {
        capabilityKey: capabilityKey("runner_main_add_three_hosted_credits"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "runner_main",
        costs: [
          {
            kind: "action",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "add_hosted_credits",
            target: "source",
            amount: 3,
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
        role: "recover_economy",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "low",
        rationale:
          "Migrated from reviewed Proteus hint onr_proteus_150_streetware-distributor.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_150_streetware-distributor",
      setId: "proteus",
      collectorNumber: "P150",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
