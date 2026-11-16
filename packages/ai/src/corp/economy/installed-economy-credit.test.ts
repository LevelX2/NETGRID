import { describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";

import { corpInstalledEconomyCreditAmount } from "./installed-economy-credit";

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

  it.each([
    [{ gainCreditsAmount: 2, cardImplementationCreditAmount: 2 }, 2],
    [{ gainCreditsAmount: true }, 0],
    [{ gainCreditsAmount: 1.5 }, 0],
    [{ gainCreditsAmount: 2, cardImplementationCreditAmount: 3 }, 0],
    [{ gainCreditsAmount: 2, cardImplementationCreditAmount: "2" }, 0],
  ])(
    "requires positive integers and consistent aliases: %o",
    (payload, expected) => {
      expect(corpInstalledEconomyCreditAmount(legalAction({ payload }))).toBe(
        expected,
      );
    },
  );
});

function legalAction(overrides: Partial<LegalAction> = {}): LegalAction {
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
