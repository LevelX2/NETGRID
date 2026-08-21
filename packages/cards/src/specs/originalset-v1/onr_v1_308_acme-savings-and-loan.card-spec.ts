import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_308_acme-savings-and-loan"),
    title: "ACME Savings and Loan",
    side: "corp",
    cardType: "asset",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Rezzing ACME S&L costs 1 agenda point, in addition to the normal cost. When you rez ACME S&L, gain [12] and trash ACME S&L. For the remainder of the game, pay [1] at the end of each of your turns, or lose the game. You can remove this effect, and score 1 agenda point, by taking an action to pay [12].",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      {
        source: "card_text",
        reference: "onr_v1_308_acme-savings-and-loan",
      },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["transactions"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 0,
        trashCost: 0,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: {
        kind: "not_applicable",
      },
    },
    remainingReplacementLongtail: {
      capabilityKey: capabilityKey(
        "remaining_replacement_longtail_obligation_debt",
      ),
      addressability: ["plan", "action", "quote", "debug"],
      kind: "obligation_debt",
      agendaPointRezCost: 1,
      gainCreditsOnRez: 12,
      endTurnCreditDebt: 1,
      removeDebtCost: 12,
      agendaPointsOnRemove: 1,
      visibility: "public",
    },
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      {
        kind: "plan_role",
        role: "recover_economy",
      },
      {
        kind: "plan_role",
        role: "managed_risk_economy",
      },
      {
        kind: "strategy_anchor",
        strategyKey: "corp.asset_economy",
      },
      {
        kind: "tactic_interpretation",
        signal: "economy.card",
        use: "economy.card",
      },
      {
        kind: "remote_role",
        role: "asset_economy",
        threatLevel: "medium",
      },
      {
        kind: "value_interpretation",
        axis: "economy",
        rating: "very_high",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "very_high",
      },
      {
        kind: "risk_interpretation",
        risk: "loss_condition",
        severity: "high",
      },
      {
        kind: "risk_interpretation",
        risk: "agenda_point_rez_cost",
        severity: "high",
      },
      {
        kind: "risk_interpretation",
        risk: "recurring_debt_and_exit_cost",
        severity: "high",
      },
    ],
    capabilities: [],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_308_acme-savings-and-loan",
      setId: "originalset-v1",
      collectorNumber: "308",
      rarity: "uncommon",
    },
  ],
  publication: {
    schemaVersion: "card-publication-v1",
    status: "active",
  },
} satisfies CardSpec;
