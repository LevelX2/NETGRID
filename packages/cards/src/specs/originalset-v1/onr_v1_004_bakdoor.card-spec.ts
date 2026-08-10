import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_004_bakdoor"),
    title: "Bakdoor™",
    side: "runner",
    cardType: "program",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "0: Base link 3. 2: +1 link. Use only one base link card for each trace attempt made against you.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_004_bakdoor",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["base link"],
      numeric: {
        installCost: 2,
        memoryCost: 2,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
      baseLink: 1,
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
            baseLink: 3,
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
            amount: 2,
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
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_004_bakdoor",
      setId: "originalset-v1",
      collectorNumber: "004",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
