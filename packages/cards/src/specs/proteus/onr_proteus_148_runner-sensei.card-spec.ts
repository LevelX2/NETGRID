import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_148_runner-sensei"),
    title: "Runner Sensei",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[2]: Base link 4. [2]: +1 link. Gain [1] whenever you successfully use Runner Sensei to avoid a trace. Use only one base link card for each trace attempt made against you.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("trace_base_link_four"),
        actionLabel: "Runner Sensei: Base Link 4 nutzen",
      },
      {
        capabilityKey: capabilityKey("trace_post_bid_link_plus_one"),
        actionLabel: "Runner Sensei: +1 Link",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_148_runner-sensei",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["base_link", "position"],
      numeric: {
        installCost: 4,
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
    abilities: [
      {
        capabilityKey: capabilityKey("trace_base_link_four"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "trace_base_link_window",
        costs: [
          {
            kind: "credit",
            amount: 2,
          },
        ],
        limit: {
          kind: "one_base_link_card_per_trace_attempt",
          scope: "trace_attempt",
        },
        effects: [
          {
            kind: "use_base_link",
            baseLink: 4,
            rewardCreditsOnAvoidTrace: 1,
            visibility: "public",
          },
        ],
      },
      {
        capabilityKey: capabilityKey("trace_post_bid_link_plus_one"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "trace_post_bid_link_window",
        costs: [
          {
            kind: "credit",
            amount: 2,
          },
        ],
        effects: [
          {
            kind: "increase_trace_link",
            amount: 1,
            rewardCreditsOnAvoidTrace: 1,
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
          "Migrated from reviewed Proteus hint onr_proteus_148_runner-sensei.",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_148_runner-sensei",
      setId: "proteus",
      collectorNumber: "P148",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
