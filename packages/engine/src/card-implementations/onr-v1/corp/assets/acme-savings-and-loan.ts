import type { CardImplementationDefinition } from "../../../types";

// card name: ACME Savings and Loan
// text: Rezzing ACME S&L costs 1 agenda point, in addition to the normal cost. When you rez ACME S&L, gain [12] and trash ACME S&L. For the remainder of the game, pay [1] at the end of each of your turns, or lose the game. You can remove this effect, and score 1 agenda point, by taking an action to pay [12].
export const acmeSavingsAndLoanImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_308_acme-savings-and-loan",
  remainingReplacementLongtail: {
    kind: "obligation_debt",
    agendaPointRezCost: 1,
    gainCreditsOnRez: 12,
    endTurnCreditDebt: 1,
    removeDebtCost: 12,
    agendaPointsOnRemove: 1,
    visibility: "public",
  },
};
