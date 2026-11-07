import { describe, expect, it } from "vitest";
import { visibleRunnerRunCreditPool } from "./visible-run-credit-facts";

describe("visible Runner run-credit facts", () => {
  it("counts each eligible known pool once and keeps other credit purposes separate", () => {
    expect(
      visibleRunnerRunCreditPool([
        {
          known: false,
          counterDisplays: [
            {
              amount: 100,
              creditPool: { uses: ["using_icebreaker_during_run"] },
            },
          ],
        },
        {
          known: true,
          counterDisplays: [
            {
              amount: 3.8,
              creditPool: {
                uses: [
                  "using_icebreaker_during_run",
                  "using_killer_during_run",
                ],
              },
            },
            {
              amount: 2,
              creditPool: { uses: ["using_icebreaker_during_run_non_noisy"] },
            },
            { amount: 4, creditPool: { uses: ["using_killer_during_run"] } },
            { amount: 90, creditPool: { uses: ["paying_to_trash"] } },
            { amount: 80 },
            {
              amount: -2,
              creditPool: { uses: ["using_icebreaker_during_run"] },
            },
          ],
        },
        { known: true },
      ]),
    ).toBe(9);
    expect(visibleRunnerRunCreditPool([])).toBe(0);
  });
});
