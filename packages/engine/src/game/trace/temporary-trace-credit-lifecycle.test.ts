import type { GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { returnUnusedCorpTraceWindowCredits } from "./temporary-trace-credit-lifecycle";

describe("temporary trace credit lifecycle", () => {
  it("returns the exact unused temporary amount to the bank", () => {
    const current = stateWithTemporaryTraceCredits(3);

    expect(returnUnusedCorpTraceWindowCredits(current)).toEqual({
      temporaryTraceCreditsReturned: 3,
      temporaryTraceCreditsSourceDefinitionId:
        "onr_proteus_061_ldl-traffic-analyzers",
      corpCreditsAfter: 6,
    });
    expect(current.corp.credits).toBe(6);
    expect(current.trace?.corpTemporaryTraceCredits?.remaining).toBe(0);
  });

  it("rejects invalid remaining amounts before mutating Corp credits", () => {
    for (const remaining of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      -1,
      1.5,
    ]) {
      const current = stateWithTemporaryTraceCredits(remaining);

      expect(() => returnUnusedCorpTraceWindowCredits(current)).toThrow(
        "Der temporäre Trace-Credit-Restbetrag ist ungültig.",
      );
      expect(current.corp.credits).toBe(9);
      expect(current.trace?.corpTemporaryTraceCredits?.remaining).toBe(
        remaining,
      );
    }
  });
});

function stateWithTemporaryTraceCredits(remaining: number): GameState {
  return {
    corp: { credits: 9 },
    trace: {
      corpTemporaryTraceCredits: {
        sourceCardInstanceId: "ldl_1",
        sourceDefinitionId: "onr_proteus_061_ldl-traffic-analyzers",
        remaining,
        includedInCorpCreditPool: true,
        usableFor: "unrestricted_during_current_trace",
        returnUnusedAtTraceEnd: true,
      },
    },
  } as unknown as GameState;
}
