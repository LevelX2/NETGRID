import { describe, expect, it } from "vitest";

import {
  runnerDefinitionIsHighRiskLoan,
  runnerLoanValueHint,
} from "./runner-loan-source";

describe("runner loan source compatibility", () => {
  it("recognizes the CardSpec-derived Loan from Chiba lifecycle", () => {
    expect(
      runnerDefinitionIsHighRiskLoan("onr_v1_168_loan-from-chiba"),
    ).toBe(true);
    expect(
      runnerLoanValueHint(
        "onr_v1_168_loan-from-chiba",
        "leavePlayPayCost",
      ),
    ).toBe(10);
  });
});
