import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_proteus_154_wired-switchboard"),
    title: "Wired Switchboard",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "[T]: +3 link. Use this ability only after you and the Corp have revealed how much each of you spent on the trace attempt. Hidden resources are installed face down, but are put into the trash face up.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "trace_post_bid_trash_source_link_plus_three",
        ),
        actionLabel: "Wired Switchboard: +3 Link",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_proteus_154_wired-switchboard",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_proteus",
      subtypes: ["hidden"],
      numeric: {
        installCost: 0,
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
          "trace_post_bid_trash_source_link_plus_three",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "trace_post_bid_link_window",
        costs: [
          {
            kind: "trash_source",
            amount: 1,
          },
        ],
        limit: {
          kind: "once_per_trace_per_source",
          scope: "source",
        },
        effects: [
          {
            kind: "increase_trace_link",
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
      printingId: "onr_proteus_154_wired-switchboard",
      setId: "proteus",
      collectorNumber: "P154",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
