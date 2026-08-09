import { describe, expect, it } from "vitest";

import { AI_HINTS_BY_CARD } from "../ai-hints";
import { runnerDefinitionIsHighRiskLoan } from "./runner-loan-source";

describe("runner loan source compatibility", () => {
  it("recognizes the CardSpec-derived Loan from Chiba lifecycle", () => {
    expect(
      runnerDefinitionIsHighRiskLoan("onr_v1_168_loan-from-chiba", {
        hintForDefinitionId: (definitionId) =>
          AI_HINTS_BY_CARD.get(definitionId),
      }),
    ).toBe(true);
  });
});
