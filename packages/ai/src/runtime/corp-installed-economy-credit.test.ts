import { describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";

import { corpInstalledEconomyCreditAmount } from "./corp-installed-economy-credit";

describe("corpInstalledEconomyCreditAmount", () => {
  it("uses structured gain payloads instead of label text", () => {
    expect(
      corpInstalledEconomyCreditAmount(
        legalAction({ payload: { gainCreditsAmount: 4 } }),
      ),
    ).toBe(4);
    expect(
      corpInstalledEconomyCreditAmount(
        legalAction({ payload: { cardImplementationCreditAmount: 3 } }),
      ),
    ).toBe(3);
    expect(
      corpInstalledEconomyCreditAmount(
        legalAction({ label: "Installed Asset: 9 Credits nehmen" }),
      ),
    ).toBe(0);
  });
});

function legalAction(
  overrides: Partial<LegalAction> = {},
): LegalAction {
  return {
    actionId: "corp-credit-action",
    side: "corp",
    type: "gain_credit",
    label: "Corp installed economy",
    source: "corp-source",
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  } as LegalAction;
}
