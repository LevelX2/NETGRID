import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_150_access-to-kiribati"),
    title: "Access to Kiribati",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[1]: Base link 1. [1]: +1 link. Use only one base link card for each trace attempt made against you.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_trace_base_link_window_use_base_link",
        ),
        actionLabel: "Access to Kiribati: Base Link 1 nutzen",
      },
      {
        capabilityKey: capabilityKey(
          "abilities_activated_trace_post_bid_link_window_increase_trace_link",
        ),
        actionLabel: "Access to Kiribati: +1 Link",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_150_access-to-kiribati",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["base link"],
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
    abilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_trace_base_link_window_use_base_link",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "trace_base_link_window",
        costs: [
          {
            kind: "credit",
            amount: 1,
          },
        ],
        limit: {
          kind: "one_base_link_card_per_trace_attempt",
          scope: "trace_attempt",
        },
        effects: [
          {
            kind: "use_base_link",
            baseLink: 1,
            visibility: "public",
          },
        ],
      },
      {
        capabilityKey: capabilityKey(
          "abilities_activated_trace_post_bid_link_window_increase_trace_link",
        ),
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
        role: "trace_bid_support",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_150_access-to-kiribati",
      setId: "originalset-v1",
      collectorNumber: "150",
      rarity: "vital",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
