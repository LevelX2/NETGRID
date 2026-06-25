import type { CardImplementationDefinition } from "../../../types";

// card name: Investment Firm
// text: Take [1] from Investment Firm, if it has any bits, at the start of each of your turns. Whenever [1] or more bits are added to your pool, you may put [2] from the bank on Investment Firm for each [1] you choose not to add to your pool. Effects that give you bits at the start of your turn cannot be used this way.
export const investmentFirmImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_329_investment-firm",
  remainingReplacementLongtail: {
    kind: "basic_credit_diversion_to_recurring_credits",
    counterType: "recurring_credit",
    hostedCreditsPerDivertedCredit: 2,
    startTurnTakeCredits: 1,
    excludeStartTurnCreditGains: true,
    visibility: "public",
  },
};
