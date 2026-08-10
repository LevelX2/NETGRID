import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_140_raven-microcyb-eagle"),
    title: "Raven Microcyb Eagle",
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Provides +1 MU. Prevents 1 Net damage each turn. Put [1] from the bank on Microcyb Eagle when it is installed. Use this bit only to pay for using icebreakers during runs. If you use the bit, replace it at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_140_raven-microcyb-eagle",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["deck"],
      numeric: {
        installCost: 6,
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
      recurringCredits: 1,
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
    lifecycle: {
      on_install: [
        {
          kind: "add_hosted_credits",
          target: "source",
          amount: 1,
          visibility: "public",
        },
      ],
    },
    restrictedHostedCreditSource: {
      capacity: 1,
      counterType: "bit",
      usableFor: ["using_icebreaker_during_run"],
      refresh: {
        timing: "start_of_runner_turn",
        mode: "refill_to_capacity_if_used",
      },
    },
    damagePreventionSources: [
      {
        capabilityKey: capabilityKey(
          "damage_prevention_sources_damage_prevention",
        ),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage_prevention",
        damageTypes: ["net"],
        amount: 1,
        limit: {
          kind: "per_turn",
          amount: 1,
        },
        cost: {
          kind: "none",
        },
        priority: 124,
        visibility: "public",
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
        role: "run_support",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_140_raven-microcyb-eagle",
      setId: "originalset-v1",
      collectorNumber: "140",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
