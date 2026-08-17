import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId(
      "onr_classic_048_omnitech-spinal-tap-cybermodem",
    ),
    title: 'Omnitech "Spinal Tap" Cybermodem',
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      'Provides +1 Mu. Put [2] from the bank on Omnitech "Spinal Tap" Cybermodem when it is installed. Use this bits only to pay for using icebreakers during runs or increasing your link. If you use any of these bits, replace them at the start of your next turn. At the start of each of your turns roll a die. On a 1, suffer 2 brain damage. This damage cannot be prevented. If Omnitech "Spinal Tap" Cyermodem leaves play suffer 2 brain damage. Only one deck can be in play at a time. Trash any older decks.',
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_048_omnitech-spinal-tap-cybermodem",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["deck", "random"],
      numeric: {
        installCost: 5,
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
      memoryLimitBonus: 1,
      recurringCredits: 2,
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
          amount: 2,
          visibility: "public",
        },
      ],
      on_leave_play: [
        {
          kind: "damage",
          recipient: "runner",
          damageType: "core",
          amount: 2,
          preventable: true,
          visibility: "public",
        },
      ],
    },
    restrictedHostedCreditSource: {
      capacity: 2,
      counterType: "bit",
      usableFor: ["using_icebreaker_during_run", "increase_link"],
      refresh: {
        timing: "start_of_runner_turn",
        mode: "refill_to_capacity_if_used",
      },
    },
    runnerUtilityLongtail: {
      capabilityKey: capabilityKey("start_turn_random_core_damage"),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "start_turn_random_effect_table",
      dieFaces: 6,
      randomPurpose: "runner_start_turn_source",
      outcomes: [
        {
          roll: 1,
          kind: "unpreventable_damage",
          damageType: "core",
          amount: 2,
        },
      ],
      defaultOutcome: {
        kind: "no_effect",
      },
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "rig_setup",
      },
      {
        kind: "strategic_role",
        role: "support_tool",
      },
      {
        kind: "strategic_exchange",
        exchange: "self_damage",
      },
      {
        kind: "tactic_interpretation",
        signal: "damage.payoff",
        use: "damage.payoff.runner",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "high",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "high",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_048_omnitech-spinal-tap-cybermodem",
      setId: "classic",
      collectorNumber: "C048",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
