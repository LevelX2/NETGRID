import { describe, expect, it } from "vitest";
import { scoreRunnerEvent, scoreRunnerInstall } from "./runner-card-action-score";

describe("runner-card-action-score", () => {
  it("matches runner install roles by bounded role terms", () => {
    expect(
      scoreRunnerInstall(
        ["support_memory"],
        {
          credits: 3,
          handCount: 5,
          memoryRemaining: 1,
          rigRoles: new Set(),
        },
        { setup: 1 },
      ),
    ).toBe(630);

    expect(
      scoreRunnerInstall(
        ["memoryish_noise"],
        {
          credits: 3,
          handCount: 5,
          memoryRemaining: 1,
          rigRoles: new Set(),
        },
        { setup: 1 },
      ),
    ).toBe(470);
  });

  it("matches runner event roles by bounded role terms", () => {
    expect(
      scoreRunnerEvent(
        ["burst_economy", "draw", "run_pressure"],
        { credits: 3, handCount: 2, memoryRemaining: 3, rigRoles: new Set() },
        { economy: 1, run: 1 },
      ),
    ).toBe(890);

    expect(
      scoreRunnerEvent(
        ["economyish_noise", "drawish_noise", "run_pressureish_noise"],
        { credits: 3, handCount: 2, memoryRemaining: 3, rigRoles: new Set() },
        { economy: 1, run: 1 },
      ),
    ).toBe(420);
  });
});
