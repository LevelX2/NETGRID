import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

const takeHostedCredits = capabilityKey(
  "abilities_activated_runner_main_take_hosted_credits",
);

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_178_short-term-contract"),
    title: "Short-Term Contract",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Put [12] from the bank on Short-Term Contract when it is installed. When all the bits have been removed, trash Short-Term Contract. A: Take [2] from Short-Term Contract.",
    capabilityText: [
      {
        capabilityKey: takeHostedCredits,
        actionLabel: "Short-Term Contract: bis zu 2 gehostete Credits nehmen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_178_short-term-contract",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["position"],
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
    lifecycle: {
      on_install: [
        {
          kind: "add_hosted_credits",
          target: "source",
          amount: 12,
          visibility: "public",
        },
      ],
    },
    abilities: [
      {
        capabilityKey: takeHostedCredits,
        addressability: ["plan", "action", "quote", "debug"],
        kind: "activated",
        timing: "runner_main",
        costs: [
          {
            kind: "action",
            amount: 1,
          },
        ],
        condition: {
          kind: "source_has_hosted_credits",
        },
        effects: [
          {
            kind: "take_hosted_credits",
            source: "source",
            recipient: "controller",
            amount: 2,
            mode: "up_to_amount_if_available",
            visibility: "public",
          },
          {
            kind: "trash_source_when_empty",
            source: "source",
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
        role: "recover_economy",
      },
      {
        kind: "plan_role",
        role: "click_for_credits_when_safe",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "high",
      },
    ],
    capabilities: [
      {
        capabilityKey: takeHostedCredits,
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
      printingId: "onr_v1_178_short-term-contract",
      setId: "originalset-v1",
      collectorNumber: "178",
      rarity: "common",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
