import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_177_the-short-circuit"),
    title: "The Short Circuit",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "A, [1]: Search your stack for a program. Show that program to the Corp, and then bring it into your hand. Reshuffle your stack afterwards.",
    capabilityText: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_runner_main_search_stack_to_grip",
        ),
        actionLabel: "The Short Circuit: Stack nach Programm durchsuchen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_177_the-short-circuit",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["bbs"],
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
          "abilities_activated_runner_main_search_stack_to_grip",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "runner_main",
        costs: [
          {
            kind: "action",
            amount: 1,
          },
          {
            kind: "credit",
            amount: 1,
          },
        ],
        effects: [
          {
            kind: "search_stack_to_grip",
            filter: "program",
            revealToCorp: true,
            shuffleAfterwards: true,
            visibility: "hidden_info_barrier",
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
        kind: "strategic_role",
        role: "enabler",
      },
      {
        kind: "line_support",
        lineKey: "runner.search.breaker",
        support: "supports",
      },
    ],
    capabilities: [
      {
        capabilityKey: capabilityKey(
          "abilities_activated_runner_main_search_stack_to_grip",
        ),
        annotations: [
          {
            kind: "target_preference",
            purpose: "program_search_to_hand",
            preferences: [
              "program_repairs_missing_coverage",
              "best_cards_for_current_plan",
              "best_cards_for_current_state",
            ],
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_177_the-short-circuit",
      setId: "originalset-v1",
      collectorNumber: "177",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
