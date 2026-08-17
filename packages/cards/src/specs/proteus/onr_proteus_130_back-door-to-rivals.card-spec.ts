import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_130_back-door-to-rivals"),
    title: "Back Door to Rivals",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[0]: Base link 2. [3]: +1 link. Gain [1] whenever you successfully use Back Door to Rivals to avoid a trace. Use only one base link card for each trace attempt made against you.",
    capabilityText: [
      {
        capabilityKey: capabilityKey("trace_base_link_two"),
        actionLabel: "Back Door to Rivals: Base Link 2 nutzen",
      },
      {
        capabilityKey: capabilityKey("trace_post_bid_link_plus_one"),
        actionLabel: "Back Door to Rivals: +1 Link",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_130_back-door-to-rivals",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["base_link"],
      numeric: {
        installCost: 2,
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
        capabilityKey: capabilityKey("trace_base_link_two"),
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
            baseLink: 2,
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
            amount: 3,
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
        role: "trace_bid_support",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_proteus_130_back-door-to-rivals",
      setId: "proteus",
      collectorNumber: "P130",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
