import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

const trashAtEndOfTurn = capabilityKey("trash_at_end_of_turn");

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_168_loan-from-chiba"),
    title: "Loan from Chiba",
    side: "runner",
    cardType: "resource",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Gain [12] when Loan from Chiba is installed. At the start of each of your turns, lose [1]. If Loan from Chiba leaves play, pay [10] or lose the game. You may trash Loan from Chiba at the end of any of your turns.",
    capabilityText: [
      {
        capabilityKey: trashAtEndOfTurn,
        actionLabel: "Loan from Chiba trashen",
      },
    ],
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      { source: "card_text", reference: "onr_v1_168_loan-from-chiba" },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: [],
      numeric: {
        installCost: 0,
        memoryCost: null,
        rezCost: null,
        trashCost: null,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: { kind: "not_applicable" },
    },
    lifecycle: {
      on_install: [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 12,
          visibility: "public",
        },
      ],
      start_of_runner_turn: [
        {
          effects: [
            {
              kind: "lose_credits",
              recipient: "controller",
              amount: 1,
              visibility: "public",
            },
          ],
        },
      ],
      on_leave_play: [
        {
          kind: "pay_credits_or_lose_game",
          payer: "controller",
          amount: 10,
          loseSide: "controller",
          reason: "source_left_play",
          visibility: "public",
        },
      ],
      end_of_runner_turn: [
        {
          capabilityKey: trashAtEndOfTurn,
          addressability: ["plan", "action", "debug"],
          effects: [{ kind: "trash_source", visibility: "public" }],
        },
      ],
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      { kind: "plan_role", role: "credit_swing" },
      { kind: "strategic_exchange", exchange: "debt_financing" },
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
        severity: "medium",
      },
      {
        kind: "risk_interpretation",
        risk: "loss_condition",
        severity: "high",
      },
    ],
    capabilities: [
      {
        capabilityKey: trashAtEndOfTurn,
        annotations: [
          { kind: "plan_owner", owner: "runner.resource_lifecycle" },
        ],
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_168_loan-from-chiba",
      setId: "originalset-v1",
      collectorNumber: "168",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
