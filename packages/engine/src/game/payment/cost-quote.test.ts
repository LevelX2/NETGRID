import { describe, expect, it } from "vitest";
import { costQuotePublicPayload, costQuoteToLegalActionCosts, type CostQuote } from "./cost-quote";

describe("cost quote projection", () => {
  it("returns copies of LegalAction costs and their public payload", () => {
    const quote: CostQuote = {
      purpose: "corp_rez",
      side: "corp",
      targetCardId: "ice-1",
      baseCredits: 4,
      finalCredits: 2,
      costs: [{ credits: 2 }],
      modifiers: [],
      canPay: true,
      publicPayload: { cardId: "ice-1", rezCostPaid: 2 },
    };

    const costs = costQuoteToLegalActionCosts(quote);
    const payload = costQuotePublicPayload(quote);
    costs[0]!.credits = 99;
    payload.rezCostPaid = 99;

    expect(quote.costs).toEqual([{ credits: 2 }]);
    expect(quote.publicPayload).toEqual({ cardId: "ice-1", rezCostPaid: 2 });
  });
});
