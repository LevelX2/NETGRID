import { describe, expect, it } from "vitest";
import type { LegalAction, VisibleCard } from "@netgrid/shared";
import { remoteTrashQuotedDedicatedCredits } from "./remote-trash-cost";

describe("remoteTrashQuotedDedicatedCredits", () => {
  it("uses only the current offer's matching restricted pool and caps it at the cost", () => {
    expect(
      dedicatedCredits("upgrade", {
        upgradeTrashRecurringCreditsAvailable: 7,
        poltergeistRecurringCreditsAvailable: 2,
      }),
    ).toBe(5);
    expect(
      dedicatedCredits("asset", {
        upgradeTrashRecurringCreditsAvailable: 7,
        poltergeistRecurringCreditsAvailable: 2,
      }),
    ).toBe(2);
    expect(
      dedicatedCredits("asset", {
        upgradeTrashRecurringCreditsAvailable: 7,
      }),
    ).toBe(0);
    expect(
      dedicatedCredits(
        "upgrade",
        {
          upgradeTrashRecurringCreditsAvailable: 3,
        },
        "different-target",
      ),
    ).toBe(0);
  });
});

function dedicatedCredits(
  type: "asset" | "upgrade",
  creditQuote: NonNullable<LegalAction["payload"]>,
  source = "accessed",
): number {
  const action: LegalAction = {
    actionId: "trash",
    side: "runner",
    type: "trash_accessed_card",
    label: "Trash accessed card",
    source,
    payload: { accessTrashTotalCost: 5, ...creditQuote },
    timingPoint: "access.resolve_card",
    costs: [{ credits: 5 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
  const accessed: VisibleCard = { instanceId: "accessed", known: true, type };
  return remoteTrashQuotedDedicatedCredits(action, accessed);
}
