import type { GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { corpGeneralCreditAvailability } from "./corp-general-credit-availability";

function state(total: number, reserved?: number): GameState {
  return {
    corp: { credits: total },
    ...(reserved === undefined
      ? {}
      : {
          corpTemporaryInstallRezCredits: {
            sourceCardInstanceId: "source",
            sourceDefinitionId: "source-definition",
            remaining: reserved,
            usableFor: "corp_install_or_rez",
            returnUnusedAtTurnEnd: true,
          },
        }),
  } as GameState;
}

describe("Corp general credit availability", () => {
  it("subtracts the included reserve exactly without mutating either pool", () => {
    const current = state(4, 3);
    expect(corpGeneralCreditAvailability(current)).toBe(1);
    expect(current.corp.credits).toBe(4);
    expect(current.corpTemporaryInstallRezCredits?.remaining).toBe(3);
    expect(corpGeneralCreditAvailability(state(3, 3))).toBe(0);
    expect(corpGeneralCreditAvailability(state(4))).toBe(4);
  });

  it.each([
    [-1, 0],
    [2, 3],
    [3, -1],
    [3, 0.5],
    [3, Number.NaN],
    [Number.NaN, 0],
  ])(
    "fails closed for malformed total/reserved amounts %s/%s",
    (total, reserved) => {
      expect(() =>
        corpGeneralCreditAvailability(state(total!, reserved!)),
      ).toThrow("Creditpool ist ungültig");
    },
  );
});
