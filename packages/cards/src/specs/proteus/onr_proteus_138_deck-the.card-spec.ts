import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_138_deck-the"),
    title: "Deck, The",
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[0]: Base link 5. [1]: +1 link. Provides +1 MU. Use only one base link card for each trace attempt made against you. Only one deck can be in play at a time. Trash any older decks.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("trace_base_link_five"),
        actionLabel: "Deck, The: Base Link 5 nutzen",
      },
      {
        capabilityKey: capabilityKey("trace_post_bid_link_plus_one"),
        actionLabel: "Deck, The: +1 Link",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_138_deck-the",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["base_link", "deck"],
      numeric: {
        installCost: 11,
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
    hardwareDeck: true,
    modifiers: [
      {
        kind: "memory_units",
        operation: "increase",
        amount: 1,
        activeWhile: "installed",
        sourceZone: "runner_installed",
        side: "runner",
        visibility: "public",
      },
    ],
    abilities: [
      {
        capabilityKey: capabilityKey("trace_base_link_five"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "trace_base_link_window",
        costs: [
          {
            kind: "credit",
            amount: 0,
          },
        ],
        limit: {
          kind: "one_base_link_card_per_trace_attempt",
          scope: "trace_attempt",
        },
        effects: [
          {
            kind: "use_base_link",
            baseLink: 5,
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
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "increase_trace_link",
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
      {
        kind: "plan_role",
        role: "build_rig",
      },
      {
        kind: "plan_role",
        role: "safe_probe_run",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_138_deck-the",
      setId: "proteus",
      collectorNumber: "P138",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
