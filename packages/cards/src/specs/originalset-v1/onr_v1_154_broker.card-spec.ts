import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

const storeCredits = capabilityKey("store_credits");
const withdrawCredits = capabilityKey("withdraw_credits");

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_154_broker"),
    title: "Broker",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Each of your turns, you may take only one action to use Broker. A: Put [3] from the bank on Broker. A: Take all the bits from Broker.",
    capabilityText: [
      {
        capabilityKey: storeCredits,
        actionLabel: "Broker: 3 Credits auf Broker legen",
      },
      {
        capabilityKey: withdrawCredits,
        actionLabel: "Broker: Credits von Broker nehmen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [{ source: "card_text", reference: "onr_v1_154_broker" }],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["connection"],
      numeric: {
        installCost: 3,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: { kind: "not_applicable" },
    },
    abilities: [
      {
        capabilityKey: storeCredits,
        addressability: ["plan", "action", "debug"],
        kind: "activated",
        timing: "runner_main",
        costs: [{ kind: "action", amount: 1 }],
        limit: {
          kind: "once_per_turn_per_source",
          scope: "any_ability_on_source",
        },
        effects: [
          {
            kind: "add_hosted_credits",
            target: "source",
            amount: 3,
            visibility: "public",
          },
        ],
      },
      {
        capabilityKey: withdrawCredits,
        addressability: ["plan", "action", "debug"],
        kind: "activated",
        timing: "runner_main",
        costs: [{ kind: "action", amount: 1 }],
        condition: { kind: "source_has_hosted_credits" },
        limit: {
          kind: "once_per_turn_per_source",
          scope: "any_ability_on_source",
        },
        effects: [
          {
            kind: "take_hosted_credits",
            source: "source",
            recipient: "controller",
            mode: "all",
            visibility: "public",
          },
        ],
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      { kind: "plan_role", role: "build_rig" },
      { kind: "plan_role", role: "recover_economy" },
      { kind: "plan_role", role: "click_for_credits_when_safe" },
      { kind: "plan_role", role: "resource_value_engine" },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "medium",
        rationale: "Reusable credit storage and cashout engine.",
      },
    ],
    capabilities: [
      {
        capabilityKey: storeCredits,
        annotations: [
          {
            kind: "plan_owner",
            owner: "runner.credit_bank",
            route: "build",
          },
        ],
      },
      {
        capabilityKey: withdrawCredits,
        annotations: [
          {
            kind: "plan_owner",
            owner: "runner.credit_bank",
            route: "cash_out",
          },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_154_broker",
      setId: "originalset-v1",
      collectorNumber: "154",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
