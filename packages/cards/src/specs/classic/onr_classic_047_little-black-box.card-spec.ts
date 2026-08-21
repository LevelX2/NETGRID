import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_classic_047_little-black-box"),
    title: "Little Black Box",
    side: "runner",
    cardType: "hardware",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Provides +1 MU and +1 hand size. Prevent up to 1 Net or brain damage each turn. Put [1] from the bank on Little Black Box when it is installed. Use this bit only to pay for increasing your link. If you use the bit, replace it from the bank at the start of your next turn. Only one deck can be in play at a time. Trash any older decks.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_classic_047_little-black-box",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr_classic",
      subtypes: ["deck"],
      numeric: {
        installCost: 4,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      memoryLimitBonus: 1,
      maxHandSizeBonus: 1,
      recurringCredits: 1,
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
      {
        kind: "hand_size",
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
      usableFor: ["increase_link"],
      refresh: {
        timing: "start_of_runner_turn",
        mode: "refill_to_capacity_if_used",
      },
    },
    damagePreventionSources: [
      {
        capabilityKey: capabilityKey("prevent_one_net_or_core_damage"),
        addressability: ["plan", "action", "quote", "debug"],
        kind: "damage_prevention",
        damageTypes: ["net", "core"],
        amount: 1,
        amountMode: "up_to",
        limit: {
          kind: "per_turn",
          amount: 1,
        },
        cost: {
          kind: "none",
        },
        priority: 122,
        visibility: "public",
      },
    ],
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
        kind: "plan_role",
        role: "survive_net_damage",
      },
      {
        kind: "plan_role",
        role: "survive_core_damage",
      },
      {
        kind: "plan_role",
        role: "trace_bid_support",
      },
      {
        kind: "risk_interpretation",
        risk: "opportunity_cost",
        severity: "medium",
      },
      {
        kind: "risk_interpretation",
        risk: "reserve_risk",
        severity: "medium",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_classic_047_little-black-box",
      setId: "classic",
      collectorNumber: "C047",
      rarity: "rare",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
